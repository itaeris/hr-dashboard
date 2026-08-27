"use client";

import { isoToYmd } from "@/lib/format";
import type { AddCandidateInput } from "@/lib/recruitment-context";
import { alignedLatestStatus, blankDate } from "@/lib/tracker";
import {
  LATEST_STATUSES,
  OFFER_RESULTS,
  SOURCES,
  type LatestStatus,
  type OfferResult,
} from "@/lib/types";
import type { ApplicationView, JobRow } from "@/lib/types";
import { FormEvent, useState } from "react";
import { CvCell } from "./cv-preview";
import { CvField } from "./cv-field";
import { DatePicker, Select } from "./fields";
import { Field, fieldClass } from "./ui";

export function readCandidateForm(
  form: FormData,
  cvFile: File | null,
): AddCandidateInput {
  return {
    full_name: String(form.get("full_name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    source: String(form.get("source") ?? "Website"),
    job_id: String(form.get("job_id") ?? ""),
    cv_file: cvFile,
    total_experience: String(form.get("total_experience") ?? ""),
    last_company: String(form.get("last_company") ?? ""),
    last_role: String(form.get("last_role") ?? ""),
    last_salary: String(form.get("last_salary") ?? ""),
    expected_salary: String(form.get("expected_salary") ?? ""),
    latest_status: String(form.get("latest_status") ?? "Approaching") as LatestStatus,
    approaching_date: blankDate(form.get("approaching_date")),
    response_date: blankDate(form.get("response_date")),
    hr_interview_date: blankDate(form.get("hr_interview_date")),
    hr_interview_record_url: String(form.get("hr_interview_record_url") ?? "").trim(),
    hr_interview_note: String(form.get("hr_interview_note") ?? ""),
    shared_with_user: form.get("shared_with_user") === "on",
    user_interview_date: blankDate(form.get("user_interview_date")),
    user_interview_record_url: String(form.get("user_interview_record_url") ?? "").trim(),
    user_remarks: String(form.get("user_remarks") ?? ""),
    third_interview_date: blankDate(form.get("third_interview_date")),
    third_interview_record_url: String(form.get("third_interview_record_url") ?? "").trim(),
    offer_date: blankDate(form.get("offer_date")),
    offer_result: String(form.get("offer_result") ?? "") as OfferResult,
    join_date: blankDate(form.get("join_date")),
    rejection_letter: form.get("rejection_letter") === "on",
    notes: String(form.get("notes") ?? ""),
  };
}

export function CandidateForm({
  item,
  jobs,
  submitLabel,
  saving,
  onSubmit,
}: {
  item?: ApplicationView;
  jobs: JobRow[];
  submitLabel: string;
  saving: boolean;
  onSubmit: (input: AddCandidateInput) => Promise<void>;
}) {
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(readCandidateForm(new FormData(event.currentTarget), cvFile));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Identity</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Candidate Name">
          <input
            required
            name="full_name"
            defaultValue={item?.candidate.full_name}
            className={fieldClass}
          />
        </Field>
        <Field label="Position Applied">
          <Select
            name="job_id"
            required
            placeholder="Select a role"
            defaultValue={item?.job_id ?? jobs[0]?.id ?? ""}
            options={jobs.map((job) => ({ value: job.id, label: job.title }))}
          />
        </Field>
        <Field label="Source">
          <Select
            name="source"
            defaultValue={item?.candidate.source ?? "LinkedIn"}
            options={SOURCES.map((source) => ({ value: source, label: source }))}
          />
        </Field>
        <Field label="CV">
          <div className="space-y-2">
            {item?.cv_url && !cvFile ? <CvCell url={item.cv_url} /> : null}
            <CvField file={cvFile} onChange={setCvFile} />
          </div>
        </Field>
        <Field label="Email">
          <input
            type="email"
            name="email"
            defaultValue={item?.candidate.email}
            className={fieldClass}
          />
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            defaultValue={item?.candidate.phone ?? ""}
            className={fieldClass}
          />
        </Field>
      </div>

      <p className="text-xs uppercase tracking-[0.16em] text-muted">Experience</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Total Experience">
          <input
            name="total_experience"
            defaultValue={item?.total_experience}
            className={fieldClass}
          />
        </Field>
        <Field label="Last Company">
          <input
            name="last_company"
            defaultValue={item?.last_company}
            className={fieldClass}
          />
        </Field>
        <Field label="Last Role">
          <input name="last_role" defaultValue={item?.last_role} className={fieldClass} />
        </Field>
        <Field label="Last Salary">
          <input
            name="last_salary"
            defaultValue={item?.last_salary}
            className={fieldClass}
          />
        </Field>
        <Field label="Expected Salary">
          <input
            name="expected_salary"
            defaultValue={item?.expected_salary}
            className={fieldClass}
          />
        </Field>
        <Field label="Latest Status">
          <Select
            name="latest_status"
            defaultValue={
              item ? alignedLatestStatus(item) : "Approaching"
            }
            options={LATEST_STATUSES.map((status) => ({ value: status, label: status }))}
          />
        </Field>
      </div>

      <p className="text-xs uppercase tracking-[0.16em] text-muted">Interview & offer</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Approaching Date">
          <DatePicker name="approaching_date" defaultValue={isoToYmd(item?.approaching_date ?? null)} />
        </Field>
        <Field label="Response Date">
          <DatePicker name="response_date" defaultValue={isoToYmd(item?.response_date ?? null)} />
        </Field>
        <Field label="HR Interview Date">
          <DatePicker
            name="hr_interview_date"
            defaultValue={isoToYmd(item?.hr_interview_date ?? null)}
          />
        </Field>
        <Field label="HR Interview Record (Drive)">
          <input
            name="hr_interview_record_url"
            type="text"
            inputMode="url"
            placeholder="https://drive.google.com/..."
            defaultValue={item?.hr_interview_record_url ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="User Interview Date">
          <DatePicker
            name="user_interview_date"
            defaultValue={isoToYmd(item?.user_interview_date ?? null)}
          />
        </Field>
        <Field label="User Interview Record (Drive)">
          <input
            name="user_interview_record_url"
            type="text"
            inputMode="url"
            placeholder="https://drive.google.com/..."
            defaultValue={item?.user_interview_record_url ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="3rd Interview (C-Level)">
          <DatePicker
            name="third_interview_date"
            defaultValue={isoToYmd(item?.third_interview_date ?? null)}
          />
        </Field>
        <Field label="C-Level Record (Drive)">
          <input
            name="third_interview_record_url"
            type="text"
            inputMode="url"
            placeholder="https://drive.google.com/..."
            defaultValue={item?.third_interview_record_url ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="Offer Date">
          <DatePicker name="offer_date" defaultValue={isoToYmd(item?.offer_date ?? null)} />
        </Field>
        <Field label="Offer Result">
          <Select
            name="offer_result"
            placeholder="—"
            defaultValue={item?.offer_result ?? ""}
            options={[
              { value: "", label: "—" },
              ...OFFER_RESULTS.map((result) => ({ value: result, label: result })),
            ]}
          />
        </Field>
        <Field label="Join Date">
          <DatePicker name="join_date" defaultValue={isoToYmd(item?.join_date ?? null)} />
        </Field>
      </div>
      <Field label="HR Interview Note">
        <textarea
          name="hr_interview_note"
          rows={2}
          defaultValue={item?.hr_interview_note}
          className={fieldClass}
        />
      </Field>
      <Field label="User Remarks">
        <textarea
          name="user_remarks"
          rows={2}
          defaultValue={item?.user_remarks}
          className={fieldClass}
        />
      </Field>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="shared_with_user"
            defaultChecked={item?.shared_with_user}
            className="accent-[var(--accent)]"
          />
          Shared with User
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="rejection_letter"
            defaultChecked={item?.rejection_letter}
            className="accent-[var(--accent)]"
          />
          Rejection Letter
        </label>
      </div>
      <Field label="Note">
        <textarea
          name="notes"
          rows={2}
          defaultValue={item?.candidate.notes ?? ""}
          className={fieldClass}
        />
      </Field>
      <button
        type="submit"
        disabled={saving || jobs.length === 0}
        className="mt-2 w-full rounded-full bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
