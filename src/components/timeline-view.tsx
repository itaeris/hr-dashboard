"use client";

import { formatDate, formatDateTime } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import {
  collectScheduleEvents,
  EVENT_KINDS,
  KIND_STYLE,
  type EventKind,
} from "@/lib/schedule-events";
import { useMemo, useState } from "react";
import { CandidateDrawer } from "./candidate-drawer";
import { Avatar, PositionChip } from "./display";
import { Select } from "./fields";
import { OverviewSkeleton } from "./skeletons";
import { PageFade } from "./ui";

type RangeFilter = "all" | "upcoming" | "past";

function todayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TimelinePage() {
  const { views, loading, setSelectedId } = useRecruitment();
  const [range, setRange] = useState<RangeFilter>("all");
  const [kind, setKind] = useState<EventKind | "all">("all");
  const today = todayYmd();

  const grouped = useMemo(() => {
    const events = collectScheduleEvents(views)
      .filter((event) => (kind === "all" ? true : event.kind === kind))
      .filter((event) => {
        if (range === "upcoming") return event.date >= today;
        if (range === "past") return event.date < today;
        return true;
      })
      .sort((a, b) =>
        range === "past"
          ? b.iso.localeCompare(a.iso)
          : a.iso.localeCompare(b.iso),
      );

    const days: { date: string; events: typeof events }[] = [];
    for (const event of events) {
      const last = days.at(-1);
      if (last?.date === event.date) last.events.push(event);
      else days.push({ date: event.date, events: [event] });
    }
    return days;
  }, [kind, range, today, views]);

  if (loading) return <OverviewSkeleton />;

  return (
    <PageFade className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">
          Chronological path of approaching, interviews, offers, and joins.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Select
            className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
            value={range}
            onChange={(value) => setRange(value as RangeFilter)}
            options={[
              { value: "all", label: "All dates" },
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
            ]}
          />
          <Select
            className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
            value={kind}
            onChange={(value) => setKind(value as EventKind | "all")}
            options={[
              { value: "all", label: "All events" },
              ...EVENT_KINDS.map((item) => ({ value: item.id, label: item.label })),
            ]}
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-[24px] border border-line bg-paper-raised px-5 py-12 text-sm text-muted">
          No timeline events for this filter.
        </div>
      ) : (
        <div className="relative space-y-8 pl-4 sm:pl-6">
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-line sm:left-[19px]" />
          {grouped.map((day) => (
            <section key={day.date} className="relative">
              <div className="mb-3 flex items-center gap-3">
                <span className="relative z-10 h-3 w-3 rounded-full bg-accent ring-4 ring-paper" />
                <h2 className="text-sm font-medium">
                  {formatDate(`${day.date}T12:00:00`)}
                  {day.date === today ? (
                    <span className="ml-2 text-xs font-normal text-accent">Today</span>
                  ) : null}
                </h2>
              </div>
              <div className="ml-6 space-y-2 sm:ml-8">
                {day.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedId(event.item.id)}
                    className="flex w-full flex-col items-stretch gap-2 rounded-[20px] border border-line bg-paper-raised px-3 py-3 text-left hover:bg-paper sm:flex-row sm:items-start sm:gap-3 sm:px-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar name={event.item.candidate.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {event.item.candidate.full_name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${KIND_STYLE[event.kind]}`}
                          >
                            {event.label}
                          </span>
                        </div>
                        <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted">
                          <PositionChip title={event.item.job.title} />
                          <span>· {event.item.latest_status}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted sm:shrink-0 sm:pt-0.5">
                      {formatDateTime(event.iso)}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <CandidateDrawer />
    </PageFade>
  );
}
