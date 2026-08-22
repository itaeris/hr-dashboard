"use client";

import { formatDate, formatSheetDate, formatTableDate } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import {
  hrToUserSla,
  isOpenVacancy,
  screeningSla,
  stageAging,
  stuckFlag,
  timeToFill,
  userToOfferSla,
} from "@/lib/tracker";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CandidateForm } from "./candidate-form";
import { CvCell } from "./cv-preview";
import { Avatar } from "./display";
import { IconClose, IconMail, IconPhone, IconTrash } from "./icons";
import { ScrollArea } from "./scroll-area";
import { SendEmailModal } from "./send-email-modal";
import { Pill } from "./data-table";

function Detail({ label, value }: { label: string; value: ReactNode }) {
  const empty =
    value === null || value === undefined || value === "" || value === "—";
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <div className="text-sm text-ink">{empty ? <span className="text-line">–</span> : value}</div>
    </div>
  );
}

export function CandidateDrawer() {
  const {
    selected,
    setSelectedId,
    jobs,
    updateCandidate,
    deleteCandidate,
  } = useRecruitment();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
    setEmailOpen(false);
  }, [selected?.id]);

  const jobOptions = selected
    ? jobs.filter(
        (job) => isOpenVacancy(job.status_vacancy) || job.id === selected.job_id,
      )
    : jobs;

  return (
    <AnimatePresence>
      {selected ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedId(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(90vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-line bg-paper-raised p-6 shadow-xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={selected.candidate.full_name} />
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-tight">
                    {selected.candidate.full_name}
                  </h2>
                  <p className="truncate text-sm text-muted">{selected.job.title}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper"
                  >
                    Cancel
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEmailOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper"
                    >
                      <IconMail className="h-3.5 w-3.5" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(false);
                        setEditing(true);
                      }}
                      className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ScrollArea axis="y" compact className="mt-6 min-h-0 flex-1">
              {editing ? (
                <CandidateForm
                  key={`${selected.id}-edit`}
                  item={selected}
                  jobs={jobOptions}
                  submitLabel="Save changes"
                  saving={saving}
                  onSubmit={async (input) => {
                    setSaving(true);
                    try {
                      await updateCandidate(selected.id, input);
                      setEditing(false);
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              ) : (
                <CandidateDetail item={selected} />
              )}
            </ScrollArea>
          </motion.div>
          <SendEmailModal
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            item={selected}
          />
          <DeleteConfirmDialog
            open={confirmDelete}
            name={selected.candidate.full_name}
            deleting={deleting}
            onKeep={() => setConfirmDelete(false)}
            onDelete={async () => {
              setDeleting(true);
              try {
                await deleteCandidate(selected.id);
              } finally {
                setDeleting(false);
              }
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DeleteConfirmDialog({
  open,
  name,
  deleting,
  onKeep,
  onDelete,
}: {
  open: boolean;
  name: string;
  deleting: boolean;
  onKeep: () => void;
  onDelete: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onKeep}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[24px] border border-line bg-paper-raised p-6 shadow-2xl"
          >
            <p className="font-display text-2xl">Delete this candidate?</p>
            <p className="mt-2 text-sm text-muted">
              {name} will be removed from Progress. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={onDelete}
                className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={onKeep}
                className="rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-paper"
              >
                Keep
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function CandidateDetail({
  item,
}: {
  item: NonNullable<ReturnType<typeof useRecruitment>["selected"]>;
}) {
  const stuck = stuckFlag(item);

  return (
    <div className="space-y-7 pb-4">
      <section className="flex flex-wrap items-center gap-3">
        <Pill>{item.latest_status}</Pill>
        {item.candidate.phone ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <IconPhone className="h-3.5 w-3.5" />
            {item.candidate.phone}
          </span>
        ) : null}
        <a
          href={`mailto:${item.candidate.email}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <IconMail className="h-3.5 w-3.5" />
          {item.candidate.email}
        </a>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Identity</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Candidate" value={item.candidate.full_name} />
          <Detail label="Position" value={item.job.title} />
          <Detail label="Source" value={item.candidate.source} />
          <Detail label="CV" value={item.cv_url ? <CvCell url={item.cv_url} /> : null} />
          <Detail label="Email" value={item.candidate.email} />
          <Detail label="Phone" value={item.candidate.phone} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Experience</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Total experience" value={item.total_experience} />
          <Detail label="Last company" value={item.last_company} />
          <Detail label="Last role" value={item.last_role} />
          <Detail label="Last salary" value={item.last_salary} />
          <Detail label="Expected salary" value={item.expected_salary} />
          <Detail label="Status" value={<Pill>{item.latest_status}</Pill>} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Interview & offer</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Approaching" value={formatTableDate(item.approaching_date)} />
          <Detail label="Response" value={formatTableDate(item.response_date)} />
          <Detail label="HR interview" value={formatTableDate(item.hr_interview_date)} />
          <Detail label="User interview" value={formatTableDate(item.user_interview_date)} />
          <Detail label="C-level" value={formatTableDate(item.third_interview_date)} />
          <Detail label="Offer date" value={formatTableDate(item.offer_date)} />
          <Detail label="Offer result" value={item.offer_result} />
          <Detail label="Join date" value={formatTableDate(item.join_date)} />
          <Detail label="Last stage" value={formatTableDate(item.last_stage_date)} />
          <Detail label="Shared with user" value={item.shared_with_user ? "Yes" : "No"} />
          <Detail label="Rejection letter" value={item.rejection_letter ? "Yes" : "No"} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Detail label="HR note" value={item.hr_interview_note} />
          <Detail label="User remarks" value={item.user_remarks} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Aging</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Aging" value={stageAging(item)} />
          <Detail
            label="Stuck"
            value={
              stuck ? (
                <Pill tone={stuck === "STUCK" ? "warn" : "muted"}>
                  {stuck === "STUCK" ? "Stuck" : "Dropped"}
                </Pill>
              ) : null
            }
          />
          <Detail label="Screening SLA" value={screeningSla(item)} />
          <Detail label="HR → User" value={hrToUserSla(item)} />
          <Detail label="User → Offer" value={userToOfferSla(item)} />
          <Detail label="Time to fill" value={timeToFill(item)} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Note</p>
        <p className="text-sm text-ink">
          {item.candidate.notes || <span className="text-line">–</span>}
        </p>
        <p className="mt-5 text-xs text-muted">
          Applied {formatDate(item.applied_at)}
          {item.join_date ? ` · Join ${formatSheetDate(item.join_date)}` : ""} · Updated{" "}
          {formatDate(item.updated_at)}
        </p>
      </section>
    </div>
  );
}
