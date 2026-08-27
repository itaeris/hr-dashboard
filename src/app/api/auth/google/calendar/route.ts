import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_INTENT_COOKIE,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_PKCE_COOKIE,
  GOOGLE_STATE_COOKIE,
  createPkce,
  googleCallbackUrl,
  safeCalendarNext,
} from "@/lib/auth/google";
import { clientIpFrom, oauthAllowed } from "@/lib/auth/rate-limit";
import { decodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-token";

export async function GET(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const next = safeCalendarNext(request.nextUrl.searchParams.get("next"));
  const base = process.env.AUTH_URL || request.url;
  if (!session) {
    const login = new URL("/login", base);
    return NextResponse.redirect(login);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL(`${next || "/"}?google=config`, base));
  }

  const limit = oauthAllowed(clientIpFrom(request.headers));
  if (!limit.ok) {
    return NextResponse.redirect(new URL(`${next || "/"}?google=denied`, base));
  }

  const state = randomBytes(32).toString("hex");
  const pkce = createPkce();
  const origin = request.nextUrl.origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(origin),
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    login_hint: session.email,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  const cookie = { ...sessionCookieOptions(), maxAge: 600 };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookie);
  response.cookies.set(GOOGLE_PKCE_COOKIE, pkce.verifier, cookie);
  response.cookies.set(GOOGLE_INTENT_COOKIE, "calendar", cookie);
  response.cookies.set(GOOGLE_NEXT_COOKIE, next, cookie);
  return response;
}
