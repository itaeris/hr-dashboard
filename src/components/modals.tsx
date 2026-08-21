"use client";

import { FormEvent, useState } from "react";
import { useRecruitment } from "@/lib/recruitment-context";
import { blankDate, isOpenVacancy } from "@/lib/tracker";
import {
  HIRE_TYPES,
  LATEST_STATUSES,
  LEVELS,
  OFFER_RESULTS,
  OFFER_STAGES,
  PRIORITIES,
  SOURCES,
  VACANCY_STATUSES,
  type HireType,
  type LatestStatus,
  type OfferResult,
  type OfferStage,
  type Priority,
  type VacancyStatus,
} from "@/lib/types";
import { DatePicker, Select } from "./fields";
import { Field, ModalFrame, fieldClass } from "./ui";

export function AddCandidateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { jobs, addCandidate } = useRecruitment();
  const openJobs = jobs.filter((job) => isOpenVacancy(job.status_vacancy));
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const latest_status = String(form.get("latest_status") ?? "Approaching") as LatestStatus;
    setSaving(true);
    try {
      await addCandidate({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        source: String(form.get("source") ?? "Website"),
        job_id: String(form.get("job_id") ?? ""),
        cv_url: String(form.get("cv_url") ?? "") || null,
        total_experience: String(form.get("total_experience") ?? ""),
        last_company: String(form.get("last_company") ?? ""),
        last_role: String(form.get("last_role") ?? ""),
        last_salary: String(form.get("last_salary") ?? ""),
        expected_salary: String(form.get("expected_salary") ?? ""),
        latest_status,
        approaching_date: blankDate(form.get("approaching_date")),
        response_date: blankDate(form.get("response_date")),
        hr_interview_date: blankDate(form.get("hr_interview_date")),
        hr_interview_note: String(form.get("hr_interview_note") ?? ""),
        shared_with_user: form.get("shared_with_user") === "on",
        user_interview_date: blankDate(form.get("user_interview_date")),
        user_remarks: String(form.get("user_remarks") ?? ""),
        third_interview_date: blankDate(form.get("third_interview_date")),
        offer_date: blankDate(form.get("offer_date")),
        offer_result: String(form.get("offer_result") ?? "") as OfferResult,
        join_date: blankDate(form.get("join_date")),
        rejection_letter: form.get("rejection_letter") === "on",
        notes: String(form.get("notes") ?? ""),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame open={open} onClose={onClose} title="Progress — kandidat baru" wide>
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Identitas</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Candidate Name">
            <input required name="full_name" className={fieldClass} />
          </Field>
          <Field label="Position Applied">
            <Select
              name="job_id"
              required
              placeholder="Pilih posisi"
              defaultValue={openJobs[0]?.id ?? ""}
              options={openJobs.map((job) => ({ value: job.id, label: job.title }))}
            />
          </Field>
          <Field label="Source">
            <Select
              name="source"
              defaultValue="LinkedIn"
              options={SOURCES.map((source) => ({ value: source, label: source }))}
            />
          </Field>
          <Field label="CV">
            <input name="cv_url" placeholder="Link CV" className={fieldClass} />
          </Field>
          <Field label="Email">
            <input type="email" name="email" className={fieldClass} />
          </Field>
          <Field label="Telepon">
            <input name="phone" className={fieldClass} />
          </Field>
        </div>

        <p className="text-xs uppercase tracking-[0.16em] text-muted">Pengalaman</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Total Experience">
            <input name="total_experience" className={fieldClass} />
          </Field>
          <Field label="Last Company">
            <input name="last_company" className={fieldClass} />
          </Field>
          <Field label="Last Role">
            <input name="last_role" className={fieldClass} />
          </Field>
          <Field label="Last Salary">
            <input name="last_salary" className={fieldClass} />
          </Field>
          <Field label="Expected Salary">
            <input name="expected_salary" className={fieldClass} />
          </Field>
          <Field label="Latest Status">
            <Select
              name="latest_status"
              defaultValue="Approaching"
              options={LATEST_STATUSES.map((status) => ({ value: status, label: status }))}
            />
          </Field>
        </div>

        <p className="text-xs uppercase tracking-[0.16em] text-muted">Interview & offer</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Approaching Date">
            <DatePicker name="approaching_date" />
          </Field>
          <Field label="Response Date">
            <DatePicker name="response_date" />
          </Field>
          <Field label="HR Interview Date">
            <DatePicker name="hr_interview_date" />
          </Field>
          <Field label="User Interview Date">
            <DatePicker name="user_interview_date" />
          </Field>
          <Field label="3rd Interview (C-Level)">
            <DatePicker name="third_interview_date" />
          </Field>
          <Field label="Offer Date">
            <DatePicker name="offer_date" />
          </Field>
          <Field label="Offer Result">
            <Select
              name="offer_result"
              placeholder="—"
              options={[
                { value: "", label: "—" },
                ...OFFER_RESULTS.map((result) => ({ value: result, label: result })),
              ]}
            />
          </Field>
          <Field label="Join Date">
            <DatePicker name="join_date" />
          </Field>
        </div>
        <Field label="HR Interview Note">
          <textarea name="hr_interview_note" rows={2} className={fieldClass} />
        </Field>
        <Field label="User Remarks">
          <textarea name="user_remarks" rows={2} className={fieldClass} />
        </Field>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="shared_with_user" className="accent-[var(--accent)]" />
            Shared with User
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="rejection_letter" className="accent-[var(--accent)]" />
            Rejection Letter
          </label>
        </div>
        <Field label="Note">
          <textarea name="notes" rows={2} className={fieldClass} />
        </Field>
        <button
          type="submit"
          disabled={saving || openJobs.length === 0}
          className="mt-2 w-full rounded-full bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan ke Progress"}
        </button>
      </form>
    </ModalFrame>
  );
}

