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
import { AddJobModal } from "./modals";
import { IconPlus } from "./icons";
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
] as const;

export function JobsPage() {
  const { jobs, views, loading } = useRecruitment();
  const [open, setOpen] = useState(false);

  if (loading) return <TableSkeleton />;

  return (
    <PageFade>
      <div className="mb-6 flex items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-muted">
          Vacancy Tracker — columns follow the Aeris recruitment template.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <IconPlus className="h-4 w-4" />
          New vacancy
        </button>
      </div>

      <TableCard minWidth="1480px">
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
              <TableRow key={job.id}>
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
              </TableRow>
            );
          })}
        </tbody>
      </TableCard>
      <AddJobModal open={open} onClose={() => setOpen(false)} />
    </PageFade>
  );
}
