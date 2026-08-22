import { collectScheduleEvents, EVENT_KINDS, type ScheduleEvent } from "@/lib/schedule-events";
import type { ApplicationView } from "@/lib/types";
import type { CalendarSyncItem } from "./types";

export function calendarKeysForApplication(applicationId: string) {
  return EVENT_KINDS.map((item) => `${applicationId}-${item.id}`);
}

export function toCalendarSyncItems(
  events: ScheduleEvent[],
  company: string,
): CalendarSyncItem[] {
  return events.map((event) => ({
    key: event.id,
    kind: event.kind,
    label: event.label,
    iso: event.iso,
    candidateName: event.item.candidate.full_name,
    jobTitle: event.item.job.title,
    company,
    status: event.item.latest_status,
  }));
}

export function pushCalendarSync(input: {
  events?: CalendarSyncItem[];
  remove?: string[];
}) {
  if (typeof window === "undefined") return;
  if (!input.events?.length && !input.remove?.length) return;
  void fetch("/api/calendar/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events: input.events ?? [],
      remove: input.remove ?? [],
    }),
  }).catch(() => {});
}

export function syncApplicationToGoogle(view: ApplicationView, company: string) {
  const events = collectScheduleEvents([view]);
  const keep = new Set(events.map((event) => event.id));
  pushCalendarSync({
    events: toCalendarSyncItems(events, company),
    remove: calendarKeysForApplication(view.id).filter((key) => !keep.has(key)),
  });
}

export function removeApplicationFromGoogle(applicationId: string) {
  pushCalendarSync({ remove: calendarKeysForApplication(applicationId) });
}
