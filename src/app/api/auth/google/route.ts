import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_PKCE_COOKIE,
  GOOGLE_STATE_COOKIE,
  PRODUCTION_ORIGIN,
  createPkce,
  googleCallbackUrl,
} from "@/lib/auth/google";
import { clientIpFrom, oauthAllowed } from "@/lib/auth/rate-limit";
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

  const limit = oauthAllowed(clientIpFrom(request.headers));
  if (!limit.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth", base));
  }

  const state = randomBytes(32).toString("hex");
  const pkce = createPkce();
  const origin = request.nextUrl.origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  const cookie = { ...sessionCookieOptions(), maxAge: 600 };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookie);
  response.cookies.set(GOOGLE_PKCE_COOKIE, pkce.verifier, cookie);
  return response;
}
