"use client";

import { IconChevronDown, IconClose, IconGrip, IconPlus } from "@/components/icons";
import { Field, fieldClass } from "@/components/ui";
import { DEFAULT_VACANCY_LEVELS } from "@/lib/vacancy-levels";
import { useVacancyLevels } from "@/lib/use-vacancy-levels";
import { Reorder, useDragControls } from "framer-motion";
import { useState } from "react";

type LevelRow = { id: string; label: string };

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `lv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toRows(values: string[]): LevelRow[] {
  const labels = values.length > 0 ? values : [""];
  return labels.map((label) => ({ id: makeId(), label }));
}

export function VacancyLevelsSettings() {
  const { levels, save } = useVacancyLevels();
  const [rows, setRows] = useState<LevelRow[]>(() => toRows(levels));
  const [source, setSource] = useState(levels);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (levels !== source) {
    setSource(levels);
    setRows(toRows(levels));
  }

  const list = rows.length > 0 ? rows : toRows([""]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
    setRows(next);
  }

  return (
    <form
      className="space-y-4 rounded-[24px] border border-line bg-paper-raised p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");
        try {
          await save(list.map((row) => row.label));
          setSuccess("Vacancy levels saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save levels.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-medium">Vacancy levels</h2>
        <p className="mt-1 text-sm text-muted">
          These options appear in the Level dropdown when adding or editing a
          vacancy. Drag the handle - or use the arrows - to set the order.
        </p>
      </div>

      <Field label="Dropdown options">
        <Reorder.Group
          axis="y"
          values={list.map((row) => row.id)}
          onReorder={(ids) => {
            const byId = new Map(list.map((row) => [row.id, row]));
            setRows(ids.flatMap((id) => {
              const row = byId.get(id);
              return row ? [row] : [];
            }));
          }}
          className="space-y-2"
        >
          {list.map((row, index) => (
            <LevelOptionRow
              key={row.id}
              row={row}
              index={index}
              total={list.length}
              onChange={(label) =>
                setRows(list.map((item) => (item.id === row.id ? { ...item, label } : item)))
              }
              onMove={move}
              onRemove={() => setRows(list.filter((item) => item.id !== row.id))}
            />
          ))}
        </Reorder.Group>
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRows([...list, { id: makeId(), label: "" }])}
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add level
        </button>
        <button
          type="button"
          onClick={() => setRows(toRows(DEFAULT_VACANCY_LEVELS))}
          className="text-sm text-muted hover:text-ink"
        >
          Reset to default
        </button>
      </div>

      {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save levels"}
      </button>
    </form>
  );
}

function LevelOptionRow({
  row,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  row: LevelRow;
  index: number;
  total: number;
  onChange: (label: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={row.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 12px 28px rgba(28, 20, 18, 0.12)",
        zIndex: 20,
        cursor: "grabbing",
      }}
      className="flex items-center gap-1.5 rounded-2xl bg-paper-raised"
    >
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        className="cursor-grab touch-none rounded-lg p-2 text-muted hover:bg-paper hover:text-ink active:cursor-grabbing"
        aria-label={`Drag ${row.label || `level ${index + 1}`}`}
      >
        <IconGrip className="h-4 w-4" />
      </button>
      <input
        value={row.label}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
        placeholder={`Level ${index + 1}`}
      />
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="rounded-md p-0.5 text-muted hover:bg-paper hover:text-ink disabled:opacity-30"
          aria-label="Move up"
        >
          <IconChevronDown className="h-3.5 w-3.5 rotate-180" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="rounded-md p-0.5 text-muted hover:bg-paper hover:text-ink disabled:opacity-30"
          aria-label="Move down"
        >
          <IconChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
        aria-label={`Remove level ${index + 1}`}
      >
        <IconClose className="h-4 w-4" />
      </button>
    </Reorder.Item>
  );
}
