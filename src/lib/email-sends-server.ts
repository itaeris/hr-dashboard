import "server-only";

import { parseEmailSend, type EmailSend } from "./email-sends";
import { getSupabaseServerClient } from "./supabase/server";
import type { CompanySlug } from "./types";

export async function recordEmailSend(input: {
  company: CompanySlug;
  applicationId: string;
  candidateEmail: string;
  kind: string;
  subject: string;
  sentBy: string;
}): Promise<EmailSend | null> {
  const sentAt = new Date().toISOString();
  const draft = parseEmailSend(
    {
      id: crypto.randomUUID(),
      company_slug: input.company,
      application_id: input.applicationId,
      candidate_email: input.candidateEmail,
      kind: input.kind,
      subject: input.subject,
      sent_by: input.sentBy,
      sent_at: sentAt,
    },
    input.company,
  );
  if (!draft) return null;

  const supabase = getSupabaseServerClient();
  if (!supabase) return draft;

  const { data, error } = await supabase
    .from("email_sends")
    .insert({
      company_slug: draft.company_slug,
      application_id: draft.application_id,
      candidate_email: draft.candidate_email,
      kind: draft.kind,
      subject: draft.subject,
      sent_by: draft.sent_by,
      sent_at: draft.sent_at,
    })
    .select("id, company_slug, application_id, candidate_email, kind, subject, sent_by, sent_at")
    .single();

  if (error || !data) return draft;
  return parseEmailSend(data, input.company) ?? draft;
}
