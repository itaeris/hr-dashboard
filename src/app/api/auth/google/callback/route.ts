import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  googleCallbackUrl,
  userFromGoogleProfile,
} from "@/lib/auth/google";
import { encodeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session-token";

function loginError(request: NextRequest, code: string) {
  const base = process.env.AUTH_URL || request.url;
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, base));
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return loginError(request, "config");

  const url = request.nextUrl;
  if (url.searchParams.get("error")) return loginError(request, "denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !savedState || state !== savedState) {
    return loginError(request, "oauth");
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

  if (!tokenRes.ok) return loginError(request, "oauth");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return loginError(request, "oauth");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return loginError(request, "oauth");

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  if (!profile.sub || !profile.email) return loginError(request, "oauth");
  const user = userFromGoogleProfile({
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
    email_verified: profile.email_verified,
  });
  if (!user) return loginError(request, "domain");

  const home = new URL("/", process.env.AUTH_URL || request.url);
  const response = NextResponse.redirect(home);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
