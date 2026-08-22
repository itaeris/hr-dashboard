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
    pathname === "/api/auth/google/calendar";

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    const next = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "";
    if (next && next !== "/" && !next.includes("://")) {
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
    "/((?!_next/static|_next/image|favicon.ico|sw.js|logo/|.*\\.png$|.*\\.svg$).*)",
  ],
};
