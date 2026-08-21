"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COMPANIES, type CompanyConfig } from "./companies";
import { getMockBundle } from "./mock-data";
import { getSupabaseBrowserClient } from "./supabase/client";
import type {
  ApplicationRow,
  ApplicationView,
  CandidateRow,
  CompanyRow,
  CompanySlug,
  HireType,
  JobRow,
  LatestStatus,
  OfferResult,
  OfferStage,
  Priority,
  Stage,
  VacancyStatus,
} from "./types";
import { isOpenVacancy, latestFromStage, nextInterviewAt, stageFromLatestStatus } from "./tracker";

type DataSource = "supabase" | "demo";

type AddCandidateInput = {
  full_name: string;
  email: string;
  phone: string;
  source: string;
  job_id: string;
  cv_url: string | null;
  total_experience: string;
  last_company: string;
  last_role: string;
  last_salary: string;
  expected_salary: string;
  latest_status: LatestStatus;
  approaching_date: string | null;
  response_date: string | null;
  hr_interview_date: string | null;
  hr_interview_note: string;
  shared_with_user: boolean;
  user_interview_date: string | null;
  user_remarks: string;
  third_interview_date: string | null;
  offer_date: string | null;
  offer_result: OfferResult;
  join_date: string | null;
  rejection_letter: boolean;
  notes: string;
};

type AddJobInput = {
  hire_type: HireType;
  title: string;
  level: string;
  department: string;
  hiring_manager: string;
  recruiter_pic: string;
  headcount_needed: number;
  request_date: string;
  sla_target: number;
  target_join: string | null;
  status_vacancy: VacancyStatus;
  fulfilled_date: string | null;
  offer_stage: OfferStage;
  priority: Priority;
  notes: string;
};

type RecruitmentContextValue = {
  slug: CompanySlug;
  brand: CompanyConfig;
  company: CompanyRow | null;
  jobs: JobRow[];
  candidates: CandidateRow[];
  applications: ApplicationRow[];
  views: ApplicationView[];
  loading: boolean;
  source: DataSource;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: ApplicationView | null;
  addCandidate: (input: AddCandidateInput) => Promise<void>;
  addJob: (input: AddJobInput) => Promise<void>;
  updateStage: (applicationId: string, stage: Stage) => Promise<void>;
  updateRating: (applicationId: string, rating: number) => Promise<void>;
  updateNotes: (candidateId: string, notes: string) => Promise<void>;
  toggleJobStatus: (jobId: string) => Promise<void>;
};

const RecruitmentContext = createContext<RecruitmentContextValue | null>(null);

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
      return { ...application, candidate, job };
    })
    .filter((item): item is ApplicationView => item !== null)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
}

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

