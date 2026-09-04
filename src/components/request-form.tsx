"use client";

import { COMPANIES, themeStyle } from "@/lib/companies";
import {
  REQUEST_COMPANIES,
  REQUEST_COMPANY_LABELS,
  departmentsForDivision,
  isRequestCompany,
  slugFromRequestCompany,
  type RequestCompany,
} from "@/lib/recruitment-request";
import {
  emptyAnswers,
  loadRequestSchema,
  persistLocalResponse,
  validateAnswers,
  visibleFormFields,
  type RequestSchema,
  type RequestSchemaField,
} from "@/lib/request-schema";
import {
  DEFAULT_APPROVAL_FLOW,
  approvalProcessPreview,
  serializeApprovalFlow,
  type ApprovalFlowConfig,
} from "@/lib/recruitment-approval-flow";
import { loadApprovalFlow } from "@/lib/recruitment-approval-settings";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DatePicker, Select } from "./fields";
import { LarkPersonPicker } from "./lark-person-picker";
import { TurnstileWidget, turnstileEnabled } from "./turnstile-widget";
import { PageFade } from "./ui";

const inputClass =
  "w-full rounded-xl border bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/80";

function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-ink">
        {label}
        {required ? <span className="ml-0.5 text-[#E24B4A]">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-[#E24B4A]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function RequestFormPage({
  initialCompany,
}: {
  initialCompany?: RequestCompany;
}) {
  const [company, setCompany] = useState<RequestCompany | "">(initialCompany ?? "");
  const [schema, setSchema] = useState<RequestSchema | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlowConfig>(DEFAULT_APPROVAL_FLOW);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [schemaLoading, setSchemaLoading] = useState(Boolean(initialCompany));
  const [schemaCompany, setSchemaCompany] = useState<RequestCompany | "">(
    initialCompany ?? "",
  );
  if (schemaCompany !== company) {
    setSchemaCompany(company);
    setSchema(null);
    setAnswers({});
    setErrors({});
    setSchemaLoading(Boolean(company));
  }

  useEffect(() => {
    if (!company) return;

    let cancelled = false;
    void loadRequestSchema(company).then((next) => {
      if (cancelled) return;
      setSchema(next);
      setAnswers({ ...emptyAnswers(next), company });
      setErrors({});
      setSchemaLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [company]);

  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    void loadApprovalFlow(slugFromRequestCompany(company)).then((next) => {
      if (!cancelled) setApprovalFlow(next);
    });
    return () => {
      cancelled = true;
    };
  }, [company]);

  const fields = schema ? visibleFormFields(schema) : [];
  const brand = COMPANIES[slugFromRequestCompany(company || "AERIS")];
  const canSeeApproval = Boolean(
    company &&
      answers.division &&
      answers.priority_level &&
      answers.direct_supervisor,
  );
  const approvalSteps = useMemo(
    () => approvalProcessPreview(answers.direct_supervisor ?? "", approvalFlow),
    [answers.direct_supervisor, approvalFlow],
  );

  function set(id: string, value: string) {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      for (const field of schema?.fields ?? []) {
        if (field.dependsOn === id) next[field.id] = "";
      }
      return next;
    });
    setErrors((current) => {
      const next = { ...current, [id]: "" };
      for (const field of schema?.fields ?? []) {
        if (field.dependsOn === id) next[field.id] = "";
      }
      return next;
    });
  }

  function selectOptions(item: RequestSchemaField) {
    if (item.dependsOn) {
      return departmentsForDivision(
        answers[item.dependsOn] ?? "",
        item.optionsByParent,
      );
    }
    return item.options ?? [];
  }

  function reset() {
    if (!schema || !company) {
      setAnswers({});
      setErrors({});
      return;
    }
    setAnswers({ ...emptyAnswers(schema), company });
    setErrors({});
  }

  function onCompanyChange(next: string) {
    setNotice("");
    setErrors({});
    setCompany(isRequestCompany(next) ? next : "");
    if (!isRequestCompany(next)) setApprovalFlow(DEFAULT_APPROVAL_FLOW);
  }

  async function onSubmit() {
    if (!schema || !company) return;
    const payload: Record<string, string> = {
      ...answers,
      company,
      approval_step: "leader",
      approval_flow: serializeApprovalFlow(approvalFlow),
    };
    const nextErrors = validateAnswers(schema, payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (turnstileEnabled() && !turnstileToken.trim()) {
      setNotice("Complete the verification below, then submit.");
      return;
    }

    setSaving(true);
    setNotice("");
    const row = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      payload,
      approval_status: "pending",
    };

    try {
      const created = await fetch("/api/recruitment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          payload,
          turnstileToken,
        }),
      });
      const createdPayload = (await created.json()) as { error?: string };
      if (created.status === 400) {
        throw new Error(createdPayload.error || "Could not verify you are human.");
      }
      if (!created.ok) {
        if (/Database is not configured/i.test(createdPayload.error ?? "")) {
          persistLocalResponse(row);
        } else {
          throw new Error(createdPayload.error || "Could not save the request.");
        }
      }

      let message = "Recruitment request submitted.";
      try {
        const lark = await fetch("/api/lark/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id }),
        });
        const larkPayload = (await lark.json()) as { error?: string };
        if (lark.ok) {
          message = `Submitted. ${payload.direct_supervisor || "The business leader"} will get a Lark Approval to-do.`;
        } else if (larkPayload.error) {
          message = `Submitted. Lark notification failed: ${larkPayload.error}`;
        }
      } catch {
        message = "Submitted. Could not reach Lark Approval.";
      }
      setNotice(message);
      reset();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not save the request.";
      if (/human|verify/i.test(message)) {
        setNotice(message);
        return;
      }
      persistLocalResponse(row);
      setNotice(`Saved locally. ${message}`);
      reset();
    } finally {
      setTurnstileToken("");
      setTurnstileReset((current) => current + 1);
      setSaving(false);
    }
  }

  return (
    <div style={themeStyle(brand.theme)} className="min-h-full bg-paper text-ink">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          HR Recruitment
        </p>
        <PageFade className="mx-auto w-full max-w-3xl pb-10">
          <h1 className="font-display text-2xl sm:text-3xl">
            {schema?.title ?? "Recruitment Request Form"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {schema?.description ??
              "This form is required to request new or replacement hires, to be used for tracking."}
          </p>

          <section className="mt-6 rounded-[24px] border border-line bg-paper-raised p-4 sm:p-8">
            <h2 className="text-lg font-medium">
              {schema?.sectionTitle ?? "Application Details"}
            </h2>
            <div className="mt-6 space-y-5">
              <FormField
                label="Company"
                required
                error={errors.company}
              >
                <Select
                  value={company}
                  onChange={onCompanyChange}
                  placeholder="Select company"
                  invalid={Boolean(errors.company)}
                  options={REQUEST_COMPANIES.map((value) => ({
                    value,
                    label: REQUEST_COMPANY_LABELS[value],
                  }))}
                />
              </FormField>

              {!company ? (
                <p className="text-sm text-muted">
                  Choose a company to load that company request form.
                </p>
              ) : schemaLoading ? (
                <p className="text-sm text-muted">Loading form…</p>
              ) : (
                fields.map((item) => {
                  const value = answers[item.id] ?? "";
                  const error = errors[item.id];
                  const invalid = Boolean(error);
                  const border = invalid
                    ? "border-[#E57373]"
                    : "border-line focus:border-accent";

                  let control: ReactNode = null;
                  if (item.type === "select") {
                    const options = selectOptions(item);
                    const waitingOnParent = Boolean(item.dependsOn && !answers[item.dependsOn]);
                    control = (
                      <Select
                        value={value}
                        onChange={(next) => set(item.id, next)}
                        placeholder={
                          waitingOnParent
                            ? "Select division first"
                            : item.placeholder || "Select"
                        }
                        invalid={invalid}
                        options={options.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                      />
                    );
                  } else if (item.type === "date") {
                    control = (
                      <DatePicker
                        value={value}
                        onChange={(next) => set(item.id, next)}
                        placeholder={item.placeholder || "Select date"}
                        invalid={invalid}
                      />
                    );
                  } else if (item.type === "person") {
                    control = (
                      <LarkPersonPicker
                        value={value}
                        onChange={(next) => set(item.id, next)}
                        onSelectUser={(user) => set(`${item.id}_id`, user?.id ?? "")}
                        invalid={invalid}
                        placeholder={item.placeholder || "Search Lark users"}
                      />
                    );
                  } else if (item.type === "textarea") {
                    control = (
                      <textarea
                        value={value}
                        onChange={(event) => set(item.id, event.target.value)}
                        rows={4}
                        placeholder={item.placeholder}
                        className={`${inputClass} resize-y ${border}`}
                      />
                    );
                  } else {
                    control = (
                      <input
                        type={item.type === "number" ? "number" : "text"}
                        min={item.type === "number" ? 1 : undefined}
                        value={value}
                        onChange={(event) => set(item.id, event.target.value)}
                        placeholder={item.placeholder}
                        className={`${inputClass} ${border}`}
                      />
                    );
                  }

                  return (
                    <FormField
                      key={item.id}
                      label={item.label}
                      required={item.required}
                      error={error}
                      hint={item.hint}
                    >
                      {control}
                    </FormField>
                  );
                })
              )}
            </div>

            {company && !schemaLoading ? (
              <>
                <button
                  type="button"
                  onClick={() => setApprovalOpen((current) => !current)}
                  className="mt-8 flex w-full items-center justify-between border-t border-line pt-5 text-left"
                >
                  <span className="text-sm font-medium">Approval Process</span>
                  <span className="text-xs text-muted">{approvalOpen ? "▲" : "▼"}</span>
                </button>
                {approvalOpen ? (
                  <div className="mt-3">
                    {canSeeApproval ? (
                      <ol className="space-y-2">
                        {approvalSteps.map((step, index) => (
                          <li
                            key={step.id}
                            className="flex items-start gap-3 rounded-xl border border-line bg-paper px-3 py-2 text-sm"
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-deep">
                              {index + 1}
                            </span>
                            <span>
                              <span className="block font-medium">{step.title}</span>
                              <span className="mt-0.5 block text-xs text-muted">{step.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted">
                        Please fill in required information to view the full approval process.
                      </p>
                    )}
                  </div>
                ) : null}

                {notice ? <p className="mt-6 text-sm text-accent">{notice}</p> : null}

                {turnstileEnabled() ? (
                  <div className="mt-6">
                    <TurnstileWidget
                      resetSignal={turnstileReset}
                      onToken={setTurnstileToken}
                    />
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void onSubmit()}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {saving ? "Submitting…" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="rounded-full border border-line bg-paper-raised px-5 py-2.5 text-sm text-ink hover:bg-paper"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </PageFade>
      </div>
    </div>
  );
}
