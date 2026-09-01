"use client";

import { daysAgo } from "@/lib/format";
import { emailKindLabel, latestSendByApplication } from "@/lib/email-sends";
import { useEmailSends } from "@/lib/use-email-sends";
import { useRecruitment } from "@/lib/recruitment-context";
import { alertChip, collectScheduleAlerts } from "@/lib/schedule-alerts";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconBell } from "./icons";

export function HeaderAlerts() {
  const { slug, views, setSelectedId } = useRecruitment();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const alerts = useMemo(() => collectScheduleAlerts(views), [views]);
  const due = useMemo(() => {
    const seen = new Map<string, (typeof alerts)[number]>();
    for (const alert of alerts) {
      if (!seen.has(alert.item.id)) seen.set(alert.item.id, alert);
    }
    return [...seen.values()].map((alert) => ({
      id: alert.item.id,
      name: alert.item.candidate.full_name,
      detail: `${alert.item.job.title} · ${alertChip(alert)}`,
    }));
  }, [alerts]);
  const emailSends = useEmailSends(slug);
  const emailed = useMemo(() => {
    const latest = latestSendByApplication(emailSends);
    const rows = [];
    for (const item of views) {
      const send = latest.get(item.id);
      if (send) {
        rows.push({
          id: item.id,
          name: item.candidate.full_name,
          detail: `${item.job.title} · ${emailKindLabel(send)} · ${daysAgo(send.sent_at)}`,
        });
      }
    }
    return rows;
  }, [emailSends, views]);
  const count = due.length;

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (root.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative inline-flex items-center justify-center rounded-full border p-2 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
          count
            ? "border-accent/40 bg-accent-soft text-accent-deep"
            : "border-line bg-paper-raised text-muted hover:text-ink"
        }`}
        aria-expanded={open}
        aria-label="Alerts"
      >
        <IconBell className="h-4 w-4" />
        <span className="hidden sm:inline">Alerts</span>
        {count ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white sm:static sm:h-auto sm:min-w-0 sm:px-1.5 sm:text-[11px]">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-[20px] border border-line bg-paper-raised p-3 shadow-xl">
          <AlertGroup
            title="Dates to follow up"
            empty="No overdue or due-today dates."
            items={due}
            onOpen={(id) => {
              setSelectedId(id);
              setOpen(false);
            }}
          />
          <AlertGroup
            title="Already emailed"
            empty="No emails sent from this workspace yet."
            items={emailed}
            onOpen={(id) => {
              setSelectedId(id);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function AlertGroup({
  title,
  empty,
  items,
  onOpen,
}: {
  title: string;
  empty: string;
  items: { id: string; name: string; detail: string }[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="border-t border-line px-1 py-2 first:border-t-0 first:pt-1 last:pb-1">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="w-full rounded-xl px-2 py-1.5 text-left hover:bg-paper"
              >
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-[12px] text-muted">{item.detail}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
