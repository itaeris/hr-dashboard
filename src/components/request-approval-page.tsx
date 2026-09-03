"use client";

import { COMPANIES, themeStyle } from "@/lib/companies";
import { formatDate } from "@/lib/format";
import {
  APPROVAL_STEP_LABELS,
  DEFAULT_APPROVAL_FLOW,
  approvalProcessPreview,
  canDecideCurrentStep,
  flowFromPayload,
  memberNames,
  parseApprovalStep,
  waitingCopy,
  type ApprovalFlowConfig,
  type ApprovalStep,
  type ApprovalViewer,
} from "@/lib/recruitment-approval-flow";
import {
  REQUEST_COMPANY_LABELS,
  isRequestCompany,
  slugFromRequestCompany,
} from "@/lib/recruitment-request";
import { defaultRequestSchema } from "@/lib/request-schema";
import type { ApprovalStatus, StoredRecruitmentRequest } from "@/lib/request-approval-types";
import { useState } from "react";
import { PageFade } from "./ui";

const STATUS_COPY: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "Pending approval", className: "bg-accent-soft text-accent-deep" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-800" },
};

function membersForStep(
  id: "leader" | "hr" | "handle",
  leaderName: string,
  flow: ApprovalFlowConfig,
) {
  if (id === "leader") return leaderName.trim() || "Requester’s selected business leader";
  if (id === "hr") return memberNames(flow.hrApprovers).join(", ");
  return memberNames(flow.handleMembers).join(", ");
}

function futureCopy(id: "hr" | "handle") {
  if (id === "hr") return "Process will start after Business Leader approval.";
  return "Process will start after HR and Business Leader approval.";
}

export function RequestApprovalPage({
  request,
  viewer,
  fallbackFlow = DEFAULT_APPROVAL_FLOW,
}: {
  request: StoredRecruitmentRequest;
  viewer: ApprovalViewer | null;
  fallbackFlow?: ApprovalFlowConfig;
}) {
  const [status, setStatus] = useState(request.approval_status);
  const [step, setStep] = useState(request.approval_step);
  const [comment, setComment] = useState(request.approval_comment);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const schema = defaultRequestSchema();
  const company = isRequestCompany(request.company)
    ? request.company
    : isRequestCompany(request.payload.company)
      ? request.payload.company
      : "AERIS";
  const brand = COMPANIES[slugFromRequestCompany(company)];
  const title = request.payload.job_position || "Recruitment request";
  const pending = status === "pending";
  const flow = flowFromPayload(request.payload, fallbackFlow);
  const preview = approvalProcessPreview(request.payload.direct_supervisor ?? "", flow);
  const canAct = pending && canDecideCurrentStep(viewer, step, request.payload, flow);

  const fields = schema.fields.filter((field) => {
    if (field.id.endsWith("_id")) return false;
    if (field.id.startsWith("approval_")) return false;
    return Boolean(String(request.payload[field.id] ?? "").trim());
  });

  async function decide(next: "approved" | "rejected") {
    if (!canAct) return;
    if (next === "rejected" && !draft.trim()) {
      setError("Add a short reason to reject.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/lark/approvals/${request.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next, comment: draft.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        approval_status?: ApprovalStatus;
        approval_step?: ApprovalStep;
        approval_comment?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not save the decision.");
      setStatus(payload.approval_status ?? next);
      setStep(parseApprovalStep(payload.approval_step));
      setComment(payload.approval_comment ?? draft.trim());
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the decision.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={themeStyle(brand.theme)} className="min-h-full bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          Lark Approval
        </p>
        <PageFade>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${STATUS_COPY[status].className}`}
            >
              {status === "pending" ? APPROVAL_STEP_LABELS[step] : STATUS_COPY[status].label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {REQUEST_COMPANY_LABELS[company]} · submitted {formatDate(request.created_at)}
          </p>

          <ol className="mt-5 space-y-3">
            {preview.map((item, index) => {
              const active = pending && item.id === step;
              const done = step === "done" || stageComplete(item.id, step, status);
              const locked = pending && !done && !active;
              const confirm = item.id === "handle" ? "Handled" : "Approve";
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border px-4 py-4 sm:px-5 ${
                    active
                      ? "border-accent bg-accent-soft"
                      : locked
                        ? "border-line bg-paper opacity-70"
                        : "border-line bg-paper-raised"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        done
                          ? "bg-emerald-50 text-emerald-800"
                          : active
                            ? "bg-white text-accent-deep"
                            : "bg-paper text-muted"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-medium">{item.title}</h2>
                        <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                          {done ? "Done" : active ? "Current" : "Waiting"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {done
                          ? "This step is complete."
                          : active
                            ? waitingCopy(item.id)
                            : futureCopy(item.id === "leader" ? "hr" : item.id)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {membersForStep(item.id, request.payload.direct_supervisor ?? "", flow)}
                      </p>

                      {active ? (
                        <>
                          {canAct ? (
                            <textarea
                              value={draft}
                              onChange={(event) => setDraft(event.target.value)}
                              rows={3}
                              placeholder="Optional note. Required if you reject."
                              className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
                            />
                          ) : (
                            <p className="mt-3 text-sm text-ink">
                              You cannot act on this step. Wait for the people listed above.
                            </p>
                          )}
                          {error ? <p className="mt-2 text-sm text-[#E24B4A]">{error}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!canAct || saving}
                              onClick={() => void decide("approved")}
                              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {saving ? "Saving…" : confirm}
                            </button>
                            <button
                              type="button"
                              disabled={!canAct || saving}
                              onClick={() => void decide("rejected")}
                              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-ink hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Reject
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <section className="mt-6 space-y-4 rounded-[24px] border border-line bg-paper-raised p-4 sm:p-7">
            {fields.map((field) => (
              <div key={field.id}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{field.label}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {request.payload[field.id]}
                </p>
              </div>
            ))}
          </section>

          {!pending ? (
            <section className="mt-5 rounded-[24px] border border-line bg-paper-raised p-4 sm:p-7">
              <h2 className="text-lg font-medium">Decision</h2>
              <p className="mt-2 text-sm text-muted">
                {status === "approved"
                  ? "This request was approved and handled."
                  : `This request was rejected at ${APPROVAL_STEP_LABELS[step]}.`}
                {comment ? ` ${comment}` : ""}
                {request.approval_decided_by ? ` · ${request.approval_decided_by}` : ""}
              </p>
            </section>
          ) : null}
        </PageFade>
      </div>
    </div>
  );
}

function stageComplete(
  id: "leader" | "hr" | "handle",
  step: ApprovalStep,
  status: ApprovalStatus,
) {
  const order = { leader: 0, hr: 1, handle: 2 };
  const current = step === "done" ? 3 : order[step];
  if (status === "rejected") return order[id] < current;
  return order[id] < current;
}
