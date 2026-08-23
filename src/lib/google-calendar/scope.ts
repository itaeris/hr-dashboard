import { companyFromEmail } from "@/lib/auth/access";
import { COMPANIES } from "@/lib/companies";
import { EVENT_KINDS, type EventKind } from "@/lib/schedule-events";
import type { CompanySlug } from "@/lib/types";

export function calendarCompanyFromEmail(email: string): CompanySlug {
  return companyFromEmail(email);
}

export function calendarSummary(slug: CompanySlug) {
  return `HR · ${COMPANIES[slug].name}`;
}

export function calendarEventKey(
  slug: CompanySlug,
  applicationId: string,
  kind: EventKind,
) {
  return `${slug}:${applicationId}:${kind}`;
}

export function calendarKeysForApplication(slug: CompanySlug, applicationId: string) {
  return EVENT_KINDS.map((item) => calendarEventKey(slug, applicationId, item.id));
}
