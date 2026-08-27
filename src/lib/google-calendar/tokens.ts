import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { authSecret } from "@/lib/auth/session-token";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanySlug } from "@/lib/types";
import { calendarCompanyFromEmail } from "./scope";

const memory = new Map<string, string>();

function key() {
  return createHash("sha256")
    .update(authSecret())
    .digest();
}

function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decrypt(payload: string) {
  const [iv, tag, encrypted] = payload.split(".");
  if (!iv || !tag || !encrypted) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function tokenKey(email: string, slug: CompanySlug) {
  return `${email.trim().toLowerCase()}::${slug}`;
}

function lookupKeys(email: string, slug: CompanySlug) {
  const normalized = email.trim().toLowerCase();
  const keys = [tokenKey(normalized, slug)];
  if (calendarCompanyFromEmail(normalized) === slug) keys.push(normalized);
  return keys;
}

export async function saveGoogleRefreshToken(
  email: string,
  slug: CompanySlug,
  refreshToken: string,
) {
  const scoped = tokenKey(email, slug);
  const refresh_cipher = encrypt(refreshToken);
  memory.set(scoped, refreshToken);

  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  const { error } = await supabase.from("hr_google_tokens").upsert({
    email: scoped,
    refresh_cipher,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Could not persist Google Calendar token", error.message);
  }
}

export async function loadGoogleRefreshToken(email: string, slug: CompanySlug) {
  for (const lookup of lookupKeys(email, slug)) {
    const cached = memory.get(lookup);
    if (cached) return cached;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  for (const lookup of lookupKeys(email, slug)) {
    const { data, error } = await supabase
      .from("hr_google_tokens")
      .select("refresh_cipher")
      .eq("email", lookup)
      .maybeSingle();
    if (error || !data?.refresh_cipher) continue;
    const token = decrypt(data.refresh_cipher as string);
    if (token) {
      memory.set(tokenKey(email, slug), token);
      return token;
    }
  }
  return null;
}

export async function deleteGoogleRefreshToken(email: string, slug: CompanySlug) {
  for (const lookup of lookupKeys(email, slug)) {
    memory.delete(lookup);
  }
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  for (const lookup of lookupKeys(email, slug)) {
    await supabase.from("hr_google_tokens").delete().eq("email", lookup);
  }
}

export async function hasGoogleCalendar(email: string, slug: CompanySlug) {
  return Boolean(await loadGoogleRefreshToken(email, slug));
}
