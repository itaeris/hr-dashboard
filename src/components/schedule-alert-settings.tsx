"use client";

import {
  loadScheduleAlertSettings,
  saveScheduleAlertSettings,
} from "@/lib/schedule-alert-settings";
import { useRecruitment } from "@/lib/recruitment-context";
import { useEffect, useState } from "react";

export function ScheduleAlertSettings() {
  const { slug, brand } = useRecruitment();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadedFor, setLoadedFor] = useState(slug);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (loadedFor !== slug) {
    setLoadedFor(slug);
    setEnabled(null);
    setError("");
    setSuccess("");
  }

  useEffect(() => {
    let live = true;
    void loadScheduleAlertSettings(slug).then((next) => {
      if (live) setEnabled(next.email_enabled);
    });
    return () => {
      live = false;
    };
  }, [slug]);

  if (enabled === null) return null;

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await saveScheduleAlertSettings(slug, { email_enabled: next });
      setSuccess(next ? "Reminder emails are on." : "Reminder emails are off.");
    } catch (cause) {
      setEnabled(!next);
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[24px] border border-line bg-paper-raised p-5">
      <div>
        <h2 className="text-lg font-medium">Email reminders</h2>
        <p className="mt-1 text-sm text-muted">
          Morning digest to HR when a {brand.shortName} candidate date is overdue
          or due today. The Alerts bell is unchanged.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Send schedule reminder emails</p>
          <p className="mt-0.5 text-xs text-muted">
            {enabled
              ? "On - HR accounts for this brand get the morning email."
              : "Off - no reminder email. Dates still show on Pipeline and Alerts."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Send schedule reminder emails"
          disabled={pending}
          onClick={() => void toggle()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled ? "bg-accent" : "bg-line"
          } disabled:opacity-60`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
              enabled ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}
    </div>
  );
}
