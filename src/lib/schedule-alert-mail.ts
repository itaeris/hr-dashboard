import "server-only";

import { canAccessCompany } from "@/lib/auth/access";
import { listAppUsers } from "@/lib/auth/app-users";
import { publicSiteUrl } from "@/lib/auth/google";
import { COMPANIES, isCompanySlug } from "@/lib/companies";
import { formatTableDate } from "@/lib/format";
import { isSmtpConfigured, sendSmtpMail } from "@/lib/email/smtp";
import {
  collectScheduleAlerts,
  ymdInZone,
  type ScheduleAlert,
} from "@/lib/schedule-alerts";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { alignedLatestStatus } from "@/lib/tracker";
import type {
  ApplicationRow,
  ApplicationView,
  CandidateRow,
  CompanyRow,
  CompanySlug,
  JobRow,
} from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function joinViews(
  applications: ApplicationRow[],
  candidates: CandidateRow[],
  jobs: JobRow[],
): ApplicationView[] {
  return applications
    .map((application) => {
      const candidate = candidates.find((item) => item.id === application.candidate_id);
      const job = jobs.find((item) => item.id === application.job_id);
      if (!candidate || !job) return null;
      return {
        ...application,
        latest_status: alignedLatestStatus(application),
        candidate,
        job,
      };
    })
    .filter((item): item is ApplicationView => item !== null);
}

async function hrRecipients(slug: CompanySlug) {
  const users = await listAppUsers();
  return [
    ...new Set(
      users
        .filter(
          (user) =>
            user.role !== "it" &&
            EMAIL.test(user.email) &&
            canAccessCompany(
              { id: user.email, email: user.email, name: user.name, role: user.role },
              slug,
              user.company,
            ),
        )
        .map((user) => user.email),
    ),
  ];
}

function lineFor(alert: ScheduleAlert) {
  const when = formatTableDate(alert.iso) || alert.date;
  const delay =
    alert.state === "today"
      ? "due today"
      : alert.days === 1
        ? "1 day overdue"
        : `${alert.days} days overdue`;
  return `• ${alert.item.candidate.full_name} — ${alert.item.job.title} — ${alert.label} ${when} (${delay})`;
}

function digestBody(slug: CompanySlug, overdue: ScheduleAlert[], today: ScheduleAlert[]) {
  const brand = COMPANIES[slug].name;
  const pipeline = `${publicSiteUrl()}/${slug}/pipeline`;
  const calendar = `${publicSiteUrl()}/${slug}/calendar`;
  const parts = [
    `Hi HR team,`,
    ``,
    `Schedule alert for ${brand} based on each candidate's own dates.`,
  ];
  if (overdue.length) {
    parts.push(``, `Overdue (${overdue.length})`, ...overdue.map(lineFor));
  }
  if (today.length) {
    parts.push(``, `Due today (${today.length})`, ...today.map(lineFor));
  }
  parts.push(
    ``,
    `Update the date or move the card when the step is done:`,
    pipeline,
    `Calendar: ${calendar}`,
  );
  return parts.join("\n");
}

async function alreadySent(slug: CompanySlug, sentOn: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("schedule_alert_digests")
    .select("sent_on")
    .eq("company_slug", slug)
    .eq("sent_on", sentOn)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

async function markSent(
  slug: CompanySlug,
  sentOn: string,
  overdueCount: number,
  dueTodayCount: number,
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("schedule_alert_digests").upsert(
    {
      company_slug: slug,
      sent_on: sentOn,
      overdue_count: overdueCount,
      due_today_count: dueTodayCount,
    },
    { onConflict: "company_slug,sent_on" },
  );
}

async function loadCompanyViews(slug: CompanySlug) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: companyRow, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single();
  if (companyError || !companyRow) return [];

  const company = companyRow as CompanyRow;
  const [{ data: jobRows }, { data: candidateRows }] = await Promise.all([
    supabase.from("jobs").select("*").eq("company_id", company.id),
    supabase.from("candidates").select("*").eq("company_id", company.id),
  ]);
  const candidates = (candidateRows ?? []) as CandidateRow[];
  const jobs = (jobRows ?? []) as JobRow[];
  const candidateIds = candidates.map((row) => row.id);
  const { data: applicationRows } = candidateIds.length
    ? await supabase.from("applications").select("*").in("candidate_id", candidateIds)
    : { data: [] };

  return joinViews((applicationRows ?? []) as ApplicationRow[], candidates, jobs);
}

async function emailRemindersEnabled(slug: CompanySlug) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return true;
  const { data, error } = await supabase
    .from("schedule_alert_settings")
    .select("email_enabled")
    .eq("company_slug", slug)
    .maybeSingle();
  if (error || !data) return true;
  return data.email_enabled !== false;
}

export async function sendScheduleAlertDigests(now = new Date()) {
  if (!isSmtpConfigured()) {
    return { sent: 0, skipped: "smtp" as const };
  }

  const sentOn = ymdInZone(now);
  const slugs = Object.keys(COMPANIES).filter(isCompanySlug);
  let sent = 0;
  const details: { slug: CompanySlug; overdue: number; today: number; status: string }[] = [];

  for (const slug of slugs) {
    if (!(await emailRemindersEnabled(slug))) {
      details.push({ slug, overdue: 0, today: 0, status: "disabled" });
      continue;
    }
    const views = await loadCompanyViews(slug);
    const alerts = collectScheduleAlerts(views, now);
    const overdue = alerts.filter((item) => item.state === "overdue");
    const today = alerts.filter((item) => item.state === "today");
    if (!overdue.length && !today.length) {
      details.push({ slug, overdue: 0, today: 0, status: "none" });
      continue;
    }
    if (await alreadySent(slug, sentOn)) {
      details.push({ slug, overdue: overdue.length, today: today.length, status: "already" });
      continue;
    }
    const recipients = await hrRecipients(slug);
    if (!recipients.length) {
      details.push({ slug, overdue: overdue.length, today: today.length, status: "no-recipients" });
      continue;
    }
    const [to, ...cc] = recipients;
    const overdueCount = overdue.length;
    const todayCount = today.length;
    const subjectParts = [
      overdueCount ? `${overdueCount} overdue` : "",
      todayCount ? `${todayCount} due today` : "",
    ].filter(Boolean);
    try {
      await sendSmtpMail({
        to,
        cc,
        subject: `${COMPANIES[slug].name} schedule — ${subjectParts.join(", ")}`,
        text: digestBody(slug, overdue, today),
        company: slug,
      });
      await markSent(slug, sentOn, overdueCount, todayCount);
      sent += 1;
      details.push({ slug, overdue: overdueCount, today: todayCount, status: "sent" });
    } catch {
      details.push({ slug, overdue: overdueCount, today: todayCount, status: "failed" });
    }
  }

  return { sent, details };
}
