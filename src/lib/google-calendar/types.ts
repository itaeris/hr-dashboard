import type { EventKind } from "@/lib/schedule-events";
import type { CompanySlug } from "@/lib/types";

export type CalendarSyncItem = {
  key: string;
  kind: EventKind;
  slug: CompanySlug;
  label: string;
  iso: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  status: string;
};
