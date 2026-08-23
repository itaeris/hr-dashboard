import { isoToYmd } from "@/lib/format";
import { COMPANIES } from "@/lib/companies";
import type { CompanySlug } from "@/lib/types";
import { calendarSummary } from "./scope";
import type { CalendarSyncItem } from "./types";
import { deleteGoogleRefreshToken, loadGoogleRefreshToken, saveGoogleRefreshToken } from "./tokens";

const API = "https://www.googleapis.com/calendar/v3";
const PROPERTY = "hrEventKey";
const calendarIds = new Map<string, string>();

const COLOR: Record<CalendarSyncItem["kind"], string> = {
  approaching: "8",
  hr: "4",
  user: "2",
  third: "3",
  offer: "5",
  join: "10",
};

function isDateOnly(iso: string) {
  const date = new Date(iso);
  return date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
}

function eventBody(item: CalendarSyncItem) {
  const summary = `${item.company} · ${item.label} · ${item.candidateName}`;
  const description = [
    item.company,
    item.jobTitle,
    item.status,
    "Created from HR Recruitment. This calendar is brand-specific.",
  ]
    .filter(Boolean)
    .join("\n");

  const shared = {
    summary,
    description,
    colorId: COLOR[item.kind],
    extendedProperties: {
      private: { [PROPERTY]: item.key },
    },
  };

  if (isDateOnly(item.iso)) {
    const start = isoToYmd(item.iso);
    const endDate = new Date(`${start}T12:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    const end = [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      ...shared,
      start: { date: start },
      end: { date: end },
    };
  }

  const start = new Date(item.iso);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    ...shared,
    start: { dateTime: start.toISOString(), timeZone: "Asia/Jakarta" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Jakarta" },
  };
}

async function refreshAccessToken(email: string, slug: CompanySlug) {
  const refresh = await loadGoogleRefreshToken(email, slug);
  if (!refresh) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      await deleteGoogleRefreshToken(email, slug);
    }
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (payload.refresh_token) {
    await saveGoogleRefreshToken(email, slug, payload.refresh_token);
  }
  return payload.access_token ?? null;
}

async function googleError(response: Response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text) as { error?: { message?: string; status?: string } };
    const message = payload.error?.message ?? "";
    if (message.includes("has not been used") || message.includes("is disabled")) {
      return "Enable the Google Calendar API in Cloud Console (not CalDAV), then try again.";
    }
    if (payload.error?.status === "PERMISSION_DENIED" || response.status === 403) {
      return "Google Calendar access was denied. Disconnect, then Connect again and allow Calendar.";
    }
    return message || "Google Calendar sync failed.";
  } catch {
    return text || "Google Calendar sync failed.";
  }
}

async function googleFetch(accessToken: string, path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function eventsPath(calendarId: string, suffix = "") {
  return `/calendars/${encodeURIComponent(calendarId)}/events${suffix}`;
}

async function ensureBrandCalendar(accessToken: string, email: string, slug: CompanySlug) {
  const cacheKey = `${email}:${slug}`;
  const cached = calendarIds.get(cacheKey);
  if (cached) return cached;

  const title = calendarSummary(slug);
  const list = await googleFetch(accessToken, "/users/me/calendarList?maxResults=250");
  if (!list.ok) throw new Error(await googleError(list));
  const payload = (await list.json()) as { items?: { id?: string; summary?: string }[] };
  const existing = payload.items?.find((item) => item.summary === title && item.id);
  if (existing?.id) {
    calendarIds.set(cacheKey, existing.id);
    return existing.id;
  }

  const created = await googleFetch(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({
      summary: title,
      timeZone: "Asia/Jakarta",
      description: `Recruitment dates for ${COMPANIES[slug].name} only.`,
    }),
  });
  if (!created.ok) throw new Error(await googleError(created));
  const calendar = (await created.json()) as { id?: string };
  if (!calendar.id) throw new Error("Could not create the brand Google Calendar.");
  calendarIds.set(cacheKey, calendar.id);
  return calendar.id;
}

async function findEventId(accessToken: string, calendarId: string, key: string) {
  const params = new URLSearchParams({
    privateExtendedProperty: `${PROPERTY}=${key}`,
    maxResults: "1",
  });
  const response = await googleFetch(
    accessToken,
    `${eventsPath(calendarId)}?${params.toString()}`,
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as { items?: { id?: string }[] };
  return payload.items?.[0]?.id ?? null;
}

export async function syncGoogleCalendar(
  email: string,
  slug: CompanySlug,
  events: CalendarSyncItem[],
  remove: string[] = [],
) {
  const accessToken = await refreshAccessToken(email, slug);
  if (!accessToken) return { ok: false as const, reason: "disconnected" };

  const allowed = events.filter((item) => item.slug === slug);
  const allowedRemove = remove.filter((key) => key.startsWith(`${slug}:`));
  const calendarId = await ensureBrandCalendar(accessToken, email, slug);

  for (const key of allowedRemove) {
    const id = await findEventId(accessToken, calendarId, key);
    if (!id) continue;
    await googleFetch(accessToken, eventsPath(calendarId, `/${id}`), { method: "DELETE" });
  }

  for (const item of allowed) {
    const body = JSON.stringify(eventBody(item));
    const existing = await findEventId(accessToken, calendarId, item.key);
    const response = existing
      ? await googleFetch(accessToken, eventsPath(calendarId, `/${existing}`), {
          method: "PATCH",
          body,
        })
      : await googleFetch(accessToken, eventsPath(calendarId), { method: "POST", body });
    if (!response.ok && response.status !== 404) {
      throw new Error(await googleError(response));
    }
  }

  return { ok: true as const };
}
