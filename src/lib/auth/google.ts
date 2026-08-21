import { findUserByEmail, toPublicUser, type AuthUser } from "./users";

export const ALLOWED_GOOGLE_DOMAINS = [
  "aerisbeaute.com",
  "fromthisisland.com",
] as const;

export const GOOGLE_STATE_COOKIE = "hr_oauth_state";

export function appOrigin(requestOrigin: string) {
  return (process.env.AUTH_URL || requestOrigin).replace(/\/$/, "");
}

export function googleCallbackUrl(origin: string) {
  return `${appOrigin(origin)}/api/auth/google/callback`;
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
  if (!email || profile.email_verified === false) return null;
  if (!isAllowedGoogleEmail(email)) return null;

  const existing = findUserByEmail(email);
  if (existing) return toPublicUser(existing);

  return {
    id: `g_${profile.sub}`,
    email,
    name: profile.name?.trim() || email.split("@")[0],
    role: "hr",
  };
}
