import type { EventKind } from "@/lib/schedule-events";

export type CalendarSyncItem = {
  key: string;
  kind: EventKind;
  label: string;
  iso: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  status: string;
};
