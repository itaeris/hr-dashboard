import { EMAIL_TEMPLATE_KINDS, EMAIL_TEMPLATE_META, type EmailTemplateKind } from "./email-templates";
import { getSupabaseBrowserClient } from "./supabase/client";
import type { CompanySlug } from "./types";

export type EmailSend = {
  id: string;
  company_slug: CompanySlug;
  application_id: string;
  candidate_email: string;
  kind: EmailTemplateKind | "";
  subject: string;
  sent_by: string;
  sent_at: string;
};

const STORAGE_KEY = (slug: CompanySlug) => `hr-email-sends:${slug}`;
export const EMAIL_SENDS_EVENT = "hr-email-sends-changed";

export function isEmailTemplateKind(value: string): value is EmailTemplateKind {
  return (EMAIL_TEMPLATE_KINDS as readonly string[]).includes(value);
}

function asKind(value: unknown): EmailTemplateKind | "" {
  return typeof value === "string" && isEmailTemplateKind(value) ? value : "";
}

export function parseEmailSend(value: unknown, slug: CompanySlug): EmailSend | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const applicationId = String(row.application_id ?? "").trim();
  const sentAt = String(row.sent_at ?? "").trim();
  if (!applicationId || !sentAt) return null;
  return {
    id: String(row.id ?? `${applicationId}-${sentAt}`),
    company_slug: slug,
    application_id: applicationId.slice(0, 80),
    candidate_email: String(row.candidate_email ?? "").trim().slice(0, 254),
    kind: asKind(row.kind),
    subject: String(row.subject ?? "").trim().slice(0, 200),
    sent_by: String(row.sent_by ?? "").trim().slice(0, 254),
    sent_at: sentAt,
  };
}

function readLocal(slug: CompanySlug) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => parseEmailSend(row, slug))
      .filter((row): row is EmailSend => Boolean(row));
  } catch {
    return [];
  }
}

function writeLocal(slug: CompanySlug, rows: EmailSend[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(rows.slice(0, 200)));
}

export function rememberLocalEmailSend(slug: CompanySlug, send: EmailSend) {
  const rows = readLocal(slug).filter((row) => row.id !== send.id);
  writeLocal(slug, [send, ...rows]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EMAIL_SENDS_EVENT));
  }
}

export function emailedChip(send: EmailSend) {
  return `Emailed · ${emailKindLabel(send)}`;
}

export function emailKindLabel(send: EmailSend) {
  return send.kind ? EMAIL_TEMPLATE_META[send.kind].label : "Email";
}

export function latestSendByApplication(sends: EmailSend[]) {
  const map = new Map<string, EmailSend>();
  for (const send of sends) {
    if (!map.has(send.application_id)) map.set(send.application_id, send);
  }
  return map;
}

export async function loadCompanyEmailSends(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("email_sends")
        .select("id, company_slug, application_id, candidate_email, kind, subject, sent_by, sent_at")
        .eq("company_slug", slug)
        .order("sent_at", { ascending: false });
      if (!error && data) {
        return data
          .map((row) => parseEmailSend(row, slug))
          .filter((row): row is EmailSend => Boolean(row));
      }
    }
  } catch {
    /* local */
  }
  return readLocal(slug).sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}

export async function loadEmailSends(slug: CompanySlug, applicationId: string) {
  const id = applicationId.trim();
  const rows = await loadCompanyEmailSends(slug);
  return rows.filter((row) => row.application_id === id);
}
