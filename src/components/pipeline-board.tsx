"use client";

import { daysAgo } from "@/lib/format";
import { emailedChip, latestSendByApplication } from "@/lib/email-sends";
import { useEmailSends } from "@/lib/use-email-sends";
import { useRecruitment } from "@/lib/recruitment-context";
import {
  alertChip,
  collectScheduleAlerts,
  primaryAlert,
} from "@/lib/schedule-alerts";
import { STAGES, type Stage } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Avatar, PositionChip } from "./display";
import { PipelineSkeleton } from "./skeletons";
import { ScrollArea } from "./scroll-area";
import { PageFade } from "./ui";

export function PipelinePage() {
  const { slug, views, loading, updateStage, setSelectedId } = useRecruitment();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const alerts = useMemo(() => collectScheduleAlerts(views), [views]);
  const emailSends = useEmailSends(slug);
  const emailed = useMemo(() => latestSendByApplication(emailSends), [emailSends]);

  if (loading) return <PipelineSkeleton />;

  return (
    <PageFade className="flex min-h-0 h-full flex-1 flex-col">
      <p className="mb-3 shrink-0 text-sm text-muted sm:mb-4">
        Drag a card to the next column, or click to open candidate details.
      </p>
      <ScrollArea axis="x" className="min-h-0 flex-1">
        <div className="flex h-full items-stretch gap-4">
        {STAGES.map((stage) => {
          const cards = views.filter((item) => item.stage === stage.id);
          return (
            <section
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) void updateStage(draggingId, stage.id);
                setDraggingId(null);
              }}
              className="flex h-full w-[280px] shrink-0 flex-col rounded-[24px] border border-line bg-paper-raised/70"
            >
              <header className="flex shrink-0 items-center justify-between px-4 py-4">
                <div>
                  <h2 className="text-sm font-medium">{stage.label}</h2>
                  <p className="text-[11px] text-muted">{stage.hint}</p>
                </div>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-deep">
                  {cards.length}
                </span>
              </header>
              <ScrollArea axis="y" className="min-h-0 flex-1 px-3 pb-3">
                <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {cards.map((item) => {
                    const alert = primaryAlert(
                      alerts.filter((row) => row.item.id === item.id),
                    );
                    const lastEmail = emailed.get(item.id);
                    return (
                    <motion.button
                      layout
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      onClick={() => setSelectedId(item.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={`rounded-2xl border bg-paper-raised p-3 text-left shadow-sm ${
                        alert?.state === "overdue" || lastEmail
                          ? "border-accent"
                          : "border-line"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={item.candidate.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.candidate.full_name}
                          </p>
                          <PositionChip title={item.job.title} className="mt-1 max-w-full" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                        <span>{item.candidate.source}</span>
                        <span className={alert ? "font-medium text-accent" : undefined}>
                          {alert ? alertChip(alert) : daysAgo(item.updated_at)}
                        </span>
                      </div>
                      {lastEmail ? (
                        <p className="mt-2 text-[11px] font-medium text-accent">
                          {emailedChip(lastEmail)} · {daysAgo(lastEmail.sent_at)}
                        </p>
                      ) : null}
                      <StageDots current={item.stage} />
                    </motion.button>
                    );
                  })}
                </AnimatePresence>
                </div>
              </ScrollArea>
            </section>
          );
        })}
        </div>
      </ScrollArea>
    </PageFade>
  );
}

function StageDots({ current }: { current: Stage }) {
  const index = STAGES.findIndex((stage) => stage.id === current);
  const dropped = current === "rejected";
  const filled = dropped ? -1 : index;
  return (
    <div className="mt-3 flex gap-1">
      {STAGES.slice(0, 5).map((stage, stageIndex) => (
        <span
          key={stage.id}
          className={`h-1 flex-1 rounded-full ${
            dropped
              ? "bg-ink/20"
              : stageIndex <= filled
                ? "bg-accent"
                : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}
