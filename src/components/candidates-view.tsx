"use client";

import { formatTableDate } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import {
  alignedLatestStatus,
  hrToUserSla,
  isHired,
  screeningSla,
  stageAging,
  stuckFlag,
  timeToFill,
  userToOfferSla,
} from "@/lib/tracker";
import {
  TABLE_SORT_OPTIONS,
  compareByDate,
  compareByName,
  paginate,
  type PageSize,
  type TableSortKey,
} from "@/lib/table-page";
import { LATEST_STATUSES, type LatestStatus } from "@/lib/types";
import { useMemo, useState } from "react";
import { CandidateDrawer } from "./candidate-drawer";
import {
  EmptyValue,
  Pill,
  TableCard,
  TableRow,
  Td,
  Th,
  cell,
} from "./data-table";
import { CvCell } from "./cv-preview";
import { Avatar, PositionChip } from "./display";
import { TableSkeleton } from "./skeletons";
import { IconSearch } from "./icons";
import { Select } from "./fields";
import { TablePager } from "./table-pager";
import { PageFade, fieldClass } from "./ui";

const COLUMNS = [
  { label: "Candidate", sticky: true },
  { label: "Position" },
  { label: "Source" },
  { label: "CV" },
  { label: "Experience" },
  { label: "Last company" },
  { label: "Last role" },
  { label: "Last salary" },
  { label: "Expected salary" },
  { label: "Status" },
  { label: "Approaching" },
  { label: "Response" },
  { label: "HR interview" },
  { label: "HR note" },
  { label: "Shared" },
  { label: "User interview" },
  { label: "User remarks" },
  { label: "C-level" },
  { label: "Offer date" },
  { label: "Offer result" },
  { label: "Join date" },
  { label: "Last stage" },
  { label: "Aging", align: "center" as const, groupStart: true },
  { label: "Stuck" },
  { label: "Rejection letter" },
  { label: "Note" },
  { label: "Screening SLA", align: "center" as const, groupStart: true },
  { label: "HR → User", align: "center" as const },
  { label: "User → Offer", align: "center" as const },
  { label: "Time to fill", align: "center" as const },
] as const;

function boolLabel(value: boolean) {
  return value ? "Yes" : "No";
}