export function AddJobModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addJob } = useRecruitment();
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await addJob({
        hire_type: String(form.get("hire_type") ?? "New") as HireType,
        title: String(form.get("title") ?? ""),
        level: String(form.get("level") ?? "Staff"),
        department: String(form.get("department") ?? ""),
        hiring_manager: String(form.get("hiring_manager") ?? ""),
        recruiter_pic: String(form.get("recruiter_pic") ?? ""),
        headcount_needed: Number(form.get("headcount_needed") ?? 1),
        request_date: blankDate(form.get("request_date")) ?? new Date().toISOString(),
        sla_target: Number(form.get("sla_target") ?? 30),
        target_join: blankDate(form.get("target_join")),
        status_vacancy: String(form.get("status_vacancy") ?? "Open") as VacancyStatus,
        fulfilled_date: blankDate(form.get("fulfilled_date")),
        offer_stage: String(form.get("offer_stage") ?? "P1") as OfferStage,
        priority: String(form.get("priority") ?? "Medium") as Priority,
        notes: String(form.get("notes") ?? ""),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame open={open} onClose={onClose} title="Vacancy Tracker — posisi baru" wide>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Replacement / New">
            <Select
              name="hire_type"
              defaultValue="New"
              options={HIRE_TYPES.map((type) => ({ value: type, label: type }))}
            />
          </Field>
          <Field label="Position Name">
            <input required name="title" className={fieldClass} />
          </Field>
          <Field label="Level">
            <Select
              name="level"
              defaultValue="Staff"
              options={LEVELS.map((level) => ({ value: level, label: level }))}
            />
          </Field>
          <Field label="Department">
            <input required name="department" className={fieldClass} />
          </Field>
          <Field label="Hiring Manager">
            <input name="hiring_manager" className={fieldClass} />
          </Field>
          <Field label="Recruiter PIC">
            <input name="recruiter_pic" className={fieldClass} />
          </Field>
          <Field label="Headcount Needed">
            <input type="number" min={1} name="headcount_needed" defaultValue={1} className={fieldClass} />
          </Field>
          <Field label="Request Date">
            <DatePicker name="request_date" required />
          </Field>
          <Field label="SLA Target (days)">
            <input type="number" min={1} name="sla_target" defaultValue={30} className={fieldClass} />
          </Field>
          <Field label="Target Join">
            <DatePicker name="target_join" />
          </Field>
          <Field label="Status Vacancy">
            <Select
              name="status_vacancy"
              defaultValue="Open"
              options={VACANCY_STATUSES.map((status) => ({ value: status, label: status }))}
            />
          </Field>
          <Field label="Fulfilled Date">
            <DatePicker name="fulfilled_date" />
          </Field>
          <Field label="Offer Stage">
            <Select
              name="offer_stage"
              defaultValue="P1"
              options={OFFER_STAGES.map((stage) => ({ value: stage, label: stage }))}
            />
          </Field>
          <Field label="Priority">
            <Select
              name="priority"
              defaultValue="Medium"
              options={PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={3} className={fieldClass} />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-full bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {saving ? "Menyimpan…" : "Simpan vacancy"}
        </button>
      </form>
    </ModalFrame>
  );
}
