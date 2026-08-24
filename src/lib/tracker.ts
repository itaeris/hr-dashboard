import type {
  ApplicationRow,
  ApplicationView,
  JobRow,
  LatestStatus,
  Stage,
  VacancyStatus,
} from "./types";

const OPEN_VACANCIES: VacancyStatus[] = [
  "Open",
  "Sourcing",
  "Interview",
  "Offering",
  "Study Case",
];

export function isOpenVacancy(status: VacancyStatus) {
  return OPEN_VACANCIES.includes(status);
}

export function daysBetween(from: string | null, to?: string | Date | null) {
  if (!from) return null;
  const end = to ?? new Date();
  const diff = Math.floor(
    (new Date(end).getTime() - new Date(from).getTime()) / 86_400_000,
  );
  return diff;
}

export function slaAging(job: JobRow) {
  return daysBetween(job.request_date, job.fulfilled_date ?? new Date()) ?? 0;
}

export function slaResult(job: JobRow) {
  return slaAging(job) <= job.sla_target ? "MEET SLA" : "OVER SLA";
}

export function hireStatus(hired: number, needed: number) {
  return hired >= needed && needed > 0 ? "FULFILLED" : "IN PROGRESS";
}

export function hiredCount(jobId: string, views: ApplicationView[]) {
  return views.filter(
    (item) =>
      item.job_id === jobId &&
      (item.offer_result === "Offer Accepted" ||
        item.latest_status === "Joined" ||
        item.stage === "hired"),
  ).length;
}

export function stageAging(item: ApplicationRow) {
  return daysBetween(item.last_stage_date ?? item.applied_at) ?? 0;
}

export function stuckFlag(item: ApplicationRow) {
  const status = alignedLatestStatus(item);
  if (
    item.stage === "rejected" ||
    status === "Dropped" ||
    status === "Rejected" ||
    status === "Offer Rejected"
  ) {
    return "DROPPED";
  }
  if (item.stage === "hired" || status === "Joined" || status === "Offer Accepted") {
    return "";
  }
  if (stageAging(item) >= 14) return "STUCK";
  return "";
}

export function screeningSla(item: ApplicationRow) {
  return daysBetween(item.approaching_date, item.response_date ?? item.hr_interview_date);
}

export function hrToUserSla(item: ApplicationRow) {
  return daysBetween(item.hr_interview_date, item.user_interview_date);
}

export function userToOfferSla(item: ApplicationRow) {
  return daysBetween(item.user_interview_date, item.offer_date);
}

export function timeToFill(item: ApplicationRow) {
  return daysBetween(item.approaching_date ?? item.applied_at, item.join_date);
}

export function nextInterviewAt(item: ApplicationRow) {
  const dates = [
    item.hr_interview_date,
    item.user_interview_date,
    item.third_interview_date,
  ].filter((value): value is string => Boolean(value));
  const upcoming = dates
    .map((value) => new Date(value))
    .filter((date) => date.getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0]?.toISOString() ?? dates.at(-1) ?? null;
}

export function stageFromLatestStatus(status: LatestStatus): Stage {
  switch (status) {
    case "Approaching":
      return "applied";
    case "Screening":
      return "screening";
    case "HR Interview":
    case "User Interview":
    case "3rd Interview":
      return "interview";
    case "Offering":
      return "offer";
    case "Offer Accepted":
    case "Joined":
      return "hired";
    default:
      return "rejected";
  }
}

export function latestFromStage(stage: Stage): LatestStatus {
  switch (stage) {
    case "applied":
      return "Approaching";
    case "screening":
      return "Screening";
    case "interview":
      return "HR Interview";
    case "offer":
      return "Offering";
    case "hired":
      return "Joined";
    default:
      return "Dropped";
  }
}

/** Pipeline column (`stage`) wins when Progress status is out of date. */
export function alignedLatestStatus(
  item: Pick<ApplicationRow, "stage" | "latest_status">,
): LatestStatus {
  if (stageFromLatestStatus(item.latest_status) === item.stage) {
    return item.latest_status;
  }
  return latestFromStage(item.stage);
}

export function isHired(item: Pick<ApplicationRow, "stage" | "latest_status">) {
  return item.stage === "hired" || item.latest_status === "Joined";
}

export function blankDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? new Date(text).toISOString() : null;
}
