import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { homePathForUser, resolveAuthUser } from "@/lib/auth/app-users";
import {
  GOOGLE_INTENT_COOKIE,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  googleCallbackUrl,
  isAllowedGoogleEmail,
  safeCalendarNext,
} from "@/lib/auth/google";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth/session-token";
import { saveGoogleRefreshToken } from "@/lib/google-calendar/tokens";

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  response.cookies.delete(GOOGLE_INTENT_COOKIE);
  response.cookies.delete(GOOGLE_NEXT_COOKIE);
}

function loginError(request: NextRequest, code: string) {
  const base = process.env.AUTH_URL || request.url;
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, base));
  clearOauthCookies(response);
  return response;
}

function calendarResult(request: NextRequest, next: string, flag: string) {
  const dest = new URL(next, process.env.AUTH_URL || request.url);
  dest.searchParams.set("google", flag);
  const response = NextResponse.redirect(dest);
  clearOauthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const intent = request.cookies.get(GOOGLE_INTENT_COOKIE)?.value;
  const next = safeCalendarNext(request.cookies.get(GOOGLE_NEXT_COOKIE)?.value ?? null);
  const calendarFlow = intent === "calendar";

  if (!clientId || !clientSecret) {
    return calendarFlow ? calendarResult(request, next, "config") : loginError(request, "config");
  }

  const url = request.nextUrl;
  if (url.searchParams.get("error")) {
    return calendarFlow ? calendarResult(request, next, "denied") : loginError(request, "denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !savedState || state !== savedState) {
    return calendarFlow ? calendarResult(request, next, "oauth") : loginError(request, "oauth");
  }

  const redirectUri = googleCallbackUrl(process.env.AUTH_URL || url.origin);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return calendarFlow ? calendarResult(request, next, "oauth") : loginError(request, "oauth");
  }
  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
  };
  if (!tokens.access_token) {
    return calendarFlow ? calendarResult(request, next, "oauth") : loginError(request, "oauth");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return calendarFlow ? calendarResult(request, next, "oauth") : loginError(request, "oauth");
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  if (!profile.sub || !profile.email) {
    return calendarFlow ? calendarResult(request, next, "oauth") : loginError(request, "oauth");
  }
  if (profile.email_verified === false || !isAllowedGoogleEmail(profile.email)) {
    return calendarFlow ? calendarResult(request, next, "domain") : loginError(request, "domain");
  }

  if (calendarFlow) {
    const granted = tokens.scope ?? "";
    if (!granted.includes("calendar.events") && !granted.includes("calendar")) {
      return calendarResult(request, next, "consent");
    }
    if (!tokens.refresh_token) {
      return calendarResult(request, next, "consent");
    }
    const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
    await saveGoogleRefreshToken(session?.email ?? profile.email, tokens.refresh_token);
    return calendarResult(request, next, "connected");
  }

  const user = await resolveAuthUser({
    id: `g_${profile.sub}`,
    email: profile.email,
    name: profile.name?.trim() || profile.email.split("@")[0],
  });

  const dest = await homePathForUser(user);
  const home = new URL(dest, process.env.AUTH_URL || request.url);
  const response = NextResponse.redirect(home);
  clearOauthCookies(response);
  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
