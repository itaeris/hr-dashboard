import { getSupabaseBrowserClient } from "./supabase/client";
import { alignedLatestStatus } from "./tracker";
import type { ApplicationView, CompanySlug } from "./types";

export type ProvisionStatus = "pending" | "requested" | "done";
export type RequestKind = "new" | "replacement";

export type OnboardingSettings = {
  laptop_apps: string[];
  it_email: string;
};

export type OnboardingRequest = {
  id: string;
  company_slug: CompanySlug;
  application_id: string;
  work_email: string;
  work_password: string;
  request_kind: RequestKind;
  laptop_needed: boolean;
  laptop_status: ProvisionStatus;
  laptop_apps: Record<string, boolean>;
  email_status: ProvisionStatus;
  lark_status: ProvisionStatus;
  notes: string;
  it_notes: string;
  requested_at: string | null;
  requested_by: string;
  ready_at: string | null;
  joined: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_LAPTOP_APPS = [
  "Google Chrome",
  "Lark",
  "Google Drive for desktop",
  "PDF reader",
];

const DROPPED_LAPTOP_APPS = new Set(["google meet", "antivirus"]);

export const WORKSPACE_DOMAIN: Record<CompanySlug, string> = {
  "aeris-beaute": "aerisbeaute.com",
  "from-this-island": "fromthisisland.com",
};

const SETTINGS_KEY = (slug: CompanySlug) => `hr-onboarding-settings:${slug}`;
const REQUESTS_KEY = (slug: CompanySlug) => `hr-onboarding-requests:${slug}`;

export function workspaceDomain(slug: CompanySlug) {
  return WORKSPACE_DOMAIN[slug];
}

export function suggestedWorkEmail(fullName: string, slug: CompanySlug) {
  const parts = fullName
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const local =
    parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0] || "newhire";
  return `${local}@${workspaceDomain(slug)}`;
}

export function isOnboardingCandidate(item: ApplicationView) {
  const status = alignedLatestStatus(item);
  return (
    item.offer_result === "Offer Accepted" ||
    status === "Offer Accepted" ||
    status === "Joined" ||
    item.stage === "hired"
  );
}

export function normalizeLaptopApps(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (DROPPED_LAPTOP_APPS.has(key) || seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

export function mergeLaptopApps(saved: Record<string, boolean>, apps: string[]) {
  return Object.fromEntries(apps.map((app) => [app, Boolean(saved[app])]));
}

export function laptopAppsComplete(row: OnboardingRequest, apps: string[]) {
  if (!row.laptop_needed) return true;
  const merged = mergeLaptopApps(row.laptop_apps, apps);
  return apps.length > 0 && apps.every((app) => merged[app]);
}

export function itReady(row: OnboardingRequest, apps: string[]) {
  const laptopOk =
    !row.laptop_needed || (row.laptop_status === "done" && laptopAppsComplete(row, apps));
  return laptopOk && row.email_status === "done" && row.lark_status === "done";
}

export function sentToIt(row: OnboardingRequest) {
  return Boolean(row.requested_at);
}

export function requestStatusCopy(row: OnboardingRequest, apps: string[]) {
  if (itReady(row, apps)) {
    return "IT setup complete. This hire is confirmed as a new joiner.";
  }
  if (sentToIt(row)) {
    return "Sent to IT. Waiting for laptop, Workspace email, and Lark.";
  }
  return "Draft. Send to IT when the request is ready.";
}

export function requestKindLabel(kind: RequestKind) {
  return kind === "replacement" ? "Replacement" : "New";
}

function parseRequestKind(value: unknown): RequestKind {
  return value === "replacement" ? "replacement" : "new";
}

export function provisionLabel(status: ProvisionStatus) {
  if (status === "done") return "Done";
  if (status === "requested") return "Requested";
  return "Pending";
}

function parseSettings(raw: unknown): OnboardingSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<OnboardingSettings>;
  const apps = Array.isArray(value.laptop_apps)
    ? normalizeLaptopApps(value.laptop_apps.map((item) => String(item)))
    : DEFAULT_LAPTOP_APPS;
  return {
    laptop_apps: apps.length > 0 ? apps : [...DEFAULT_LAPTOP_APPS],
    it_email: typeof value.it_email === "string" ? value.it_email.trim() : "",
  };
}

function parseRequest(raw: unknown, slug: CompanySlug): OnboardingRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<OnboardingRequest>;
  if (!value.application_id) return null;
  const status = (item: unknown): ProvisionStatus =>
    item === "done" || item === "requested" ? item : "pending";
  const apps =
    value.laptop_apps && typeof value.laptop_apps === "object"
      ? Object.fromEntries(
          Object.entries(value.laptop_apps).map(([key, installed]) => [key, Boolean(installed)]),
        )
      : {};
  const now = new Date().toISOString();
  return {
    id: String(value.id || crypto.randomUUID()),
    company_slug: slug,
    application_id: String(value.application_id),
    work_email: String(value.work_email ?? ""),
    work_password: String(value.work_password ?? "").slice(0, 128),
    request_kind: parseRequestKind(value.request_kind),
    laptop_needed: value.laptop_needed !== false,
    laptop_status: status(value.laptop_status),
    laptop_apps: apps,
    email_status: status(value.email_status),
    lark_status: status(value.lark_status),
    notes: String(value.notes ?? ""),
    it_notes: String(value.it_notes ?? ""),
    requested_at: value.requested_at ? String(value.requested_at) : null,
    requested_by: String(value.requested_by ?? ""),
    ready_at: value.ready_at ? String(value.ready_at) : null,
    joined: Boolean(value.joined),
    created_at: String(value.created_at || now),
    updated_at: String(value.updated_at || now),
  };
}

