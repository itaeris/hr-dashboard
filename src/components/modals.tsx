"use client";

import { FormEvent, useState } from "react";
import { useRecruitment } from "@/lib/recruitment-context";
import { blankDate, isOpenVacancy } from "@/lib/tracker";
import {
  HIRE_TYPES,
  LEVELS,
  OFFER_STAGES,
  PRIORITIES,
  VACANCY_STATUSES,
  type HireType,
  type OfferStage,
  type Priority,
  type VacancyStatus,
} from "@/lib/types";
import { CandidateForm } from "./candidate-form";
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

  return (
    <ModalFrame open={open} onClose={onClose} title="Progress — new candidate" wide>
      <CandidateForm
        key={open ? "open" : "closed"}
        jobs={openJobs}
        submitLabel="Save to Progress"
        saving={saving}
        onSubmit={async (input) => {
          setSaving(true);
          try {
            await addCandidate(input);
            onClose();
          } finally {
            setSaving(false);
          }
        }}
      />
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
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
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
    } catch (cause) {
      const message =
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: string }).message)
          : "Could not save vacancy.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame open={open} onClose={onClose} title="Vacancy Tracker — new role" wide>
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
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-full bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {saving ? "Saving…" : "Save vacancy"}
        </button>
      </form>
    </ModalFrame>
  );
}
