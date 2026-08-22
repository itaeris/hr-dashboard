"use client";

import {
  COST_CENTERS,
  DEPARTMENTS,
  DIVISIONS,
  HEADCOUNT_TYPES,
  JOB_LEVELS,
  PRIORITY_LEVELS,
  REQUEST_COMPANIES,
  WORKFORCE_TYPES,
  WORK_LOCATIONS,
  emptyRequestForm,
  options,
  validateRequest,
  type RecruitmentRequest,
  type RequestField,
  type RequestFormValues,
} from "@/lib/recruitment-request";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRecruitment } from "@/lib/recruitment-context";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DatePicker, Select } from "./fields";
import { IconPlus, IconClose } from "./icons";
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

function PersonPicker({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [editing, setEditing] = useState(!value);

  if (value && !editing) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border bg-paper-raised px-3 py-2 ${
          invalid ? "border-[#E57373]" : "border-line"
        }`}
      >
        <span className="text-sm">{value}</span>
        <button
          type="button"
          onClick={() => {
            onChange("");
            setEditing(true);
          }}
          className="rounded-full p-1 text-muted hover:text-ink"
          aria-label="Remove person"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Full name"
        className={`${inputClass} ${invalid ? "border-[#E57373]" : "border-line focus:border-accent"}`}
      />
      <button
        type="button"
        onClick={() => {
          if (value.trim()) setEditing(false);
        }}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
        aria-label="Add person"
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RequestFormPage() {
  const { slug } = useRecruitment();
  const [values, setValues] = useState<RequestFormValues>(() => emptyRequestForm(slug));
  const [errors, setErrors] = useState<Partial<Record<RequestField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(true);

  useEffect(() => {
    setValues(emptyRequestForm(slug));
    setErrors({});
  }, [slug]);

  const departments = DEPARTMENTS[values.division] ?? [];
  const canSeeApproval = Boolean(
    values.company && values.division && values.priority_level && values.direct_supervisor,
  );

  const approvalSteps = useMemo(() => {
    const divisionLabel =
      DIVISIONS.find((item) => item.value === values.division)?.label ?? "Division Head";
    const steps = [
      values.direct_supervisor || "Direct Supervisor (N+1)",
      "HR Business Partner",
      divisionLabel,
    ];
    if (values.priority_level === "P0") steps.push("Management");
    return steps;
  }, [values.direct_supervisor, values.division, values.priority_level]);

  function set<K extends RequestField>(field: K, value: RequestFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function reset() {
    setValues(emptyRequestForm(slug));
    setErrors({});
  }

  async function onSubmit() {
    const nextErrors = validateRequest(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setNotice("");
    const row: RecruitmentRequest = {
      id: crypto.randomUUID(),
      ...values,
      headcount_number: Number(values.headcount_number),
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { error } = await supabase.from("recruitment_requests").insert({
          id: row.id,
          company: row.company,
          job_position: row.job_position,
          min_job_level: row.min_job_level,
          max_job_level: row.max_job_level,
          workforce_type: row.workforce_type,
          division: row.division,
          department: row.department,
          work_location: row.work_location,
          headcount_number: row.headcount_number,
          headcount_type: row.headcount_type,
          employee_replaced: row.employee_replaced,
          cost_center: row.cost_center,
          min_salary: row.min_salary,
          max_salary: row.max_salary,
          priority_level: row.priority_level,
          expected_join_date: row.expected_join_date || null,
          direct_supervisor: row.direct_supervisor,
          indirect_supervisor: row.indirect_supervisor,
          job_description: row.job_description,
          additional_notes: row.additional_notes,
          assessment: row.assessment,
          interviewers: row.interviewers,
        });
        if (error) throw error;
      } else {
        const key = "hr-recruitment-requests";
        const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecruitmentRequest[];
        window.localStorage.setItem(key, JSON.stringify([row, ...current]));
      }
      setNotice("Recruitment request submitted.");
      reset();
    } catch (cause) {
      const key = "hr-recruitment-requests";
      const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecruitmentRequest[];
      window.localStorage.setItem(key, JSON.stringify([row, ...current]));
      setNotice(
        cause && typeof cause === "object" && "message" in cause
          ? `Saved locally. ${String((cause as { message: string }).message)}`
          : "Saved locally.",
      );
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFade className="mx-auto w-full max-w-3xl pb-10">
      <h1 className="font-display text-3xl">Recruitment Request Form</h1>
      <p className="mt-2 text-sm text-muted">
        This form is required to request new or replacement hires, to be used for tracking.
      </p>

      <section className="mt-6 rounded-[24px] border border-line bg-paper-raised p-6 sm:p-8">
        <h2 className="text-lg font-medium">Application Details</h2>
        <div className="mt-6 space-y-5">
          <FormField label="Company" required error={errors.company}>
            <Select
              value={values.company}
              onChange={(value) => set("company", value)}
              placeholder="Select"
              invalid={Boolean(errors.company)}
              options={options(REQUEST_COMPANIES)}
            />
          </FormField>
          <FormField label="Job Position" required error={errors.job_position}>
            <input
              value={values.job_position}
              onChange={(event) => set("job_position", event.target.value)}
              placeholder="Enter the Position Title"
              className={`${inputClass} ${
                errors.job_position ? "border-[#E57373]" : "border-line focus:border-accent"
              }`}
            />
          </FormField>
          <FormField label="Min. Job Level" required error={errors.min_job_level}>
            <Select
              value={values.min_job_level}
              onChange={(value) => set("min_job_level", value)}
              placeholder="Select"
              invalid={Boolean(errors.min_job_level)}
              options={options(JOB_LEVELS)}
            />
          </FormField>
          <FormField label="Max Job Level" required error={errors.max_job_level}>
            <Select
              value={values.max_job_level}
              onChange={(value) => set("max_job_level", value)}
              placeholder="Select"
              invalid={Boolean(errors.max_job_level)}
              options={options(JOB_LEVELS)}
            />
          </FormField>
          <FormField label="Workforce type" required error={errors.workforce_type}>
            <Select
              value={values.workforce_type}
              onChange={(value) => set("workforce_type", value)}
              placeholder="Please choose as needed."
              invalid={Boolean(errors.workforce_type)}
              options={options(WORKFORCE_TYPES)}
            />
          </FormField>
          <FormField label="Division" required error={errors.division}>
            <Select
              value={values.division}
              onChange={(value) => {
                set("division", value);
                set("department", "");
              }}
              placeholder="Select"
              invalid={Boolean(errors.division)}
              options={DIVISIONS.map((item) => ({ value: item.value, label: item.label }))}
            />
          </FormField>
          <FormField label="Department" required error={errors.department}>
            <Select
              value={values.department}
              onChange={(value) => set("department", value)}
              placeholder="Select"
              invalid={Boolean(errors.department)}
              options={departments.map((item) => ({ value: item, label: item }))}
            />
          </FormField>
          <FormField label="Work Location" required error={errors.work_location}>
            <Select
              value={values.work_location}
              onChange={(value) => set("work_location", value)}
              placeholder="Select"
              invalid={Boolean(errors.work_location)}
              options={options(WORK_LOCATIONS)}
            />
          </FormField>
          <FormField label="Headcount Number" required error={errors.headcount_number}>
            <input
              type="number"
              min={1}
              value={values.headcount_number}
              onChange={(event) => set("headcount_number", event.target.value)}
              placeholder="Not less than 1"
              className={`${inputClass} ${
                errors.headcount_number ? "border-[#E57373]" : "border-line focus:border-accent"
              }`}
            />
          </FormField>
          <FormField label="Headcount Type" required error={errors.headcount_type}>
            <Select
              value={values.headcount_type}
              onChange={(value) => set("headcount_type", value)}
              placeholder="Please choose as needed."
              invalid={Boolean(errors.headcount_type)}
              options={options(HEADCOUNT_TYPES)}
            />
          </FormField>
          <FormField
            label="Employee to be Replaced (for Replacement Headcount)"
            error={errors.employee_replaced}
          >
            <input
              value={values.employee_replaced}
              onChange={(event) => set("employee_replaced", event.target.value)}
              placeholder="Please specify the full name of the employee to be replaced."
              className={`${inputClass} ${
                errors.employee_replaced ? "border-[#E57373]" : "border-line focus:border-accent"
              }`}
            />
          </FormField>
          <FormField label="Cost Center" required error={errors.cost_center}>
            <Select
              value={values.cost_center}
              onChange={(value) => set("cost_center", value)}
              placeholder="Select"
              invalid={Boolean(errors.cost_center)}
              options={options(COST_CENTERS)}
            />
          </FormField>
          <FormField label="Min Monthly Salary (Nett THP)">
            <input
              value={values.min_salary}
              onChange={(event) => set("min_salary", event.target.value)}
              placeholder="Please fill in as needed."
              className={`${inputClass} border-line focus:border-accent`}
            />
          </FormField>
          <FormField label="Max Monthly Salary (Nett THP)">
            <input
              value={values.max_salary}
              onChange={(event) => set("max_salary", event.target.value)}
              placeholder="Please fill in as needed."
              className={`${inputClass} border-line focus:border-accent`}
            />
          </FormField>
          <FormField label="Priority Level" required error={errors.priority_level}>
            <Select
              value={values.priority_level}
              onChange={(value) => set("priority_level", value)}
              placeholder="Please choose as needed."
              invalid={Boolean(errors.priority_level)}
              options={PRIORITY_LEVELS.map((item) => ({ value: item.value, label: item.label }))}
            />
          </FormField>
          <FormField label="Expected Join Date" required error={errors.expected_join_date}>
            <DatePicker
              value={values.expected_join_date}
              onChange={(value) => set("expected_join_date", value)}
              placeholder="Please choose as needed."
              invalid={Boolean(errors.expected_join_date)}
            />
          </FormField>
          <FormField
            label="Direct Supervisor (N+1)"
            required
            error={errors.direct_supervisor}
            hint="Please fill in as needed."
          >
            <PersonPicker
              value={values.direct_supervisor}
              onChange={(value) => set("direct_supervisor", value)}
              invalid={Boolean(errors.direct_supervisor)}
            />
          </FormField>
          <FormField
            label="Indirect Supervisor (Matrix N+1)"
            hint="Please fill in as needed."
          >
            <PersonPicker
              value={values.indirect_supervisor}
              onChange={(value) => set("indirect_supervisor", value)}
            />
          </FormField>
          <FormField label="Job Description" required error={errors.job_description}>
            <textarea
              value={values.job_description}
              onChange={(event) => set("job_description", event.target.value)}
              rows={6}
              placeholder="You may put a link to the JD document (if any) or describe the job scope here (including: Summary of the Role, Mission of the Role, Stakeholder Mapping, Job Description, KPI Metrics, Weight of the Job, Required Qualifications and Tools Mastery)"
              className={`${inputClass} resize-y ${
                errors.job_description ? "border-[#E57373]" : "border-line focus:border-accent"
              }`}
            />
          </FormField>
          <FormField label="Additional Notes">
            <textarea
              value={values.additional_notes}
              onChange={(event) => set("additional_notes", event.target.value)}
              rows={3}
              placeholder="Enter"
              className={`${inputClass} resize-y border-line focus:border-accent`}
            />
          </FormField>
          <FormField label="Specific Assessment Required">
            <textarea
              value={values.assessment}
              onChange={(event) => set("assessment", event.target.value)}
              rows={4}
              placeholder="Please specify if there is any assessment method to be done for this role (e.g: Case Study, Excel Test, Video, etc). If you have the reference of the assessment material, you may put the link here. If you need HR support on the material, please discuss further."
              className={`${inputClass} resize-y border-line focus:border-accent`}
            />
          </FormField>
          <FormField label="Interviewers" required error={errors.interviewers}>
            <textarea
              value={values.interviewers}
              onChange={(event) => set("interviewers", event.target.value)}
              rows={3}
              placeholder="Please specify who are required to interview the candidates"
              className={`${inputClass} resize-y ${
                errors.interviewers ? "border-[#E57373]" : "border-line focus:border-accent"
              }`}
            />
          </FormField>
        </div>

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
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2 text-sm"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-deep">
                      {index + 1}
                    </span>
                    {step}
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
            onClick={reset}
            className="rounded-full border border-line bg-paper-raised px-5 py-2.5 text-sm text-ink hover:bg-paper"
          >
            Cancel
          </button>
        </div>
      </section>
    </PageFade>
  );
}
