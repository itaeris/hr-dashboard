export type CompanySlug = "aeris-beaute" | "from-this-island";

export type HireType = "New" | "Replacement";
export type VacancyStatus =
  | "Open"
  | "Sourcing"
  | "Interview"
  | "Offering"
  | "On Hold"
  | "Fulfilled"
  | "Closed"
  | "Study Case";
export type OfferStage = "P1" | "P2" | "P3";
export type Priority = "High" | "Medium" | "Low";
export type LatestStatus =
  | "Approaching"
  | "Screening"
  | "HR Interview"
  | "User Interview"
  | "3rd Interview"
  | "Offering"
  | "Offer Accepted"
  | "Offer Rejected"
  | "Joined"
  | "Dropped"
  | "Rejected";
export type OfferResult = "Offer Accepted" | "Offer Rejected" | "";
export type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export type CompanyRow = {
  id: string;
  slug: CompanySlug;
  name: string;
  tagline: string;
};

export type JobRow = {
  id: string;
  company_id: string;
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
  created_at: string;
};

export type CandidateRow = {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  source: string;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export type ApplicationRow = {
  id: string;
  candidate_id: string;
  job_id: string;
  stage: Stage;
  latest_status: LatestStatus;
  cv_url: string | null;
  total_experience: string;
  last_company: string;
  last_role: string;
  last_salary: string;
  expected_salary: string;
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
  last_stage_date: string | null;
  rejection_letter: boolean;
  rating: number | null;
  applied_at: string;
  updated_at: string;
};

export type ApplicationView = ApplicationRow & {
  candidate: CandidateRow;
  job: JobRow;
};

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "applied", label: "Approaching", hint: "Outreach & response" },
  { id: "screening", label: "Screening", hint: "CV & HR screening" },
  { id: "interview", label: "Interview", hint: "HR / user / C-level" },
  { id: "offer", label: "Offering", hint: "Offer stage" },
  { id: "hired", label: "Joined", hint: "Offer accepted / join" },
  { id: "rejected", label: "Dropped", hint: "Rejected / dropped" },
];

export const HIRE_TYPES: HireType[] = ["New", "Replacement"];

export const VACANCY_STATUSES: VacancyStatus[] = [
  "Open",
  "Sourcing",
  "Interview",
  "Offering",
  "On Hold",
  "Fulfilled",
  "Closed",
  "Study Case",
];

export const OFFER_STAGES: OfferStage[] = ["P1", "P2", "P3"];
export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export const LATEST_STATUSES: LatestStatus[] = [
  "Approaching",
  "Screening",
  "HR Interview",
  "User Interview",
  "3rd Interview",
  "Offering",
  "Offer Accepted",
  "Offer Rejected",
  "Joined",
  "Dropped",
  "Rejected",
];

export const OFFER_RESULTS: OfferResult[] = ["Offer Accepted", "Offer Rejected"];

export const LEVELS = [
  "Intern",
  "Staff",
  "Senior",
  "Supervisor",
  "Assistant Manager",
  "Manager",
  "Head",
  "C-Level",
];

export const SOURCES = [
  "LinkedIn",
  "Instagram",
  "Website",
  "Referral",
  "JobStreet",
  "Campus",
  "Walk-in",
  "Kalibrr",
  "Glints",
] as const;