export function RecruitmentProvider({
  slug,
  children,
}: {
  slug: CompanySlug;
  children: ReactNode;
}) {
  const brand = COMPANIES[slug];
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSource>("demo");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hydrateMock = useCallback(() => {
    const bundle = getMockBundle(slug);
    setCompany(bundle.company);
    setJobs(bundle.jobs);
    setCandidates(bundle.candidates);
    setApplications(bundle.applications);
    setSource("demo");
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSelectedId(null);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        hydrateMock();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data: companyRow, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("slug", slug)
          .single();

        if (companyError || !companyRow) throw companyError ?? new Error("Company missing");

        const [{ data: jobRows, error: jobError }, { data: candidateRows, error: candidateError }] =
          await Promise.all([
            supabase.from("jobs").select("*").eq("company_id", companyRow.id).order("created_at", { ascending: false }),
            supabase.from("candidates").select("*").eq("company_id", companyRow.id).order("created_at", { ascending: false }),
          ]);

        if (jobError) throw jobError;
        if (candidateError) throw candidateError;

        const candidateIds = (candidateRows ?? []).map((row) => row.id);
        const { data: applicationRows, error: applicationError } = candidateIds.length
          ? await supabase.from("applications").select("*").in("candidate_id", candidateIds)
          : { data: [], error: null };

        if (applicationError) throw applicationError;
        if (cancelled) return;

        setCompany(companyRow as CompanyRow);
        setJobs((jobRows ?? []) as JobRow[]);
        setCandidates((candidateRows ?? []) as CandidateRow[]);
        setApplications((applicationRows ?? []) as ApplicationRow[]);
        setSource("supabase");
      } catch {
        if (!cancelled) hydrateMock();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrateMock, slug]);

  const views = useMemo(
    () => joinViews(applications, candidates, jobs),
    [applications, candidates, jobs],
  );

  const selected = views.find((item) => item.id === selectedId) ?? null;

  const addCandidate = useCallback(
    async (input: AddCandidateInput) => {
      if (!company) return;
      const now = new Date().toISOString();
      const supabase = source === "supabase" ? getSupabaseBrowserClient() : null;

      if (supabase) {
        const { data: candidate, error: candidateError } = await supabase
          .from("candidates")
          .insert({
            company_id: company.id,
            full_name: input.full_name,
            email: input.email || `${input.full_name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
            phone: input.phone || null,
            source: input.source,
            notes: input.notes || null,
          })
          .select()
          .single();
        if (candidateError || !candidate) throw candidateError;

        const { data: application, error: applicationError } = await supabase
          .from("applications")
          .insert({
            candidate_id: candidate.id,
            job_id: input.job_id,
            stage: stageFromLatestStatus(input.latest_status),
            latest_status: input.latest_status,
            cv_url: input.cv_url,
            total_experience: input.total_experience,
            last_company: input.last_company,
            last_role: input.last_role,
            last_salary: input.last_salary,
            expected_salary: input.expected_salary,
            approaching_date: input.approaching_date,
            response_date: input.response_date,
            hr_interview_date: input.hr_interview_date,
            hr_interview_note: input.hr_interview_note,
            shared_with_user: input.shared_with_user,
            user_interview_date: input.user_interview_date,
            user_remarks: input.user_remarks,
            third_interview_date: input.third_interview_date,
            offer_date: input.offer_date,
            offer_result: input.offer_result || null,
            join_date: input.join_date,
            last_stage_date: now,
            rejection_letter: input.rejection_letter,
          })
          .select()
          .single();
        if (applicationError || !application) throw applicationError;

        setCandidates((current) => [candidate as CandidateRow, ...current]);
        setApplications((current) => [application as ApplicationRow, ...current]);
        return;
      }

      const candidate: CandidateRow = {
        id: crypto.randomUUID(),
        company_id: company.id,
        full_name: input.full_name,
        email: input.email || `${input.full_name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: input.phone || null,
        source: input.source,
        location: null,
        notes: input.notes || null,
        created_at: now,
      };
      const application: ApplicationRow = {
        id: crypto.randomUUID(),
        candidate_id: candidate.id,
        job_id: input.job_id,
        stage: stageFromLatestStatus(input.latest_status),
        latest_status: input.latest_status,
        cv_url: input.cv_url,
        total_experience: input.total_experience,
        last_company: input.last_company,
        last_role: input.last_role,
        last_salary: input.last_salary,
        expected_salary: input.expected_salary,
        approaching_date: input.approaching_date ?? now,
        response_date: input.response_date,
        hr_interview_date: input.hr_interview_date,
        hr_interview_note: input.hr_interview_note,
        shared_with_user: input.shared_with_user,
        user_interview_date: input.user_interview_date,
        user_remarks: input.user_remarks,
        third_interview_date: input.third_interview_date,
        offer_date: input.offer_date,
        offer_result: input.offer_result,
        join_date: input.join_date,
        last_stage_date: now,
        rejection_letter: input.rejection_letter,
        rating: null,
        applied_at: now,
        updated_at: now,
      };
      setCandidates((current) => [candidate, ...current]);
      setApplications((current) => [application, ...current]);
    },
    [company, source],
  );

  const addJob = useCallback(
    async (input: AddJobInput) => {
      if (!company) return;
      const supabase = source === "supabase" ? getSupabaseBrowserClient() : null;

      if (supabase) {
        const { data, error } = await supabase
          .from("jobs")
          .insert({
            company_id: company.id,
            hire_type: input.hire_type,
            title: input.title,
            level: input.level,
            department: input.department,
            hiring_manager: input.hiring_manager,
            recruiter_pic: input.recruiter_pic,
            headcount_needed: input.headcount_needed,
            request_date: input.request_date,
            sla_target: input.sla_target,
            target_join: input.target_join,
            status_vacancy: input.status_vacancy,
            fulfilled_date: input.fulfilled_date,
            offer_stage: input.offer_stage,
            priority: input.priority,
            notes: input.notes,
          })
          .select()
          .single();
        if (error || !data) throw error;
        setJobs((current) => [data as JobRow, ...current]);
        return;
      }

      const job: JobRow = {
        id: crypto.randomUUID(),
        company_id: company.id,
        hire_type: input.hire_type,
        title: input.title,
        level: input.level,
        department: input.department,
        hiring_manager: input.hiring_manager,
        recruiter_pic: input.recruiter_pic,
        headcount_needed: input.headcount_needed,
        request_date: input.request_date,
        sla_target: input.sla_target,
        target_join: input.target_join,
        status_vacancy: input.status_vacancy,
        fulfilled_date: input.fulfilled_date,
        offer_stage: input.offer_stage,
        priority: input.priority,
        notes: input.notes,
        created_at: new Date().toISOString(),
      };
      setJobs((current) => [job, ...current]);
    },
    [company, source],
  );

  const updateStage = useCallback(
    async (applicationId: string, stage: Stage) => {
      const updatedAt = new Date().toISOString();
      const latest_status = latestFromStage(stage);
      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? { ...item, stage, latest_status, last_stage_date: updatedAt, updated_at: updatedAt }
            : item,
        ),
      );

      if (source !== "supabase") return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase
        .from("applications")
        .update({ stage, latest_status, last_stage_date: updatedAt, updated_at: updatedAt })
        .eq("id", applicationId);
    },
    [source],
  );

  const updateRating = useCallback(
    async (applicationId: string, rating: number) => {
      const updatedAt = new Date().toISOString();
      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId ? { ...item, rating, updated_at: updatedAt } : item,
        ),
      );

      if (source !== "supabase") return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase
        .from("applications")
        .update({ rating, updated_at: updatedAt })
        .eq("id", applicationId);
    },
    [source],
  );

  const updateNotes = useCallback(
    async (candidateId: string, notes: string) => {
      setCandidates((current) =>
        current.map((item) => (item.id === candidateId ? { ...item, notes } : item)),
      );

      if (source !== "supabase") return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.from("candidates").update({ notes }).eq("id", candidateId);
    },
    [source],
  );

  const toggleJobStatus = useCallback(
    async (jobId: string) => {
      const job = jobs.find((item) => item.id === jobId);
      if (!job) return;
      const status_vacancy = job.status_vacancy === "Closed" || job.status_vacancy === "Fulfilled" ? "Open" : "Closed";
      setJobs((current) =>
        current.map((item) => (item.id === jobId ? { ...item, status_vacancy } : item)),
      );

      if (source !== "supabase") return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.from("jobs").update({ status_vacancy }).eq("id", jobId);
    },
    [jobs, source],
  );

  const value = useMemo(
    () => ({
      slug,
      brand,
      company,
      jobs,
      candidates,
      applications,
      views,
      loading,
      source,
      selectedId,
      setSelectedId,
      selected,
      addCandidate,
      addJob,
      updateStage,
      updateRating,
      updateNotes,
      toggleJobStatus,
    }),
    [
      addCandidate,
      addJob,
      applications,
      brand,
      candidates,
      company,
      jobs,
      loading,
      selected,
      selectedId,
      slug,
      source,
      toggleJobStatus,
      updateNotes,
      updateRating,
      updateStage,
      views,
    ],
  );

  return (
    <RecruitmentContext.Provider value={value}>{children}</RecruitmentContext.Provider>
  );
}

export function useRecruitment() {
  const context = useContext(RecruitmentContext);
  if (!context) {
    throw new Error("useRecruitment must be used within RecruitmentProvider");
  }
  return context;
}

export function useRecruitmentStats() {
  const { views, jobs } = useRecruitment();
  const openJobs = jobs.filter((job) => isOpenVacancy(job.status_vacancy)).length;
  const interviewsThisWeek = views.filter((item) => {
    const next = nextInterviewAt(item);
    return next && isThisWeek(next);
  }).length;
  const hiredThisMonth = views.filter(
    (item) =>
      (item.latest_status === "Joined" || item.stage === "hired") &&
      isThisMonth(item.join_date ?? item.updated_at),
  ).length;
  const active = views.filter((item) => item.stage !== "rejected" && item.stage !== "hired");
  const hired = views.filter((item) => item.stage === "hired").length;
  const conversion =
    views.length === 0 ? 0 : Math.round((hired / views.length) * 100);

  return {
    totalCandidates: views.length,
    openJobs,
    interviewsThisWeek,
    hiredThisMonth,
    activeCount: active.length,
    conversion,
  };
}
