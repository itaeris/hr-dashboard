import { LEVELS } from "./types";
import type { CompanySlug } from "./types";
import { getSupabaseBrowserClient } from "./supabase/client";

const STORAGE_KEY = (slug: CompanySlug) => `hr-vacancy-levels:${slug}`;

export const DEFAULT_VACANCY_LEVELS = [...LEVELS];

export function normalizeVacancyLevels(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

function parseLevels(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const next = normalizeVacancyLevels(
    raw.map((item) => (typeof item === "string" ? item : "")),
  );
  return next.length > 0 ? next : null;
}

export async function loadVacancyLevels(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("vacancy_settings")
        .select("levels")
        .eq("company_slug", slug)
        .maybeSingle();
      if (!error) {
        const parsed = parseLevels(data?.levels);
        if (parsed) return parsed;
      }
    }
  } catch {
    /* use local */
  }

  if (typeof window === "undefined") return DEFAULT_VACANCY_LEVELS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    const parsed = raw ? parseLevels(JSON.parse(raw) as unknown) : null;
    return parsed ?? DEFAULT_VACANCY_LEVELS;
  } catch {
    return DEFAULT_VACANCY_LEVELS;
  }
}

export async function saveVacancyLevels(slug: CompanySlug, levels: string[]) {
  const next = normalizeVacancyLevels(levels);
  if (next.length === 0) {
    throw new Error("Add at least one level.");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(next));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return next;

  const { error } = await supabase.from("vacancy_settings").upsert(
    {
      company_slug: slug,
      levels: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_slug" },
  );
  if (error && !/vacancy_settings|schema cache|does not exist/i.test(error.message)) {
    throw error;
  }
  return next;
}
