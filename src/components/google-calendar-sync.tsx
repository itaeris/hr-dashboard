"use client";

import { collectScheduleEvents } from "@/lib/schedule-events";
import { toCalendarSyncItems } from "@/lib/google-calendar/push";
import { useRecruitment } from "@/lib/recruitment-context";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IconCalendar } from "./icons";

function oauthMessage(flag: string | null): string {
  if (flag === "consent") {
    return "Google did not return calendar access. Try Connect again and allow Calendar.";
  }
  if (flag === "denied") return "Google Calendar access was cancelled.";
  if (flag === "domain") return "Use a company Google account.";
  if (flag === "oauth") return "Google Calendar connect failed. Try again.";
  if (flag === "config") return "Google sign-in is not configured.";
  return "";
}

export function GoogleCalendarSync() {
  return (
    <Suspense fallback={null}>
      <GoogleCalendarSyncInner />
    </Suspense>
  );
}

function GoogleCalendarSyncInner() {
  const { slug, brand, views } = useRecruitment();
  const searchParams = useSearchParams();
  const flag = searchParams.get("google");
  const [connected, setConnected] = useState(flag === "connected");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => oauthMessage(flag));
  const [consumedFlag, setConsumedFlag] = useState<string | null>(null);
  if (flag && flag !== consumedFlag) {
    setConsumedFlag(flag);
    if (flag === "connected") setConnected(true);
    const text = oauthMessage(flag);
    if (text) setMessage(text);
  }

  useEffect(() => {
    void fetch("/api/calendar/sync")
      .then((response) => response.json())
      .then((payload: { connected?: boolean }) => {
        setConnected(Boolean(payload.connected));
      })
      .catch(() => {});
  }, []);

  async function syncAll() {
    setBusy(true);
    setMessage("");
    try {
      const events = toCalendarSyncItems(collectScheduleEvents(views), brand.name);
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      const payload = (await response.json()) as {
        connected?: boolean;
        error?: string;
      };
      if (response.status === 409) {
        setConnected(false);
        setMessage("Connect Google Calendar first.");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Sync failed.");
      setConnected(true);
      setMessage(
        events.length
          ? `${events.length} schedule items sent to Google Calendar.`
          : "Connected. New dates will sync automatically.",
      );
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not sync.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!flag) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("google")) return;
    params.delete("google");
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
    if (flag !== "connected") return;
    const timer = window.setTimeout(() => {
      void syncAll();
    }, 0);
    return () => window.clearTimeout(timer);
    // views are loaded by the time user returns from OAuth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag]);

  async function disconnect() {
    setBusy(true);
    await fetch("/api/calendar/sync", { method: "DELETE" });
    setConnected(false);
    setMessage("Disconnected. Existing Google events were kept.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-line bg-paper-raised px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium">
          <IconCalendar className="h-4 w-4 text-accent" />
          Google Calendar
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {connected
            ? "Progress dates are copied to your Google Calendar."
            : "Connect your Google account so interviews and joins appear there."}
        </p>
        {message ? <p className="mt-1 text-xs text-accent">{message}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {connected ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void syncAll()}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void disconnect()}
              className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-ink disabled:opacity-50"
            >
              Disconnect
            </button>
          </>
        ) : (
          <a
            href={`/api/auth/google/calendar?next=/${slug}/calendar`}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Connect Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}
