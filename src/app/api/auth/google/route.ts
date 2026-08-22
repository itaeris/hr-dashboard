import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GOOGLE_STATE_COOKIE, PRODUCTION_ORIGIN, googleCallbackUrl } from "@/lib/auth/google";
import { hasAuthSecret, sessionCookieOptions } from "@/lib/auth/session-token";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base =
    process.env.AUTH_URL?.startsWith("http")
      ? process.env.AUTH_URL
      : request.nextUrl.origin || PRODUCTION_ORIGIN;
  if (!clientId || !hasAuthSecret()) {
    return NextResponse.redirect(new URL("/login?error=config", base));
  }

  const state = randomBytes(16).toString("hex");
  const origin = request.nextUrl.origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    ...sessionCookieOptions(),
    maxAge: 600,
  });
  return response;
}
