import { getMockBundle } from "./mock-data";
import { getSupabaseBrowserClient } from "./supabase/client";
import { isOpenVacancy, nextInterviewAt } from "./tracker";
import type {
  ApplicationRow,
  ApplicationView,
  CandidateRow,
  CompanySlug,
  JobRow,
} from "./types";

export type BrandProgress = {
  slug: CompanySlug;
  candidates: number;
  active: number;
  openJobs: number;
  interviewsThisWeek: number;
  hiredThisMonth: number;
};

function isThisWeek(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function isThisMonth(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function summarize(
  slug: CompanySlug,
  jobs: JobRow[],
  views: ApplicationView[],
): BrandProgress {
  return {
    slug,
    candidates: views.length,
    active: views.filter((item) => item.stage !== "rejected" && item.stage !== "hired").length,
    openJobs: jobs.filter((job) => isOpenVacancy(job.status_vacancy)).length,
    interviewsThisWeek: views.filter((item) => {
      const next = nextInterviewAt(item);
      return Boolean(next && isThisWeek(next));
    }).length,
    hiredThisMonth: views.filter(
      (item) =>
        (item.latest_status === "Joined" || item.stage === "hired") &&
        isThisMonth(item.join_date ?? item.updated_at),
    ).length,
  };
}

function fromBundle(slug: CompanySlug): BrandProgress {
  const bundle = getMockBundle(slug);
  const views = bundle.applications
    .map((application) => {
      const candidate = bundle.candidates.find((item) => item.id === application.candidate_id);
      const job = bundle.jobs.find((item) => item.id === application.job_id);
      if (!candidate || !job) return null;
      return { ...application, candidate, job };
    })
    .filter((item): item is ApplicationView => item !== null);
  return summarize(slug, bundle.jobs, views);
}

export async function loadBrandProgress(slug: CompanySlug): Promise<BrandProgress> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fromBundle(slug);

  try {
    const { data: companyRow, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .single();
    if (companyError || !companyRow) throw companyError ?? new Error("Company missing");

    const [{ data: jobRows, error: jobError }, { data: candidateRows, error: candidateError }] =
      await Promise.all([
        supabase.from("jobs").select("*").eq("company_id", companyRow.id),
        supabase.from("candidates").select("*").eq("company_id", companyRow.id),
      ]);
    if (jobError) throw jobError;
    if (candidateError) throw candidateError;

    const jobs = (jobRows ?? []) as JobRow[];
    const candidates = (candidateRows ?? []) as CandidateRow[];
    const ids = candidates.map((row) => row.id);
    const { data: applicationRows, error: applicationError } = ids.length
      ? await supabase.from("applications").select("*").in("candidate_id", ids)
      : { data: [], error: null };
    if (applicationError) throw applicationError;

    const applications = (applicationRows ?? []) as ApplicationRow[];
    const views = applications
      .map((application) => {
        const candidate = candidates.find((item) => item.id === application.candidate_id);
        const job = jobs.find((item) => item.id === application.job_id);
        if (!candidate || !job) return null;
        return { ...application, candidate, job };
      })
      .filter((item): item is ApplicationView => item !== null);

    return summarize(slug, jobs, views);
  } catch {
    return fromBundle(slug);
  }
}
