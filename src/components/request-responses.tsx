"use client";

import { formatDate } from "@/lib/format";
import { approvalStatusLabel, parseApprovalStep } from "@/lib/recruitment-approval-flow";
import { useRecruitment } from "@/lib/recruitment-context";
import { companyFromSlug, REQUEST_COMPANY_LABELS } from "@/lib/recruitment-request";
import {
  deleteLocalResponse,
  loadRequestResponses,
  loadRequestSchema,
  updateLocalResponse,
  type RequestResponse,
  type RequestSchema,
} from "@/lib/request-schema";
import { useEffect, useMemo, useState } from "react";
import {
  EmptyValue,
  TableCard,
  TableRow,
  Td,
  Th,
  cell,
} from "./data-table";
import { IconClose, IconPencil, IconSearch, IconTrash } from "./icons";
import { RequestResponseEditor } from "./request-response-editor";
import { ScrollArea } from "./scroll-area";
import { PageFade, fieldClass } from "./ui";
import { AnimatePresence, motion } from "framer-motion";

const PREVIEW_KEYS = [
  "job_position",
  "department",
  "headcount_type",
  "priority_level",
  "expected_join_date",
  "direct_supervisor",
];

export function RequestResponsesPage() {
  const { slug } = useRecruitment();
  const company = companyFromSlug(slug);
  const companyLabel = REQUEST_COMPANY_LABELS[company];
  const [rows, setRows] = useState<RequestResponse[]>([]);
  const [schema, setSchema] = useState<RequestSchema | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RequestResponse | null>(null);
  const [editing, setEditing] = useState<RequestResponse | null>(null);
  const [removing, setRemoving] = useState<RequestResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedCompany, setLoadedCompany] = useState<string | null>(null);
  const loading = loadedCompany !== company;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadRequestResponses(company), loadRequestSchema(company)]).then(
      ([nextRows, nextSchema]) => {
        if (cancelled) return;
        setRows(nextRows);
        setSchema(nextSchema);
        setLoadedCompany(company);
        setSelected(null);
        setEditing(null);
        setRemoving(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [company]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return rows.filter((row) =>
      Object.values(row.payload).join(" ").toLowerCase().includes(needle),
    );
  }, [query, rows]);

  const labels = Object.fromEntries(
    (schema?.fields ?? []).map((item) => [item.id, item.label]),
  );

  function replaceRow(next: RequestResponse) {
    setRows((current) => current.map((row) => (row.id === next.id ? next : row)));
    setSelected((current) => (current?.id === next.id ? next : current));
  }

  async function deleteRow(row: RequestResponse) {
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/recruitment-requests/${row.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string; warning?: string };
      if (!response.ok) {
        if (/Database is not configured/i.test(payload.error ?? "")) {
          deleteLocalResponse(row.id);
        } else {
          throw new Error(payload.error || "Could not delete the request.");
        }
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSelected((current) => (current?.id === row.id ? null : current));
      setRemoving(null);
      setNotice(payload.warning || "Request deleted. Lark Approval was updated.");
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Could not delete the request.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading responses…</p>;

  return (
    <PageFade>
      <p className="mb-5 max-w-2xl text-sm text-muted">
        {companyLabel} submissions from the public form. Click a row for the full
        answer.{" "}
        <a
          href={`/recruitment-request?company=${company}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Open public form
        </a>
      </p>
      {notice ? <p className="mb-4 text-sm text-accent">{notice}</p> : null}
      <div className="relative mb-5 max-w-md">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search responses"
          className={`${fieldClass} pl-10`}
        />
      </div>

      <TableCard minWidth="1240px">
        <thead>
          <tr>
            <Th sticky>Submitted</Th>
            <Th>Status</Th>
            {PREVIEW_KEYS.map((key) => (
              <Th key={key}>{labels[key] ?? key}</Th>
            ))}
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={PREVIEW_KEYS.length + 3} className="px-5 py-12 text-sm text-muted">
                No responses yet.
              </td>
            </tr>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id} onClick={() => setSelected(row)}>
                <Td sticky nowrap muted>
                  {formatDate(row.created_at)}
                </Td>
                <Td nowrap>
                  {approvalStatusLabel(
                    row.approval_status || "pending",
                    parseApprovalStep(row.payload.approval_step),
                  )}
                </Td>
                {PREVIEW_KEYS.map((key) => (
                  <Td key={key} nowrap>
                    {cell(row.payload[key])}
                  </Td>
                ))}
                <Td nowrap>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setNotice("");
                        setEditing(row);
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
                        setRemoving(row);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </Td>
              </TableRow>
            ))
          )}
        </tbody>
      </TableCard>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-paper-raised p-4 shadow-xl sm:max-h-[90vh] sm:rounded-[24px] sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl">
                    {selected.payload.job_position || "Request"}
                  </h2>
                  <p className="text-sm text-muted">{formatDate(selected.created_at)}</p>
                  <a
                    href={`/recruitment-request/approval/${selected.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm text-accent hover:underline"
                  >
                    Open approval page
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 text-muted hover:bg-paper"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea axis="y" compact className="min-h-0 flex-1">
                <div className="space-y-3">
                {(schema?.fields ?? Object.keys(selected.payload).map((id) => ({ id, label: id })))
                  .filter((field) => selected.payload[field.id])
                  .map((field) => (
                    <div key={field.id}>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                        {field.label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {selected.payload[field.id] || <EmptyValue />}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(selected);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper"
                >
                  <IconPencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setRemoving(selected);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {editing && schema ? (
        <RequestResponseEditor
          row={editing}
          schema={schema}
          onClose={() => setEditing(null)}
          onSaved={(next, warning) => {
            if (warning?.includes("locally")) updateLocalResponse(next);
            replaceRow(next);
            setEditing(null);
            setNotice(warning || "Request updated. Lark Approval was synced.");
          }}
        />
      ) : null}

      {removing ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4"
          onClick={() => !deleting && setRemoving(null)}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-line bg-paper-raised p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-display text-2xl">Delete this request?</p>
            <p className="mt-2 text-sm text-muted">
              {removing.payload.job_position || "This request"} will be removed from
              Responses and deleted in Lark Approval.
            </p>
            {deleteError ? <p className="mt-3 text-sm text-accent">{deleteError}</p> : null}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteRow(removing)}
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
