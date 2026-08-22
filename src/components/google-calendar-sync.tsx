"use client";

import { collectScheduleEvents } from "@/lib/schedule-events";
import { toCalendarSyncItems } from "@/lib/google-calendar/push";
import { useRecruitment } from "@/lib/recruitment-context";
import { useEffect, useState } from "react";
import { IconCalendar } from "./icons";

export function GoogleCalendarSync() {
  const { slug, brand, views } = useRecruitment();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("google");
    if (!flag) return;
    params.delete("google");
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
    if (flag === "connected") {
      setConnected(true);
      void syncAll();
    } else if (flag === "consent") {
      setMessage("Google did not return calendar access. Try Connect again and allow Calendar.");
    } else if (flag === "denied") {
      setMessage("Google Calendar access was cancelled.");
    } else if (flag === "domain") {
      setMessage("Use a company Google account.");
    } else if (flag === "oauth") {
      setMessage("Google Calendar connect failed. Try again.");
    } else if (flag === "config") {
      setMessage("Google sign-in is not configured.");
    }
    // views are loaded by the time user returns from OAuth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
