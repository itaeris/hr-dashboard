"use client";

import { FormEvent, useState } from "react";
import { formatTableDate, isoToYmd } from "@/lib/format";
import { useRecruitment, type AddJobInput } from "@/lib/recruitment-context";
import { blankDate, hireStatus, hiredCount, isOpenVacancy, slaAging, slaResult } from "@/lib/tracker";
import {
  HIRE_TYPES,
  OFFER_STAGES,
  PRIORITIES,
  VACANCY_STATUSES,
  type HireType,
  type JobRow,
  type OfferStage,
  type Priority,
  type VacancyStatus,
} from "@/lib/types";
import { useVacancyLevels } from "@/lib/use-vacancy-levels";
import { CandidateForm } from "./candidate-form";
import { DatePicker, Select } from "./fields";
import { Pill } from "./data-table";
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

function jobInputFromForm(form: FormData): AddJobInput {
  return {
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
  };
}

function JobForm({
  job,
  saving,
  error,
  submitLabel,
  onSubmit,
}: {
  job?: JobRow;
  saving: boolean;
  error: string;
  submitLabel: string;
  onSubmit: (input: AddJobInput) => Promise<void>;
}) {
  const { levels, addLevel } = useVacancyLevels();
  const selectedLevel = job?.level ?? (levels.includes("Staff") ? "Staff" : levels[0] ?? "");
  const levelOptions = levels.includes(selectedLevel)
    ? levels
    : selectedLevel
      ? [selectedLevel, ...levels]
      : levels;

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit(jobInputFromForm(new FormData(event.currentTarget)));
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Replacement / New">
          <Select
            name="hire_type"
            defaultValue={job?.hire_type ?? "New"}
            options={HIRE_TYPES.map((type) => ({ value: type, label: type }))}
          />
        </Field>
        <Field label="Position Name">
          <input required name="title" defaultValue={job?.title} className={fieldClass} />
        </Field>
        <Field label="Level">
          <Select
            name="level"
            defaultValue={selectedLevel}
            options={levelOptions.map((level) => ({ value: level, label: level }))}
            createPlaceholder="Add a new level…"
            onCreate={(value) => {
              void addLevel(value);
            }}
          />
        </Field>
        <Field label="Department">
          <input
            required
            name="department"
            defaultValue={job?.department}
            className={fieldClass}
          />
        </Field>
        <Field label="Hiring Manager">
          <input
            name="hiring_manager"
            defaultValue={job?.hiring_manager}
            className={fieldClass}
          />
        </Field>
        <Field label="Recruiter PIC">
          <input
            name="recruiter_pic"
            defaultValue={job?.recruiter_pic}
            className={fieldClass}
          />
        </Field>
        <Field label="Headcount Needed">
          <input
            type="number"
            min={1}
            name="headcount_needed"
            defaultValue={job?.headcount_needed ?? 1}
            className={fieldClass}
          />
        </Field>
        <Field label="Request Date">
          <DatePicker
            name="request_date"
            required
            defaultValue={isoToYmd(job?.request_date ?? null)}
          />
        </Field>
        <Field label="SLA Target (days)">
          <input
            type="number"
            min={1}
            name="sla_target"
            defaultValue={job?.sla_target ?? 30}
            className={fieldClass}
          />
        </Field>
        <Field label="Target Join">
          <DatePicker name="target_join" defaultValue={isoToYmd(job?.target_join ?? null)} />
        </Field>
        <Field label="Status Vacancy">
          <Select
            name="status_vacancy"
            defaultValue={job?.status_vacancy ?? "Open"}
            options={VACANCY_STATUSES.map((status) => ({ value: status, label: status }))}
          />
        </Field>
        <Field label="Fulfilled Date">
          <DatePicker
            name="fulfilled_date"
            defaultValue={isoToYmd(job?.fulfilled_date ?? null)}
          />
        </Field>
        <Field label="Offer Stage">
          <Select
            name="offer_stage"
            defaultValue={job?.offer_stage ?? "P1"}
            options={OFFER_STAGES.map((stage) => ({ value: stage, label: stage }))}
          />
        </Field>
        <Field label="Priority">
          <Select
            name="priority"
            defaultValue={job?.priority ?? "Medium"}
            options={PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="notes" rows={3} defaultValue={job?.notes} className={fieldClass} />
      </Field>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-full rounded-full bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
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

  return (
    <ModalFrame open={open} onClose={onClose} title="Vacancy Tracker - new role" wide>
      <JobForm
        key={open ? "new-open" : "new-closed"}
        saving={saving}
        error={error}
        submitLabel="Save vacancy"
        onSubmit={async (input) => {
          setSaving(true);
          setError("");
          try {
            await addJob(input);
            onClose();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not save vacancy.");
          } finally {
            setSaving(false);
          }
        }}
      />
    </ModalFrame>
  );
}

export function EditJobModal({
  job,
  onClose,
}: {
  job: JobRow | null;
  onClose: () => void;
}) {
  const { updateJob } = useRecruitment();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <ModalFrame
      open={Boolean(job)}
      onClose={onClose}
      title="Vacancy Tracker — edit role"
      wide
    >
      {job ? (
        <JobForm
          key={job.id}
          job={job}
          saving={saving}
          error={error}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            setSaving(true);
            setError("");
            try {
              await updateJob(job.id, input);
              onClose();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save vacancy.");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </ModalFrame>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 break-words text-sm">{value || "—"}</p>
    </div>
  );
}

export function JobPreviewModal({
  job,
  onClose,
}: {
  job: JobRow | null;
  onClose: () => void;
}) {
  const { views } = useRecruitment();
  if (!job) return null;

  const hired = hiredCount(job.id, views);
  const statusHire = hireStatus(hired, job.headcount_needed);
  const aging = slaAging(job);
  const result = slaResult(job);

  return (
    <ModalFrame open onClose={onClose} title={job.title} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <PreviewField label="Type" value={job.hire_type} />
        <PreviewField label="Level" value={job.level} />
        <PreviewField label="Department" value={job.department} />
        <PreviewField label="Hiring manager" value={job.hiring_manager} />
        <PreviewField label="Recruiter PIC" value={job.recruiter_pic} />
        <PreviewField label="Needed" value={String(job.headcount_needed)} />
        <PreviewField label="Hired" value={String(hired)} />
        <PreviewField label="Request date" value={formatTableDate(job.request_date) || ""} />
        <PreviewField label="SLA target" value={`${job.sla_target} days`} />
        <PreviewField label="Target join" value={formatTableDate(job.target_join) || ""} />
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Status vacancy</p>
          <div className="mt-1">
            <Pill tone={isOpenVacancy(job.status_vacancy) ? "soft" : "muted"}>
              {job.status_vacancy}
            </Pill>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Status hire</p>
          <div className="mt-1">
            <Pill tone={statusHire === "FULFILLED" ? "ok" : "muted"}>
              {statusHire === "FULFILLED" ? "Fulfilled" : "In progress"}
            </Pill>
          </div>
        </div>
        <PreviewField label="Fulfilled date" value={formatTableDate(job.fulfilled_date) || ""} />
        <PreviewField label="Offer stage" value={job.offer_stage} />
        <PreviewField label="Priority" value={job.priority} />
        <PreviewField label="SLA aging" value={String(aging)} />
        <PreviewField
          label="SLA result"
          value={result === "MEET SLA" ? "Meet SLA" : "Over SLA"}
        />
      </div>
      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Notes</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{job.notes || "—"}</p>
      </div>
    </ModalFrame>
  );
}
