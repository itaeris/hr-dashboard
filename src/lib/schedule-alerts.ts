import { type EventKind, type ScheduleEvent } from "./schedule-events";
import { alignedLatestStatus } from "./tracker";
import type { ApplicationView, LatestStatus, Stage } from "./types";

export const SCHEDULE_TZ = "Asia/Jakarta";

export type DueState = "overdue" | "today";

export type ScheduleAlert = ScheduleEvent & {
  state: DueState;
  days: number;
};

const KIND_DONE_AT: Record<EventKind, LatestStatus[]> = {
  approaching: ["Screening"],
  hr: ["User Interview"],
  user: ["3rd Interview"],
  third: ["Offering"],
  offer: ["Offer Accepted"],
  join: ["Joined"],
};

const STATUS_ORDER: LatestStatus[] = [
  "Approaching",
  "Screening",
  "HR Interview",
  "User Interview",
  "3rd Interview",
  "Offering",
  "Offer Accepted",
  "Joined",
];

function statusRank(status: LatestStatus) {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? -1 : index;
}

function doneRank(kind: EventKind) {
  return statusRank(KIND_DONE_AT[kind][0]);
}

export function ymdInZone(value: Date | string, timeZone = SCHEDULE_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function daysBetweenYmd(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000,
  );
}

function isClosed(item: ApplicationView) {
  const status = alignedLatestStatus(item);
  return (
    item.stage === "rejected" ||
    status === "Dropped" ||
    status === "Rejected" ||
    status === "Offer Rejected"
  );
}

function hasLaterInterview(item: ApplicationView, kind: EventKind) {
  if (kind === "hr") {
    return Boolean(
      item.user_interview_date || item.third_interview_date || item.offer_date,
    );
  }
  if (kind === "user") {
    return Boolean(item.third_interview_date || item.offer_date);
  }
  if (kind === "third") return Boolean(item.offer_date);
  return false;
}

function joinIsCurrent(stage: Stage, status: LatestStatus) {
  return (
    stage === "offer" ||
    stage === "hired" ||
    status === "Offering" ||
    status === "Offer Accepted"
  );
}

export function eventStillOpen(item: ApplicationView, kind: EventKind) {
  if (isClosed(item)) return false;
  const status = alignedLatestStatus(item);
  const rank = statusRank(status);
  if (rank < 0) return false;
  if (rank >= doneRank(kind)) return false;
  if (hasLaterInterview(item, kind)) return false;
  if (kind === "join" && !joinIsCurrent(item.stage, status)) return false;
  if (kind === "offer" && item.stage === "hired") return false;
  return true;
}

export function collectScheduleAlerts(
  views: ApplicationView[],
  now: Date = new Date(),
): ScheduleAlert[] {
  const today = ymdInZone(now);
  const rows: ScheduleAlert[] = [];

  for (const item of views) {
    const fields: [EventKind, string, string | null][] = [
      ["approaching", "Approaching", item.approaching_date],
      ["hr", "HR interview", item.hr_interview_date],
      ["user", "User interview", item.user_interview_date],
      ["third", "C-level", item.third_interview_date],
      ["offer", "Offer", item.offer_date],
      ["join", "Join", item.join_date],
    ];
    for (const [kind, label, value] of fields) {
      if (!value || !eventStillOpen(item, kind)) continue;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) continue;
      const date = ymdInZone(parsed);
      const days = daysBetweenYmd(date, today);
      if (!Number.isFinite(days) || days < 0) continue;
      rows.push({
        id: `${item.id}-${kind}`,
        kind,
        label,
        date,
        iso: value,
        item,
        state: days === 0 ? "today" : "overdue",
        days,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.state !== b.state) return a.state === "overdue" ? -1 : 1;
    if (a.days !== b.days) return b.days - a.days;
    return a.item.candidate.full_name.localeCompare(b.item.candidate.full_name);
  });
}

export function primaryAlert(alerts: ScheduleAlert[]) {
  return alerts[0] ?? null;
}

export function alertChip(alert: ScheduleAlert) {
  if (alert.state === "today") return `${alert.label} today`;
  if (alert.days === 1) return `${alert.label} · 1 day overdue`;
  return `${alert.label} · ${alert.days} days overdue`;
}
