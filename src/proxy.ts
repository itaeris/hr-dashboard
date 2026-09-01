import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session-token";
import { isCompanySlug } from "@/lib/companies";

function itPathAllowed(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts[0];
  if (!slug || !isCompanySlug(slug)) return true;
  const rest = parts.slice(1).join("/");
  return rest === "onboarding" || rest.startsWith("onboarding/") || rest === "settings";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic =
    pathname === "/login" ||
    pathname === "/recruitment-request" ||
    pathname === "/api/auth/google" ||
    pathname === "/api/auth/google/callback" ||
    pathname === "/api/auth/google/calendar" ||
    pathname.startsWith("/api/cron/") ||
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

  if (session?.role === "it" && !pathname.startsWith("/api/") && !itPathAllowed(pathname)) {
    const slug = pathname.split("/").filter(Boolean)[0];
    const home = isCompanySlug(slug ?? "") ? `/${slug}/onboarding` : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|logo/|icon$|apple-icon|opengraph-image|twitter-image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
