"use client";

import { formatDate, formatDateTime, formatSheetDate } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import { nextInterviewAt } from "@/lib/tracker";
import { STAGES } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IconClose, IconMail, IconPhone, IconPin, IconStar } from "./icons";
import { Select } from "./fields";
import { Avatar } from "./display";
import { ScrollArea } from "./scroll-area";
import { fieldClass } from "./ui";

export function CandidateDrawer() {
  const {
    selected,
    setSelectedId,
    updateStage,
    updateRating,
    updateNotes,
  } = useRecruitment();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(selected?.candidate.notes ?? "");
  }, [selected]);

  return (
    <AnimatePresence>
      {selected ? (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end bg-ink/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedId(null)}
        >
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-line bg-paper-raised p-6"
          >
            <div className="flex shrink-0 items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={selected.candidate.full_name} />
                <div>
                  <h2 className="font-display text-2xl leading-tight">
                    {selected.candidate.full_name}
                  </h2>
                  <p className="text-sm text-muted">{selected.job.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <ScrollArea axis="y" compact className="mt-6 min-h-0 flex-1">

            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <IconMail className="h-4 w-4" />
                <a href={`mailto:${selected.candidate.email}`} className="hover:text-ink">
                  {selected.candidate.email}
                </a>
              </div>
              {selected.candidate.phone ? (
                <div className="flex items-center gap-2 text-muted">
                  <IconPhone className="h-4 w-4" />
                  {selected.candidate.phone}
                </div>
              ) : null}
              {selected.candidate.location ? (
                <div className="flex items-center gap-2 text-muted">
                  <IconPin className="h-4 w-4" />
                  {selected.candidate.location} · {selected.candidate.source}
                </div>
              ) : null}
            </dl>

            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted">
              Tahap
            </p>
            <div className="mt-2">
              <Select
                value={selected.stage}
                onChange={(next) =>
                  void updateStage(selected.id, next as (typeof STAGES)[number]["id"])
                }
                options={STAGES.map((stage) => ({
                  value: stage.id,
                  label: stage.label,
                }))}
              />
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted">Penilaian HR</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void updateRating(selected.id, value)}
                  className={`p-1 ${(selected.rating ?? 0) >= value ? "text-accent" : "text-line"}`}
                >
                  <IconStar className="h-5 w-5" fill="currentColor" />
                </button>
              ))}
            </div>

            {nextInterviewAt(selected) ? (
              <p className="mt-5 rounded-2xl bg-accent-soft px-3 py-3 text-sm text-accent-deep">
                Interview {formatDateTime(nextInterviewAt(selected)!)}
              </p>
            ) : null}

            <dl className="mt-5 space-y-2 text-sm text-muted">
              <div>Latest status: {selected.latest_status}</div>
              {selected.last_company ? <div>Last company: {selected.last_company}</div> : null}
              {selected.last_salary ? (
                <div>
                  Salary: {selected.last_salary} → {selected.expected_salary || "—"}
                </div>
              ) : null}
              {selected.offer_result ? <div>Offer: {selected.offer_result}</div> : null}
              {selected.join_date ? <div>Join: {formatSheetDate(selected.join_date)}</div> : null}
            </dl>

            <label className="mt-6 block text-xs uppercase tracking-[0.14em] text-muted">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => {
                if (notes !== (selected.candidate.notes ?? "")) {
                  void updateNotes(selected.candidate.id, notes);
                }
              }}
              rows={5}
              className={`${fieldClass} mt-2`}
            />

            <p className="mt-auto pt-8 text-xs text-muted">
              Melamar {formatDate(selected.applied_at)} · Update {formatDate(selected.updated_at)}
            </p>
            </ScrollArea>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
