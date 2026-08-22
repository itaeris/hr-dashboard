import { isoToYmd } from "./format";
import type { ApplicationView } from "./types";

export type EventKind =
  | "approaching"
  | "hr"
  | "user"
  | "third"
  | "offer"
  | "join";

export type ScheduleEvent = {
  id: string;
  kind: EventKind;
  label: string;
  date: string;
  iso: string;
  item: ApplicationView;
};

export const EVENT_KINDS: { id: EventKind; label: string }[] = [
  { id: "approaching", label: "Approaching" },
  { id: "hr", label: "HR interview" },
  { id: "user", label: "User interview" },
  { id: "third", label: "C-level" },
  { id: "offer", label: "Offer" },
  { id: "join", label: "Join" },
];

export const KIND_STYLE: Record<EventKind, string> = {
  approaching: "bg-[#E8DDD4] text-[#5C4A42]",
  hr: "bg-accent-soft text-accent-deep",
  user: "bg-[#E4F0EE] text-[#17554F]",
  third: "bg-[#E8E0F0] text-[#4A3A62]",
  offer: "bg-[#F4E6C8] text-[#7A5A18]",
  join: "bg-[#DCE8D8] text-[#3A5A32]",
};

export function collectScheduleEvents(views: ApplicationView[]): ScheduleEvent[] {
  const rows: ScheduleEvent[] = [];
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
      const date = isoToYmd(value);
      if (!date || !value) continue;
      rows.push({
        id: `${item.id}-${kind}`,
        kind,
        label,
        date,
        iso: value,
        item,
      });
    }
  }
  return rows.sort((a, b) => a.iso.localeCompare(b.iso) || a.label.localeCompare(b.label));
}
