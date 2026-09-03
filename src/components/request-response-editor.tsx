"use client";

import { departmentsForDivision } from "@/lib/recruitment-request";
import {
  validateAnswers,
  visibleFormFields,
  type RequestResponse,
  type RequestSchema,
  type RequestSchemaField,
} from "@/lib/request-schema";
import { useState, type ReactNode } from "react";
import { DatePicker, Select } from "./fields";
import { IconClose } from "./icons";
import { LarkPersonPicker } from "./lark-person-picker";
import { ScrollArea } from "./scroll-area";

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

export function RequestResponseEditor({
  row,
  schema,
  onClose,
  onSaved,
}: {
  row: RequestResponse;
  schema: RequestSchema;
  onClose: () => void;
  onSaved: (next: RequestResponse, warning?: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...row.payload }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const fields = visibleFormFields(schema);

  function set(id: string, value: string) {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      for (const field of schema.fields) {
        if (field.dependsOn === id) next[field.id] = "";
      }
      return next;
    });
    setErrors((current) => {
      const next = { ...current, [id]: "" };
      for (const field of schema.fields) {
        if (field.dependsOn === id) next[field.id] = "";
      }
      return next;
    });
  }

  function selectOptions(item: RequestSchemaField) {
    if (item.dependsOn) {
      return departmentsForDivision(answers[item.dependsOn] ?? "", item.optionsByParent);
    }
    return item.options ?? [];
  }

  async function save() {
    const nextErrors = validateAnswers(schema, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/recruitment-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: answers }),
      });
      const payload = (await response.json()) as {
        error?: string;
        warning?: string;
        row?: RequestResponse;
      };
      if (!response.ok) {
        if (/Database is not configured/i.test(payload.error ?? "")) {
          onSaved({ ...row, payload: answers }, "Saved locally. Lark Approval was not updated.");
          return;
        }
        throw new Error(payload.error || "Could not update the request.");
      }
      onSaved(payload.row ?? { ...row, payload: answers }, payload.warning);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not update the request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/35 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-paper-raised p-4 shadow-xl sm:max-h-[90vh] sm:rounded-[24px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl">Edit request</h2>
            <p className="text-sm text-muted">
              Saving updates this row and the Lark Approval instance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-paper"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea axis="y" compact className="min-h-0 flex-1">
          <div className="space-y-5 pr-1">
            {fields.map((item) => {
              const value = answers[item.id] ?? "";
              const error = errors[item.id];
              const invalid = Boolean(error);
              const border = invalid ? "border-[#E57373]" : "border-line focus:border-accent";
              let control: ReactNode = null;
              if (item.type === "select") {
                const options = selectOptions(item);
                const waitingOnParent = Boolean(item.dependsOn && !answers[item.dependsOn]);
                control = (
                  <Select
                    value={value}
                    onChange={(next) => set(item.id, next)}
                    placeholder={
                      waitingOnParent ? "Select division first" : item.placeholder || "Select"
                    }
                    invalid={invalid}
                    options={options.map((option) => ({ value: option, label: option }))}
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
            })}
          </div>
        </ScrollArea>
        {notice ? <p className="mt-4 text-sm text-[#E24B4A]">{notice}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-ink hover:bg-paper-raised"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
