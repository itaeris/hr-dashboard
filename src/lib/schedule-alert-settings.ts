import { getSupabaseBrowserClient } from "./supabase/client";
import type { CompanySlug } from "./types";

export type ScheduleAlertSettings = {
  email_enabled: boolean;
};

const STORAGE_KEY = (slug: CompanySlug) => `hr-schedule-alert-settings:${slug}`;

export const DEFAULT_SCHEDULE_ALERT_SETTINGS: ScheduleAlertSettings = {
  email_enabled: true,
};

function parseSettings(value: unknown): ScheduleAlertSettings {
  if (!value || typeof value !== "object") return DEFAULT_SCHEDULE_ALERT_SETTINGS;
  const row = value as Record<string, unknown>;
  return {
    email_enabled: row.email_enabled !== false,
  };
}

function readLocal(slug: CompanySlug) {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_ALERT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    return raw
      ? parseSettings(JSON.parse(raw) as unknown)
      : DEFAULT_SCHEDULE_ALERT_SETTINGS;
  } catch {
    return DEFAULT_SCHEDULE_ALERT_SETTINGS;
  }
}

export async function loadScheduleAlertSettings(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("schedule_alert_settings")
        .select("email_enabled")
        .eq("company_slug", slug)
        .maybeSingle();
      if (!error) {
        if (!data) return DEFAULT_SCHEDULE_ALERT_SETTINGS;
        return parseSettings(data);
      }
    }
  } catch {
    /* local */
  }
  return readLocal(slug);
}

export async function saveScheduleAlertSettings(
  slug: CompanySlug,
  input: ScheduleAlertSettings,
) {
  const next: ScheduleAlertSettings = {
    email_enabled: Boolean(input.email_enabled),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(next));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return next;

  const { error } = await supabase.from("schedule_alert_settings").upsert(
    {
      company_slug: slug,
      email_enabled: next.email_enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_slug" },
  );
  if (error && !/schedule_alert_settings|schema cache|does not exist/i.test(error.message)) {
    throw error;
  }
  return next;
}
