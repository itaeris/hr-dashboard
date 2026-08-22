"use client";

import { collectScheduleEvents, KIND_STYLE, type ScheduleEvent } from "@/lib/schedule-events";
import { useRecruitment } from "@/lib/recruitment-context";
import { useMemo, useState } from "react";
import { CandidateDrawer } from "./candidate-drawer";
import { GoogleCalendarSync } from "./google-calendar-sync";
import { Avatar } from "./display";
import { IconChevronDown } from "./icons";
import { OverviewSkeleton } from "./skeletons";
import { PageFade } from "./ui";

type CalendarRange = "day" | "week" | "month";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RANGES: { id: CalendarRange; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function ymdFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromYmd(value: string) {
  return new Date(`${value}T12:00:00`);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDayLabel(value: string) {
  return fromYmd(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function rangeLabel(range: CalendarRange, selectedDay: string) {
  const date = fromYmd(selectedDay);
  if (range === "day") return formatDayLabel(selectedDay);
  if (range === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function EventList({
  events,
  empty,
  onOpen,
}: {
  events: ScheduleEvent[];
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpen(event.item.id)}
          className="flex w-full items-start gap-3 rounded-2xl border border-line px-3 py-3 text-left hover:bg-paper"
        >
          <Avatar name={event.item.candidate.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{event.item.candidate.full_name}</p>
            <p className="truncate text-xs text-muted">{event.item.job.title}</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] ${KIND_STYLE[event.kind]}`}
            >
              {event.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function DayCell({
  date,
  today,
  selectedDay,
  events,
  compact,
  onSelect,
}: {
  date: Date;
  today: string;
  selectedDay: string;
  events: ScheduleEvent[];
  compact?: boolean;
  onSelect: (day: string) => void;
}) {
  const key = ymdFromDate(date);
  const isToday = key === today;
  const isSelected = key === selectedDay;
  const visible = events.slice(0, compact ? 2 : 3);
  const extra = events.length - visible.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(key)}
      className={`h-full min-h-[72px] w-full min-w-0 p-1 text-left transition sm:min-h-[108px] sm:p-2 ${
        isSelected ? "bg-accent-soft/60" : "hover:bg-paper"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] sm:h-6 sm:w-6 sm:text-xs ${
          isToday ? "bg-accent font-medium text-white" : "text-ink"
        }`}
      >
        {date.getDate()}
      </span>
      <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
        {events.slice(0, 3).map((event) => (
          <span
            key={event.id}
            className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE[event.kind]}`}
          />
        ))}
      </div>
      <div className="mt-1 hidden space-y-1 sm:block">
        {visible.map((event) => (
          <span
            key={event.id}
            className={`block truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight ${KIND_STYLE[event.kind]}`}
          >
            {event.item.candidate.full_name}
          </span>
        ))}
        {extra > 0 ? (
          <span className="block px-1 text-[10px] text-muted">+{extra} more</span>
        ) : null}
      </div>
    </button>
  );
}

export function CalendarPage() {
  const { views, loading, setSelectedId } = useRecruitment();
  const today = ymdFromDate(new Date());
  const [range, setRange] = useState<CalendarRange>("month");
  const [selectedDay, setSelectedDay] = useState(today);

  const events = useMemo(() => collectScheduleEvents(views), [views]);
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const selected = fromYmd(selectedDay);
  const weekStart = startOfWeek(selected);
  const monthStart = startOfMonth(selected);
  const monthPad = monthStart.getDay();
  const daysInMonth = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - monthPad + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(selected.getFullYear(), selected.getMonth(), day);
  });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedEvents = byDay.get(selectedDay) ?? [];

  function shift(delta: number) {
    const next =
      range === "day"
        ? addDays(selected, delta)
        : range === "week"
          ? addDays(selected, delta * 7)
          : new Date(selected.getFullYear(), selected.getMonth() + delta, 1);
    const nextKey = ymdFromDate(next);
    if (range === "week") {
      const start = startOfWeek(next);
      const end = addDays(start, 6);
      const todayDate = fromYmd(today);
      setSelectedDay(
        todayDate >= start && todayDate <= end ? today : ymdFromDate(start),
      );
      return;
    }
    if (range === "month") {
      const sameMonth =
        next.getFullYear() === new Date().getFullYear() &&
        next.getMonth() === new Date().getMonth();
      setSelectedDay(sameMonth ? today : nextKey);
      return;
    }
    setSelectedDay(nextKey);
  }

  if (loading) return <OverviewSkeleton />;

  return (
    <PageFade className="space-y-5">
      <GoogleCalendarSync />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Interviews, offers, and join dates from Progress.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex rounded-full border border-line bg-paper-raised p-1">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm transition sm:flex-none ${
                  range === item.id
                    ? "bg-accent font-medium text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="rounded-full border border-line p-2 text-muted hover:bg-paper hover:text-ink"
              aria-label="Previous"
            >
              <IconChevronDown className="h-4 w-4 rotate-90" />
            </button>
            <p className="min-w-0 flex-1 text-center text-xs font-medium sm:min-w-[200px] sm:flex-none sm:text-sm">
              {rangeLabel(range, selectedDay)}
            </p>
            <button
              type="button"
              onClick={() => shift(1)}
              className="rounded-full border border-line p-2 text-muted hover:bg-paper hover:text-ink"
              aria-label="Next"
            >
              <IconChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {range === "day" ? (
        <div className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-5">
          <EventList
            events={selectedEvents}
            empty="No scheduled items this day."
            onOpen={setSelectedId}
          />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-[24px] border border-line bg-paper-raised">
            <div className="grid grid-cols-7 border-b border-line">
              {WEEKDAYS.map((day) => (
                <p
                  key={day}
                  className="px-0.5 py-2 text-center text-[10px] uppercase tracking-[0.14em] text-muted sm:px-2 sm:py-3 sm:text-[11px]"
                >
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </p>
              ))}
            </div>
            {range === "week" ? (
              <div className="grid grid-cols-7">
                {weekDays.map((date, index) => (
                  <div
                    key={ymdFromDate(date)}
                    className={`min-h-[140px] min-w-0 border-t border-line sm:min-h-[220px] ${index === 0 ? "" : "border-l"}`}
                  >
                    <DayCell
                      date={date}
                      today={today}
                      selectedDay={selectedDay}
                      events={byDay.get(ymdFromDate(date)) ?? []}
                      onSelect={setSelectedDay}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {monthCells.map((date, index) => {
                  if (!date) {
                    return (
                      <div key={`empty-${index}`} className="min-h-[72px] border-t border-line sm:min-h-[108px]" />
                    );
                  }
                  return (
                    <div
                      key={ymdFromDate(date)}
                      className={`min-h-[72px] min-w-0 border-t border-line sm:min-h-[108px] ${index % 7 === 0 ? "" : "border-l"}`}
                    >
                      <DayCell
                        date={date}
                        today={today}
                        selectedDay={selectedDay}
                        events={byDay.get(ymdFromDate(date)) ?? []}
                        compact
                        onSelect={setSelectedDay}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {fromYmd(selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="mt-4">
              <EventList
                events={selectedEvents}
                empty="No scheduled items this day."
                onOpen={setSelectedId}
              />
            </div>
          </aside>
        </div>
      )}

      <CandidateDrawer />
    </PageFade>
  );
}
