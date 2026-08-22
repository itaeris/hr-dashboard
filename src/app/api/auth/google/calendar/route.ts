import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_INTENT_COOKIE,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  googleCallbackUrl,
  safeCalendarNext,
} from "@/lib/auth/google";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session-token";

export async function GET(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const next = safeCalendarNext(request.nextUrl.searchParams.get("next"));
  if (!session) {
    const login = new URL("/login", process.env.AUTH_URL || request.url);
    if (next) login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL(`${next || "/"}?google=config`, process.env.AUTH_URL || request.url),
    );
  }

  const state = randomBytes(16).toString("hex");
  const origin = process.env.AUTH_URL || request.nextUrl.origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(origin),
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    login_hint: session.email,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  const cookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookie);
  response.cookies.set(GOOGLE_INTENT_COOKIE, "calendar", cookie);
  response.cookies.set(GOOGLE_NEXT_COOKIE, next, cookie);
  return response;
}
