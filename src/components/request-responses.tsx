"use client";

import { formatDate } from "@/lib/format";
import { useRecruitment } from "@/lib/recruitment-context";
import { companyFromSlug, REQUEST_COMPANY_LABELS } from "@/lib/recruitment-request";
import {
  loadRequestResponses,
  loadRequestSchema,
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
import { IconClose, IconSearch } from "./icons";
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
      <div className="relative mb-5 max-w-md">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search responses"
          className={`${fieldClass} pl-10`}
        />
      </div>

      <TableCard minWidth="1100px">
        <thead>
          <tr>
            <Th sticky>Submitted</Th>
            {PREVIEW_KEYS.map((key) => (
              <Th key={key}>{labels[key] ?? key}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={PREVIEW_KEYS.length + 1} className="px-5 py-12 text-sm text-muted">
                No responses yet.
              </td>
            </tr>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id} onClick={() => setSelected(row)}>
                <Td sticky nowrap muted>
                  {formatDate(row.created_at)}
                </Td>
                {PREVIEW_KEYS.map((key) => (
                  <Td key={key} nowrap>
                    {cell(row.payload[key])}
                  </Td>
                ))}
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
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 text-muted hover:bg-paper"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageFade>
  );
}
