import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { authSecret } from "@/lib/auth/session-token";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

export async function saveGoogleRefreshToken(email: string, refreshToken: string) {
  const normalized = email.trim().toLowerCase();
  const refresh_cipher = encrypt(refreshToken);
  memory.set(normalized, refreshToken);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.from("hr_google_tokens").upsert({
    email: normalized,
    refresh_cipher,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Could not persist Google Calendar token", error.message);
  }
}

export async function loadGoogleRefreshToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const cached = memory.get(normalized);
  if (cached) return cached;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("hr_google_tokens")
    .select("refresh_cipher")
    .eq("email", normalized)
    .maybeSingle();
  if (error || !data?.refresh_cipher) return null;
  const token = decrypt(data.refresh_cipher as string);
  if (token) memory.set(normalized, token);
  return token;
}

export async function deleteGoogleRefreshToken(email: string) {
  const normalized = email.trim().toLowerCase();
  memory.delete(normalized);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from("hr_google_tokens").delete().eq("email", normalized);
}

export async function hasGoogleCalendar(email: string) {
  return Boolean(await loadGoogleRefreshToken(email));
}
