import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GOOGLE_STATE_COOKIE, googleCallbackUrl } from "@/lib/auth/google";
import { sessionCookieOptions } from "@/lib/auth/session-token";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=config", process.env.AUTH_URL || request.url),
    );
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
