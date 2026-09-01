import { findUserByEmail, toPublicUser, type AuthUser } from "./users";
import { createHash, randomBytes } from "crypto";
import { safeEqual } from "./session-token";

export const ALLOWED_GOOGLE_DOMAINS = [
  "aerisbeaute.com",
  "fromthisisland.com",
] as const;

export const GOOGLE_STATE_COOKIE = "hr_oauth_state";
export const GOOGLE_PKCE_COOKIE = "hr_oauth_pkce";
export const GOOGLE_INTENT_COOKIE = "hr_oauth_intent";
export const GOOGLE_NEXT_COOKIE = "hr_oauth_next";
export const GOOGLE_CALENDAR_SCOPE = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

const GOOGLE_NEXT = /^\/(aeris-beaute|from-this-island)\/(calendar|settings)\/?$/;

export function safeCalendarNext(value: string | null) {
  if (!value || !GOOGLE_NEXT.test(value)) return "/";
  return value.replace(/\/$/, "");
}

export const PRODUCTION_ORIGIN = "https://recruitment-fti.aerisbeaute.com";

export const LEGACY_ORIGINS = [
  "https://hr-recruitment-aeris-fti.vercel.app",
  "https://hr-dashboard-aeris-fti.vercel.app",
];

export function publicSiteUrl() {
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_ORIGIN;
  if (process.env.AUTH_URL?.startsWith("http")) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function allowedOrigins() {
  const extra = process.env.AUTH_URL?.replace(/\/$/, "");
  return [
    "http://localhost:3000",
    PRODUCTION_ORIGIN,
    ...LEGACY_ORIGINS,
    extra,
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);
}

export function appOrigin(requestOrigin: string) {
  const origin = requestOrigin.replace(/\/$/, "");
  if (allowedOrigins().includes(origin)) return origin;
  return (process.env.AUTH_URL || PRODUCTION_ORIGIN).replace(/\/$/, "");
}

export function googleCallbackUrl(origin: string) {
  return `${appOrigin(origin)}/api/auth/google/callback`;
}

export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function oauthStateMatches(received: string | null, saved: string | undefined) {
  if (!received || !saved) return false;
  return safeEqual(received, saved);
}

export function isAllowedGoogleEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(
    domain &&
      ALLOWED_GOOGLE_DOMAINS.includes(
        domain as (typeof ALLOWED_GOOGLE_DOMAINS)[number],
      ),
  );
}

export function userFromGoogleProfile(profile: {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}): AuthUser | null {
  const email = profile.email.trim().toLowerCase();
  if (!email || profile.email_verified !== true) return null;
  if (!isAllowedGoogleEmail(email)) return null;

  const existing = findUserByEmail(email);
  if (!existing) return null;
  return toPublicUser(existing);
}
