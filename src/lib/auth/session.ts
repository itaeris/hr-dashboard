import { cookies } from "next/headers";
import type { AuthUser } from "./users";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./session-token";

export type { Session } from "./session-token";
export { decodeSession, encodeSession, SESSION_COOKIE };

export async function getSession() {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(user: AuthUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions());
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}