export function CandidatesPage() {
  const { views, jobs, loading, setSelectedId } = useRecruitment();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LatestStatus | "all">("all");
  const [jobId, setJobId] = useState("all");
  const [sort, setSort] = useState<TableSortKey>("newest");
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return views.filter((item) => {
      const haystack = `${item.candidate.full_name} ${item.job.title} ${item.candidate.source}`.toLowerCase();
      return (
        haystack.includes(query.toLowerCase()) &&
        (status === "all" || alignedLatestStatus(item) === status) &&
        (jobId === "all" || item.job_id === jobId)
      );
    });
  }, [jobId, query, status, views]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    next.sort((left, right) => {
      if (sort === "az" || sort === "za") {
        return compareByName(
          left.candidate.full_name,
          right.candidate.full_name,
          sort === "za",
        );
      }
      return compareByDate(
        left.updated_at || left.applied_at,
        right.updated_at || right.applied_at,
        sort === "newest",
      );
    });
    return next;
  }, [filtered, sort]);

  const filterKey = `${query}:${status}:${jobId}:${sort}:${pageSize}`;
  const [activeKey, setActiveKey] = useState(filterKey);
  if (activeKey !== filterKey) {
    setActiveKey(filterKey);
    setPage(1);
  }

  const { pageCount, currentPage, items: paged } = paginate(sorted, page, pageSize);

  if (loading) return <TableSkeleton filters />;

  return (
    <PageFade>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, role, or source"
            className={`${fieldClass} pl-10`}
          />
        </div>
        <Select
          className="w-full min-w-0 lg:max-w-52"
          value={status}
          onChange={(next) => setStatus(next as LatestStatus | "all")}
          options={[
            { value: "all", label: "All statuses" },
            ...LATEST_STATUSES.map((item) => ({ value: item, label: item })),
          ]}
        />
        <Select
          className="w-full min-w-0 lg:max-w-64"
          value={jobId}
          onChange={setJobId}
          options={[
            { value: "all", label: "All roles" },
            ...jobs.map((job) => ({ value: job.id, label: job.title })),
          ]}
        />
        <Select
          className="w-full min-w-0 lg:max-w-48"
          value={sort}
          onChange={(next) => setSort(next as TableSortKey)}
          options={TABLE_SORT_OPTIONS}
        />
      </div>

      <TableCard minWidth="2280px">
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
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="px-5 py-12 text-sm text-muted">
                No matching candidates.
              </td>
            </tr>
          ) : (
            paged.map((item) => {
              const stuck = stuckFlag(item);
              const hired = isHired(item);
              return (
                <TableRow
                  key={item.id}
                  highlight={hired ? "hired" : undefined}
                  onClick={() => setSelectedId(item.id)}
                >
                  <Td sticky nowrap>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={item.candidate.full_name} size="sm" />
                      <span className="font-medium">{item.candidate.full_name}</span>
                    </span>
                  </Td>
                  <Td nowrap>
                    <PositionChip title={item.job.title} />
                  </Td>
                  <Td muted>{item.candidate.source}</Td>
                  <Td>
                    <CvCell url={item.cv_url} />
                  </Td>
                  <Td>{cell(item.total_experience)}</Td>
                  <Td>{cell(item.last_company)}</Td>
                  <Td>{cell(item.last_role)}</Td>
                  <Td nowrap muted>
                    {cell(item.last_salary)}
                  </Td>
                  <Td nowrap muted>
                    {cell(item.expected_salary)}
                  </Td>
                  <Td nowrap>
                    <Pill>{alignedLatestStatus(item)}</Pill>
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.approaching_date))}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.response_date))}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.hr_interview_date))}
                  </Td>
                  <Td muted className="max-w-[200px] truncate">
                    {cell(item.hr_interview_note)}
                  </Td>
                  <Td muted>{boolLabel(item.shared_with_user)}</Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.user_interview_date))}
                  </Td>
                  <Td muted className="max-w-[180px] truncate">
                    {cell(item.user_remarks)}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.third_interview_date))}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.offer_date))}
                  </Td>
                  <Td nowrap>
                    {item.offer_result ? (
                      <Pill
                        tone={
                          item.offer_result === "Offer Accepted"
                            ? "ok"
                            : item.offer_result === "Offer Rejected"
                              ? "muted"
                              : "soft"
                        }
                      >
                        {item.offer_result}
                      </Pill>
                    ) : (
                      <EmptyValue />
                    )}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.join_date))}
                  </Td>
                  <Td nowrap muted>
                    {cell(formatTableDate(item.last_stage_date))}
                  </Td>
                  <Td align="center" groupStart className="tabular-nums">
                    {stageAging(item)}
                  </Td>
                  <Td nowrap>
                    {stuck ? (
                      <Pill tone={stuck === "STUCK" ? "warn" : "muted"}>
                        {stuck === "STUCK" ? "Stuck" : "Dropped"}
                      </Pill>
                    ) : (
                      <EmptyValue />
                    )}
                  </Td>
                  <Td muted>{boolLabel(item.rejection_letter)}</Td>
                  <Td muted className="max-w-[180px] truncate">
                    {cell(item.candidate.notes)}
                  </Td>
                  <Td align="center" groupStart className="tabular-nums">
                    {cell(screeningSla(item))}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {cell(hrToUserSla(item))}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {cell(userToOfferSla(item))}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {cell(timeToFill(item))}
                  </Td>
                </TableRow>
              );
            })
          )}
        </tbody>
      </TableCard>
      <TablePager
        page={currentPage}
        pageCount={pageCount}
        total={sorted.length}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
      />
      <CandidateDrawer />
    </PageFade>
  );
}
