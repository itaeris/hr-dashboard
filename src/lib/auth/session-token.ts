import { createHmac, timingSafeEqual } from "crypto";
import type { AuthUser } from "./users";

export const SESSION_COOKIE = "hr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type Session = AuthUser & { exp: number };

export function hasAuthSecret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    return Boolean(value && value.length >= 32);
  }
  return true;
}

export function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!value || value.length < 32) {
      throw new Error("AUTH_SECRET must be set to a long random string.");
    }
    return value;
  }
  return value || "dev-only-hr-dashboard-secret";
}

export function sessionCookieOptions() {
  const secure =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.AUTH_URL?.startsWith("https://"));
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure,
  };
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function encodeSession(user: AuthUser) {
  const session: Session = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;
    if (!session?.email || !session?.role || !session.exp) return null;
    if (session.exp < Date.now()) return null;
    if (session.role !== "admin" && session.role !== "hr" && session.role !== "it") return null;
    return session;
  } catch {
    return null;
  }
}
