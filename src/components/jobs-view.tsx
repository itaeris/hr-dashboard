"use client";

import { formatTableDate } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import { hireStatus, hiredCount, isOpenVacancy, slaAging, slaResult } from "@/lib/tracker";
import { useState } from "react";
import {
  EmptyValue,
  Pill,
  TableCard,
  TableRow,
  Td,
  Th,
  cell,
} from "./data-table";
import { TableSkeleton } from "./skeletons";
import { AddJobModal, EditJobModal, JobPreviewModal } from "./modals";
import { IconPencil, IconPlus, IconTrash } from "./icons";
import { PageFade } from "./ui";

const COLUMNS = [
  { label: "Type", sticky: true },
  { label: "Position" },
  { label: "Level" },
  { label: "Department" },
  { label: "Hiring manager" },
  { label: "Recruiter PIC" },
  { label: "Needed", align: "center" as const },
  { label: "Hired", align: "center" as const },
  { label: "Request date" },
  { label: "SLA target", align: "center" as const },
  { label: "Target join" },
  { label: "Status vacancy" },
  { label: "Status hire" },
  { label: "Fulfilled date" },
  { label: "Offer stage" },
  { label: "Priority" },
  { label: "SLA aging", align: "center" as const, groupStart: true },
  { label: "SLA result" },
  { label: "Notes" },
  { label: "Actions" },
] as const;

export function JobsPage() {
  const { jobs, views, loading, deleteJob } = useRecruitment();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<(typeof jobs)[number] | null>(null);
  const [editing, setEditing] = useState<(typeof jobs)[number] | null>(null);
  const [removing, setRemoving] = useState<(typeof jobs)[number] | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (loading) return <TableSkeleton />;

  return (
    <PageFade>
      <div className="mb-5 flex flex-col items-stretch gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <p className="max-w-xl text-sm text-muted">
          Vacancy Tracker — columns follow the Aeris recruitment template.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <IconPlus className="h-4 w-4" />
          New vacancy
        </button>
      </div>

      <TableCard minWidth="1600px">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <Th
                key={column.label}
                sticky={"sticky" in column && column.sticky}
                align={"align" in column ? column.align : "left"}
                groupStart={"groupStart" in column && column.groupStart}
              >
                {column.label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const hired = hiredCount(job.id, views);
            const statusHire = hireStatus(hired, job.headcount_needed);
            const aging = slaAging(job);
            const result = slaResult(job);
            return (
              <TableRow key={job.id} onClick={() => setPreview(job)}>
                <Td sticky nowrap muted>
                  {job.hire_type}
                </Td>
                <Td className="min-w-[180px] font-medium">{job.title}</Td>
                <Td nowrap>{job.level}</Td>
                <Td>{job.department}</Td>
                <Td>{cell(job.hiring_manager)}</Td>
                <Td>{cell(job.recruiter_pic)}</Td>
                <Td align="center" className="tabular-nums">
                  {job.headcount_needed}
                </Td>
                <Td align="center" className="tabular-nums font-medium">
                  {hired}
                </Td>
                <Td nowrap muted>
                  {cell(formatTableDate(job.request_date))}
                </Td>
                <Td align="center" className="tabular-nums">
                  {job.sla_target}
                </Td>
                <Td nowrap muted>
                  {cell(formatTableDate(job.target_join))}
                </Td>
                <Td nowrap>
                  <Pill tone={isOpenVacancy(job.status_vacancy) ? "soft" : "muted"}>
                    {job.status_vacancy}
                  </Pill>
                </Td>
                <Td nowrap>
                  <Pill tone={statusHire === "FULFILLED" ? "ok" : "muted"}>
                    {statusHire === "FULFILLED" ? "Fulfilled" : "In progress"}
                  </Pill>
                </Td>
                <Td nowrap muted>
                  {cell(formatTableDate(job.fulfilled_date))}
                </Td>
                <Td>{cell(job.offer_stage)}</Td>
                <Td nowrap>
                  {job.priority ? (
                    <Pill
                      tone={
                        job.priority === "High"
                          ? "solid"
                          : job.priority === "Medium"
                            ? "soft"
                            : "muted"
                      }
                    >
                      {job.priority}
                    </Pill>
                  ) : (
                    <EmptyValue />
                  )}
                </Td>
                <Td align="center" groupStart className="tabular-nums">
                  {aging}
                </Td>
                <Td nowrap>
                  <span
                    className={
                      result === "MEET SLA" ? "text-accent" : "font-medium text-ink"
                    }
                  >
                    {result === "MEET SLA" ? "Meet SLA" : "Over SLA"}
                  </span>
                </Td>
                <Td muted className="max-w-[220px] truncate">
                  {cell(job.notes)}
                </Td>
                <Td nowrap>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(job);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-ink hover:bg-paper"
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteError("");
                        setRemoving(job);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </Td>
              </TableRow>
            );
          })}
        </tbody>
      </TableCard>
      <AddJobModal open={open} onClose={() => setOpen(false)} />
      <JobPreviewModal job={preview} onClose={() => setPreview(null)} />
      <EditJobModal job={editing} onClose={() => setEditing(null)} />
      {removing ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4"
          onClick={() => !deleting && setRemoving(null)}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-line bg-paper-raised p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-display text-2xl">Delete this vacancy?</p>
            <p className="mt-2 text-sm text-muted">
              {removing.title} will be removed from Vacancy Tracker. Candidates on
              this role must be moved or deleted first.
            </p>
            {deleteError ? <p className="mt-3 text-sm text-accent">{deleteError}</p> : null}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    await deleteJob(removing.id);
                    setRemoving(null);
                  } catch (cause) {
                    setDeleteError(
                      cause instanceof Error ? cause.message : "Could not delete vacancy.",
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setRemoving(null)}
                className="rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-paper"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFade>
  );
}
