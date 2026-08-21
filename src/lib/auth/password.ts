import { scryptSync, timingSafeEqual } from "crypto";

export function verifyPassword(password: string, salt: string, hash: string) {
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}
