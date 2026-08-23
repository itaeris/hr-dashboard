import { NextResponse } from "next/server";
import { canAccessCompany } from "@/lib/auth/access";
import { loadAppUser } from "@/lib/auth/app-users";
import { getSession } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/users";
import { isCompanySlug } from "@/lib/companies";
import { syncGoogleCalendar } from "@/lib/google-calendar/client";
import { hasGoogleCalendar } from "@/lib/google-calendar/tokens";
import type { CalendarSyncItem } from "@/lib/google-calendar/types";
import { EVENT_KINDS } from "@/lib/schedule-events";
import type { CompanySlug } from "@/lib/types";

function isSyncItem(value: unknown): value is CalendarSyncItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CalendarSyncItem;
  return (
    typeof item.key === "string" &&
    typeof item.label === "string" &&
    typeof item.iso === "string" &&
    typeof item.candidateName === "string" &&
    isCompanySlug(item.slug) &&
    EVENT_KINDS.some((kind) => kind.id === item.kind)
  );
}

function companyFromRequest(request: Request, bodyCompany?: unknown): CompanySlug | null {
  const url = new URL(request.url);
  const raw =
    (typeof bodyCompany === "string" ? bodyCompany : null) ?? url.searchParams.get("company");
  return raw && isCompanySlug(raw) ? raw : null;
}

async function authorizedCompany(user: AuthUser, slug: CompanySlug) {
  const profile = await loadAppUser(user.email);
  return canAccessCompany(user, slug, profile?.company);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ connected: false }, { status: 401 });
  const slug = companyFromRequest(request);
  if (!slug || !(await authorizedCompany(session, slug))) {
    return NextResponse.json({ connected: false }, { status: 403 });
  }
  return NextResponse.json({
    connected: await hasGoogleCalendar(session.email, slug),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    company?: unknown;
    events?: unknown;
    remove?: unknown;
  } | null;
  const slug = companyFromRequest(request, body?.company);
  if (!slug || !(await authorizedCompany(session, slug))) {
    return NextResponse.json({ error: "You cannot sync this brand." }, { status: 403 });
  }

  const events = (Array.isArray(body?.events) ? body.events.filter(isSyncItem) : []).filter(
    (item) => item.slug === slug,
  );
  const remove = (
    Array.isArray(body?.remove)
      ? body.remove.filter((item): item is string => typeof item === "string")
      : []
  ).filter((key) => key.startsWith(`${slug}:`));

  try {
    const result = await syncGoogleCalendar(session.email, slug, events, remove);
    if (!result.ok) {
      return NextResponse.json({ connected: false }, { status: 409 });
    }
    return NextResponse.json({ ok: true, connected: true });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : "Could not sync Google Calendar.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const slug = companyFromRequest(request);
  if (!slug || !(await authorizedCompany(session, slug))) {
    return NextResponse.json({ error: "You cannot disconnect this brand." }, { status: 403 });
  }
  const { deleteGoogleRefreshToken } = await import("@/lib/google-calendar/tokens");
  await deleteGoogleRefreshToken(session.email, slug);
  return NextResponse.json({ ok: true, connected: false });
}
