import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const MAX_PASSWORD_LENGTH = 128;

const DUMMY_SALT = "0".repeat(32);
const DUMMY_HASH = scryptSync("not-a-real-password", DUMMY_SALT, 64).toString("hex");

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function verifyPasswordOrDummy(
  password: string,
  salt?: string,
  hash?: string,
) {
  if (salt && hash) return verifyPassword(password, salt, hash);
  verifyPassword(password, DUMMY_SALT, DUMMY_HASH);
  return false;
}
