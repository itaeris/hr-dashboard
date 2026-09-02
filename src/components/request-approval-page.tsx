"use client";

import { COMPANIES, themeStyle } from "@/lib/companies";
import { formatDate } from "@/lib/format";
import {
  APPROVAL_STEP_LABELS,
  HANDLE_MEMBERS,
  HR_APPROVERS,
  approvalProcessPreview,
  parseApprovalStep,
  type ApprovalStep,
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

function stepCopy(step: ApprovalStep) {
  if (step === "hr") {
    return {
      title: "HR Approval",
      body: `${HR_APPROVERS.join(" or ")} can approve. One agreement is enough.`,
      confirm: "Approve",
    };
  }
  if (step === "handle") {
    return {
      title: "Handle",
      body: `${HANDLE_MEMBERS.join(", ")}. One handler needs to complete this step.`,
      confirm: "Handled",
    };
  }
  return {
    title: "Business Leader Approval",
    body: "The requester’s selected business leader reviews this request. Approving CCs HR.",
    confirm: "Approve",
  };
}

export function RequestApprovalPage({
  request,
}: {
  request: StoredRecruitmentRequest;
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
  const preview = approvalProcessPreview(request.payload.direct_supervisor ?? "");
  const current = stepCopy(step);

  const fields = schema.fields.filter((field) => {
    if (field.id.endsWith("_id")) return false;
    if (field.id.startsWith("approval_")) return false;
    return Boolean(String(request.payload[field.id] ?? "").trim());
  });

  async function decide(next: "approved" | "rejected") {
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
              {status === "pending" ? current.title : STATUS_COPY[status].label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {REQUEST_COMPANY_LABELS[company]} · submitted {formatDate(request.created_at)}
          </p>

          <ol className="mt-5 space-y-2">
            {preview.map((item, index) => {
              const active = pending && item.id === step;
              const done = step === "done" || stageComplete(item.id, step, status);
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                    active
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-paper-raised"
                  }`}
                >
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
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{item.detail}</span>
                  </span>
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

          <section className="mt-5 rounded-[24px] border border-line bg-paper-raised p-4 sm:p-7">
            <h2 className="text-lg font-medium">
              {pending ? current.title : "Decision"}
            </h2>
            {pending ? (
              <>
                <p className="mt-1 text-sm text-muted">{current.body}</p>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Optional note. Required if you reject."
                  className="mt-4 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
                />
                {error ? <p className="mt-2 text-sm text-[#E24B4A]">{error}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void decide("approved")}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {saving ? "Saving…" : current.confirm}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void decide("rejected")}
                    className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-ink hover:bg-paper-raised disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {status === "approved"
                  ? "This request was approved and handled."
                  : `This request was rejected at ${APPROVAL_STEP_LABELS[step]}.`}
                {comment ? ` ${comment}` : ""}
                {request.approval_decided_by ? ` · ${request.approval_decided_by}` : ""}
              </p>
            )}
          </section>
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
