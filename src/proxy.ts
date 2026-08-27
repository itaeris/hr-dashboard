import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic =
    pathname === "/login" ||
    pathname === "/recruitment-request" ||
    pathname === "/api/auth/google" ||
    pathname === "/api/auth/google/callback" ||
    pathname === "/api/auth/google/calendar" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon.") ||
    pathname.startsWith("/apple-icon") ||
    pathname.includes("opengraph-image") ||
    pathname.includes("twitter-image");

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    const next =
      pathname.startsWith("/") &&
      !pathname.startsWith("//") &&
      !pathname.includes("\\") &&
      !pathname.includes("://")
        ? pathname
        : "";
    if (next && next !== "/") {
      login.searchParams.set("next", next);
    }
    return NextResponse.redirect(login);
  }

  if (session && isPublic && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|logo/|icon$|apple-icon|opengraph-image|twitter-image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
