import { collectScheduleEvents, type ScheduleEvent } from "@/lib/schedule-events";
import type { ApplicationView, CompanySlug } from "@/lib/types";
import { calendarEventKey, calendarKeysForApplication } from "./scope";
import type { CalendarSyncItem } from "./types";

export { calendarKeysForApplication };

export function toCalendarSyncItems(
  events: ScheduleEvent[],
  slug: CompanySlug,
  company: string,
): CalendarSyncItem[] {
  return events.map((event) => ({
    key: calendarEventKey(slug, event.item.id, event.kind),
    kind: event.kind,
    slug,
    label: event.label,
    iso: event.iso,
    candidateName: event.item.candidate.full_name,
    jobTitle: event.item.job.title,
    company,
    status: event.item.latest_status,
  }));
}

export function pushCalendarSync(input: {
  slug: CompanySlug;
  events?: CalendarSyncItem[];
  remove?: string[];
}) {
  if (typeof window === "undefined") return;
  if (!input.events?.length && !input.remove?.length) return;
  void fetch(`/api/calendar/sync?company=${input.slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: input.slug,
      events: input.events ?? [],
      remove: input.remove ?? [],
    }),
  }).catch(() => {});
}

export function syncApplicationToGoogle(
  view: ApplicationView,
  slug: CompanySlug,
  company: string,
) {
  const events = collectScheduleEvents([view]);
  const keep = new Set(events.map((event) => calendarEventKey(slug, view.id, event.kind)));
  pushCalendarSync({
    slug,
    events: toCalendarSyncItems(events, slug, company),
    remove: calendarKeysForApplication(slug, view.id).filter((key) => !keep.has(key)),
  });
}

export function removeApplicationFromGoogle(applicationId: string, slug: CompanySlug) {
  pushCalendarSync({
    slug,
    remove: calendarKeysForApplication(slug, applicationId),
  });
}
