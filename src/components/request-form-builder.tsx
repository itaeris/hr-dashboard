"use client";

import { useRecruitment } from "@/lib/recruitment-context";
import { companyFromSlug, REQUEST_COMPANY_LABELS } from "@/lib/recruitment-request";
import {
  defaultRequestSchema,
  loadRequestSchema,
  saveRequestSchema,
  type RequestFieldType,
  type RequestSchema,
  type RequestSchemaField,
} from "@/lib/request-schema";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useState } from "react";
import { Select } from "./fields";
import { IconClose, IconGrip, IconPlus } from "./icons";
import { PageFade, fieldClass } from "./ui";

const TYPES: { value: RequestFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "person", label: "Person" },
];

export function RequestFormBuilder() {
  const { slug } = useRecruitment();
  const company = companyFromSlug(slug);
  const companyLabel = REQUEST_COMPANY_LABELS[company];
  const [schema, setSchema] = useState<RequestSchema | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadRequestSchema(company).then(setSchema);
  }, [company]);

  function updateField(id: string, patch: Partial<RequestSchemaField>) {
    setSchema((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  }

  function addField() {
    const id = `custom_${crypto.randomUUID().slice(0, 8)}`;
    setSchema((current) =>
      current
        ? {
            ...current,
            fields: [
              ...current.fields,
              {
                id,
                label: "New field",
                type: "text",
                required: false,
                enabled: true,
                placeholder: "",
              },
            ],
          }
        : current,
    );
  }

  async function save() {
    if (!schema) return;
    setSaving(true);
    setNotice("");
    try {
      await saveRequestSchema(company, {
        ...schema,
        fields: schema.fields.map((item) =>
          item.type === "select"
            ? {
                ...item,
                options: (item.options ?? [])
                  .map((option) => option.trim())
                  .filter(Boolean),
                optionsByParent: item.optionsByParent
                  ? Object.fromEntries(
                      Object.entries(item.optionsByParent).map(([key, options]) => [
                        key,
                        options.map((option) => option.trim()).filter(Boolean),
                      ]),
                    )
                  : item.optionsByParent,
              }
            : item,
        ),
      });
      setNotice(`Form saved for ${companyLabel}. Public page will use this version.`);
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Saved locally. Could not sync to Supabase.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!schema) return <p className="text-sm text-muted">Loading form…</p>;

  return (
    <PageFade className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Customize the {companyLabel} request form. Drag the handle to reorder
        fields. Hidden fields stay off the public page.{" "}
        <a
          href={`/recruitment-request?company=${company}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Preview
        </a>
      </p>

      <div className="grid gap-3 rounded-[24px] border border-line bg-paper-raised p-5 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">Title</span>
          <input
            value={schema.title}
            onChange={(event) => setSchema({ ...schema, title: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">Section title</span>
          <input
            value={schema.sectionTitle}
            onChange={(event) =>
              setSchema({ ...schema, sectionTitle: event.target.value })
            }
            className={fieldClass}
          />
        </label>
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="text-muted">Description</span>
          <textarea
            value={schema.description}
            onChange={(event) =>
              setSchema({ ...schema, description: event.target.value })
            }
            rows={2}
            className={fieldClass}
          />
        </label>
      </div>

      <Reorder.Group
        axis="y"
        values={schema.fields.filter((item) => item.id !== "company").map((item) => item.id)}
        onReorder={(ids) => {
          const byId = new Map(schema.fields.map((item) => [item.id, item]));
          setSchema({
            ...schema,
            fields: [
              ...schema.fields.filter((item) => item.id === "company"),
              ...ids.map((id) => byId.get(id)).filter((item) => item != null),
            ],
          });
        }}
        className="space-y-3"
      >
        {schema.fields
          .filter((item) => item.id !== "company")
          .map((item) => (
            <SortableFieldCard
              key={item.id}
              item={item}
              parentOptions={
                item.dependsOn
                  ? (schema.fields.find((field) => field.id === item.dependsOn)?.options ?? [])
                  : []
              }
              onUpdate={(patch) => updateField(item.id, patch)}
              onRemove={
                item.id.startsWith("custom_")
                  ? () =>
                      setSchema({
                        ...schema,
                        fields: schema.fields.filter((field) => field.id !== item.id),
                      })
                  : undefined
              }
            />
          ))}
      </Reorder.Group>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={addField}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-paper sm:w-auto"
        >
          <IconPlus className="h-4 w-4" />
          Add field
        </button>
        <button
          type="button"
          onClick={() => setSchema(defaultRequestSchema())}
          className="w-full rounded-full border border-line px-4 py-2 text-sm hover:bg-paper sm:w-auto"
        >
          Reset default
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : "Save form"}
        </button>
      </div>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
    </PageFade>
  );
}

function SortableFieldCard({
  item,
  parentOptions,
  onUpdate,
  onRemove,
}: {
  item: RequestSchemaField;
  parentOptions: string[];
  onUpdate: (patch: Partial<RequestSchemaField>) => void;
  onRemove?: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.015,
        boxShadow: "0 16px 40px rgba(28, 20, 18, 0.12)",
        zIndex: 20,
        cursor: "grabbing",
      }}
      className={`rounded-[20px] border bg-paper-raised p-4 ${
        item.enabled ? "border-line" : "border-line/60 opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onPointerDown={(event) => controls.start(event)}
            className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink active:cursor-grabbing"
            aria-label={`Drag ${item.label || item.id}`}
          >
            <IconGrip className="h-4 w-4" />
          </button>
          <p className="truncate text-sm font-medium">{item.label || item.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(event) => onUpdate({ enabled: event.target.checked })}
              className="accent-[var(--accent)]"
            />
            Visible
          </label>
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={item.required}
              onChange={(event) => onUpdate({ required: event.target.checked })}
              className="accent-[var(--accent)]"
            />
            Required
          </label>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted hover:text-ink"
              aria-label="Remove field"
            >
              <IconClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          value={item.label}
          onChange={(event) => onUpdate({ label: event.target.value })}
          className={fieldClass}
          placeholder="Label"
        />
        <Select
          value={item.type}
          onChange={(value) =>
            onUpdate({
              type: value as RequestFieldType,
              options:
                value === "select" && (item.options ?? []).length === 0
                  ? [""]
                  : item.options,
            })
          }
          options={TYPES}
        />
        <input
          value={item.placeholder ?? ""}
          onChange={(event) => onUpdate({ placeholder: event.target.value })}
          className={`${fieldClass} sm:col-span-2`}
          placeholder="Placeholder"
        />
        {item.type === "select" && item.dependsOn ? (
          <DependentOptionsEditor
            parentLabel="Division"
            parentOptions={parentOptions}
            optionsByParent={item.optionsByParent ?? {}}
            onChange={(optionsByParent) => onUpdate({ optionsByParent })}
          />
        ) : item.type === "select" ? (
          <DropdownOptionsEditor
            options={item.options ?? []}
            onChange={(options) => onUpdate({ options })}
          />
        ) : null}
      </div>
    </Reorder.Item>
  );
}

function DependentOptionsEditor({
  parentLabel,
  parentOptions,
  optionsByParent,
  onChange,
}: {
  parentLabel: string;
  parentOptions: string[];
  optionsByParent: Record<string, string[]>;
  onChange: (optionsByParent: Record<string, string[]>) => void;
}) {
  const parents = parentOptions.length > 0 ? parentOptions : Object.keys(optionsByParent);
  const [activeParent, setActiveParent] = useState(parents[0] ?? "");
  const selectedParent = parents.includes(activeParent) ? activeParent : (parents[0] ?? "");
  const rows = optionsByParent[selectedParent] ?? [""];

  function setRows(next: string[]) {
    if (!selectedParent) return;
    onChange({ ...optionsByParent, [selectedParent]: next });
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <p className="text-xs text-muted">
        Department options follow the selected {parentLabel.toLowerCase()}.
      </p>
      {parents.length === 0 ? (
        <p className="text-sm text-muted">Add {parentLabel.toLowerCase()} options first.</p>
      ) : (
        <>
          <Select
            value={selectedParent}
            onChange={setActiveParent}
            placeholder={`Select ${parentLabel.toLowerCase()}`}
            options={parents.map((value) => ({ value, label: value }))}
          />
          <DropdownOptionsEditor options={rows} onChange={setRows} />
        </>
      )}
    </div>
  );
}

function DropdownOptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const rows = options.length > 0 ? options : [""];

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-xs text-muted">Dropdown options</p>
      <div className="space-y-2">
        {rows.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={option}
              onChange={(event) => {
                const next = [...rows];
                next[index] = event.target.value;
                onChange(next);
              }}
              className={fieldClass}
              placeholder={`Option ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
              aria-label={`Remove option ${index + 1}`}
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <IconPlus className="h-3.5 w-3.5" />
        Add option
      </button>
    </div>
  );
}
