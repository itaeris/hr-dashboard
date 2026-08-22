import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { syncGoogleCalendar } from "@/lib/google-calendar/client";
import { hasGoogleCalendar } from "@/lib/google-calendar/tokens";
import type { CalendarSyncItem } from "@/lib/google-calendar/types";
import { EVENT_KINDS } from "@/lib/schedule-events";

function isSyncItem(value: unknown): value is CalendarSyncItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CalendarSyncItem;
  return (
    typeof item.key === "string" &&
    typeof item.label === "string" &&
    typeof item.iso === "string" &&
    typeof item.candidateName === "string" &&
    EVENT_KINDS.some((kind) => kind.id === item.kind)
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ connected: false }, { status: 401 });
  return NextResponse.json({
    connected: await hasGoogleCalendar(session.email),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    events?: unknown;
    remove?: unknown;
  } | null;
  const events = Array.isArray(body?.events) ? body.events.filter(isSyncItem) : [];
  const remove = Array.isArray(body?.remove)
    ? body.remove.filter((item): item is string => typeof item === "string")
    : [];

  try {
    const result = await syncGoogleCalendar(session.email, events, remove);
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

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { deleteGoogleRefreshToken } = await import("@/lib/google-calendar/tokens");
  await deleteGoogleRefreshToken(session.email);
  return NextResponse.json({ ok: true, connected: false });
}
