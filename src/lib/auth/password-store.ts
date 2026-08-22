import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { findUserByEmail, type Role, type StoredUser } from "./users";

export type PasswordOverride = {
  email: string;
  salt: string;
  hash: string;
  name?: string;
  role?: Role;
};

const memory = new Map<string, PasswordOverride>();

export async function loadPasswordOverride(email: string) {
  const normalized = email.trim().toLowerCase();
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("hr_auth_passwords")
      .select("email, salt, hash, name, role")
      .eq("email", normalized)
      .maybeSingle();
    if (!error && data) return data as PasswordOverride;
  }

  return memory.get(normalized) ?? null;
}

export async function savePasswordOverride(row: PasswordOverride) {
  const next: PasswordOverride = {
    ...row,
    email: row.email.trim().toLowerCase(),
  };

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.from("hr_auth_passwords").upsert({
      email: next.email,
      salt: next.salt,
      hash: next.hash,
      name: next.name ?? "",
      role: next.role ?? "hr",
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      memory.set(next.email, next);
      return;
    }
  }

  memory.set(next.email, next);
}

export async function getStoredUser(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const seed = findUserByEmail(normalized);
  const override = await loadPasswordOverride(normalized);

  if (seed && override) {
    return { ...seed, passwordSalt: override.salt, passwordHash: override.hash };
  }
  if (seed) return seed;
  if (override) {
    return {
      id: `pwd_${normalized}`,
      email: normalized,
      name: override.name?.trim() || normalized.split("@")[0],
      role: override.role === "admin" ? "admin" : "hr",
      passwordSalt: override.salt,
      passwordHash: override.hash,
    };
  }
  return null;
}
