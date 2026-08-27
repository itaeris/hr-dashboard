import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  companyFromEmail,
  defaultAccessForRole,
  homePath,
  type AppUser,
  type CompanyAccess,
} from "./access";
import { getStoredUser } from "./password-store";
import { findUserByEmail, type AuthUser, type Role } from "./users";

export type { AppUser } from "./access";

export const SEED_APP_USERS: AppUser[] = [
  {
    email: "dwiki@aerisbeaute.com",
    name: "Dwiki",
    role: "admin",
    company: "both",
  },
  {
    email: "umaya@aerisbeaute.com",
    name: "Umaya",
    role: "hr",
    company: "aeris-beaute",
  },
  {
    email: "fitria@fromthisisland.com",
    name: "Fitria",
    role: "hr",
    company: "from-this-island",
  },
];

const memory = new Map<string, AppUser>();
const removed = new Set<string>();

function normalize(email: string) {
  return email.trim().toLowerCase();
}

function asAccess(value: string | undefined, email: string, role: Role): CompanyAccess {
  if (value === "both" || value === "aeris-beaute" || value === "from-this-island") {
    return value;
  }
  return defaultAccessForRole(role, email);
}

function asRole(value: string | undefined): Role {
  return value === "admin" ? "admin" : "hr";
}

export async function loadAppUser(email: string): Promise<AppUser | null> {
  const key = normalize(email);
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("hr_app_users")
      .select("email, name, role, company")
      .eq("email", key)
      .maybeSingle();
    if (!error && data) {
      const role = asRole(data.role);
      return {
        email: key,
        name: String(data.name || key.split("@")[0]),
        role,
        company: asAccess(data.company, key, role),
      };
    }
  }
  return memory.get(key) ?? SEED_APP_USERS.find((user) => user.email === key) ?? null;
}

export async function listAppUsers(): Promise<AppUser[]> {
  const byEmail = new Map<string, AppUser>();
  const supabase = getSupabaseServerClient();
  let fromSupabase = false;

  if (supabase) {
    const { data, error } = await supabase
      .from("hr_app_users")
      .select("email, name, role, company");
    if (!error && data && data.length > 0) {
      fromSupabase = true;
      for (const row of data) {
        const email = normalize(String(row.email));
        if (removed.has(email)) continue;
        const role = asRole(row.role);
        byEmail.set(email, {
          email,
          name: String(row.name || email.split("@")[0]),
          role,
          company: asAccess(row.company, email, role),
        });
      }
    }
  }

  if (!fromSupabase) {
    for (const user of SEED_APP_USERS) {
      if (!removed.has(user.email)) byEmail.set(user.email, user);
    }
  }

  for (const row of memory.values()) {
    if (!removed.has(row.email)) byEmail.set(row.email, row);
  }

  return [...byEmail.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveAppUser(input: AppUser) {
  const next: AppUser = {
    email: normalize(input.email),
    name: input.name.trim() || input.email.split("@")[0],
    role: asRole(input.role),
    company:
      input.role === "admin"
        ? "both"
        : input.company === "both"
          ? companyFromEmail(input.email)
          : input.company,
  };

  removed.delete(next.email);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("hr_app_users").upsert({
      email: next.email,
      name: next.name,
      role: next.role,
      company: next.company,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      memory.set(next.email, next);
      return next;
    }
  }

  memory.set(next.email, next);
  return next;
}

export async function deleteAppUser(email: string) {
  const key = normalize(email);
  removed.add(key);
  memory.delete(key);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("hr_app_users").delete().eq("email", key);
    if (error) {
      removed.delete(key);
      throw error;
    }
  }
}

export async function resolveAuthUser(partial: {
  id: string;
  email: string;
  name: string;
}): Promise<AuthUser | null> {
  const email = normalize(partial.email);
  const profile = await loadAppUser(email);
  const seed = findUserByEmail(email);
  const stored = seed ? null : await getStoredUser(email);
  if (!profile && !seed && !stored) return null;
  return {
    id: seed?.id ?? stored?.id ?? partial.id,
    email,
    name: profile?.name || seed?.name || stored?.name || partial.name || email.split("@")[0],
    role: profile?.role ?? seed?.role ?? stored?.role ?? "hr",
  };
}

export async function homePathForUser(user: AuthUser) {
  const profile = await loadAppUser(user.email);
  return homePath(user, profile?.company);
}