export function defaultSettings(): OnboardingSettings {
  return { laptop_apps: [...DEFAULT_LAPTOP_APPS], it_email: "" };
}

export async function loadOnboardingSettings(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("onboarding_settings")
        .select("laptop_apps, it_email")
        .eq("company_slug", slug)
        .maybeSingle();
      if (!error) {
        const parsed = parseSettings(data);
        if (parsed) return parsed;
      }
    }
  } catch {
    /* local */
  }

  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY(slug));
    return raw ? parseSettings(JSON.parse(raw) as unknown) ?? defaultSettings() : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export async function saveOnboardingSettings(slug: CompanySlug, input: OnboardingSettings) {
  const next: OnboardingSettings = {
    laptop_apps: normalizeLaptopApps(input.laptop_apps),
    it_email: input.it_email.trim(),
  };
  if (next.laptop_apps.length === 0) {
    throw new Error("Add at least one laptop app.");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_KEY(slug), JSON.stringify(next));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return next;

  const { error } = await supabase.from("onboarding_settings").upsert(
    {
      company_slug: slug,
      laptop_apps: next.laptop_apps,
      it_email: next.it_email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_slug" },
  );
  if (error && !/onboarding_settings|schema cache|does not exist/i.test(error.message)) {
    throw error;
  }
  return next;
}

export async function loadOnboardingRequests(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("onboarding_requests")
        .select("*")
        .eq("company_slug", slug)
        .order("updated_at", { ascending: false });
      if (!error && data) {
        return data
          .map((row) => parseRequest(row, slug))
          .filter((row): row is OnboardingRequest => Boolean(row));
      }
    }
  } catch {
    /* local */
  }

  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY(slug));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => parseRequest(row, slug))
      .filter((row): row is OnboardingRequest => Boolean(row));
  } catch {
    return [];
  }
}

function writeLocalRequests(slug: CompanySlug, rows: OnboardingRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REQUESTS_KEY(slug), JSON.stringify(rows));
}

export async function saveOnboardingRequest(row: OnboardingRequest) {
  const next = { ...row, updated_at: new Date().toISOString() };

  const current = await loadOnboardingRequests(row.company_slug);
  const rows = [next, ...current.filter((item) => item.id !== next.id)];
  writeLocalRequests(row.company_slug, rows);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return next;

  const { error } = await supabase.from("onboarding_requests").upsert(next, {
    onConflict: "id",
  });
  if (error && /does not exist|schema cache/i.test(error.message)) {
    throw new Error("Run supabase/onboarding.sql in the SQL Editor.");
  }
  if (error) throw error;
  return next;
}

export async function deleteOnboardingRequest(slug: CompanySlug, id: string) {
  const rows = (await loadOnboardingRequests(slug)).filter((item) => item.id !== id);
  writeLocalRequests(slug, rows);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.from("onboarding_requests").delete().eq("id", id);
  if (error && !/does not exist|schema cache/i.test(error.message)) throw error;
}

export function createOnboardingRequest(
  item: ApplicationView,
  slug: CompanySlug,
  apps: string[],
  requestedBy: string,
): OnboardingRequest {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    company_slug: slug,
    application_id: item.id,
    work_email: suggestedWorkEmail(item.candidate.full_name, slug),
    work_password: "",
    request_kind: "new",
    laptop_needed: true,
    laptop_status: "pending",
    laptop_apps: mergeLaptopApps({}, apps),
    email_status: "pending",
    lark_status: "pending",
    notes: "",
    it_notes: "",
    requested_at: null,
    requested_by: requestedBy,
    ready_at: null,
    joined: false,
    created_at: now,
    updated_at: now,
  };
}

export function syncReadyAt(row: OnboardingRequest, apps: string[]): OnboardingRequest {
  const ready = itReady(row, apps);
  return {
    ...row,
    ready_at: ready ? row.ready_at || new Date().toISOString() : null,
    joined: ready,
    laptop_status:
      row.laptop_needed && row.laptop_status === "done" && !laptopAppsComplete(row, apps)
        ? "requested"
        : row.laptop_status,
  };
}
