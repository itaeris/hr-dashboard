import { createHmac, timingSafeEqual } from "crypto";
import type { AuthUser } from "./users";

export const SESSION_COOKIE = "hr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type Session = AuthUser & { exp: number };

function secret() {
  return process.env.AUTH_SECRET ?? "dev-only-hr-dashboard-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function equal(left: string, right: string) {
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
  if (!equal(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;
    if (!session?.email || !session?.role || !session.exp) return null;
    if (session.exp < Date.now()) return null;
    if (session.role !== "admin" && session.role !== "hr") return null;
    return session;
  } catch {
    return null;
  }
}
