"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { IconCalendar, IconChevronDown, IconClose } from "./icons";
import { ScrollArea } from "./scroll-area";
import { fieldClass } from "./ui";

export type SelectOption = { value: string; label: string };

type MenuPos = { top: number; left: number; width: number; maxHeight: number };

function useMenuPosition(
  open: boolean,
  trigger: HTMLElement | null,
  minHeight = 180,
) {
  const [pos, setPos] = useState<MenuPos | null>(null);

  useLayoutEffect(() => {
    if (!open || !trigger) {
      setPos(null);
      return;
    }

    const node = trigger;

    function update() {
      const rect = node.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openUp = spaceBelow < minHeight && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      setPos({
        top: openUp ? rect.top - gap : rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(minHeight, Math.min(available, 480)),
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [minHeight, open, trigger]);

  return pos;
}

function Popover({
  open,
  trigger,
  children,
  align = "start",
  minHeight = 180,
}: {
  open: boolean;
  trigger: HTMLElement | null;
  children: ReactNode;
  align?: "start" | "stretch";
  minHeight?: number;
}) {
  const pos = useMenuPosition(open, trigger, minHeight);
  if (!open || !pos || typeof document === "undefined") return null;

  const openUp = pos.top < (trigger?.getBoundingClientRect().top ?? 0);
  const style: CSSProperties = {
    position: "fixed",
    left: pos.left,
    width: align === "stretch" ? pos.width : Math.max(pos.width, 280),
    maxHeight: pos.maxHeight,
    zIndex: 80,
  };
  if (openUp) {
    style.bottom = window.innerHeight - pos.top;
  } else {
    style.top = pos.top;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: openUp ? 6 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: openUp ? 6 : -6 }}
      transition={{ duration: 0.16 }}
      style={style}
      className="overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-lg"
    >
      {children}
    </motion.div>,
    document.body,
  );
}

export function Select({
  name,
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Pilih",
  required = false,
  className = "",
}: {
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const label = options.find((option) => option.value === selected)?.label;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [menuId, open]);

  function pick(next: string) {
    setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selected} required={required} /> : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={label ? "truncate" : "truncate text-muted"}>{label ?? placeholder}</span>
        <IconChevronDown className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open ? (
          <Popover open={open} trigger={triggerRef.current} align="stretch">
            <div id={menuId}>
              <ScrollArea axis="y" compact className="max-h-64">
                <div className="p-1">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => pick(option.value)}
                      className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                        option.value === selected
                          ? "bg-accent-soft text-accent-deep"
                          : "text-ink hover:bg-paper"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Popover>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function toYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDisplay(value: string) {
  const date = parseYmd(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function monthGrid(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePicker({
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Pilih tanggal",
  required = false,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const [cursor, setCursor] = useState(() =>
    selected ? parseYmd(selected) : new Date(),
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (selected) setCursor(parseYmd(selected));
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [menuId, open]);

  function pick(next: string) {
    setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  const today = toYmd(new Date());

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={selected} required={required} /> : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {selected && !required ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                pick("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.stopPropagation();
                  pick("");
                }
              }}
              className="rounded-full p-0.5 text-muted hover:text-ink"
            >
              <IconClose className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <IconCalendar className="h-4 w-4 shrink-0 text-muted" />
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <Popover open={open} trigger={triggerRef.current} minHeight={360}>
            <div id={menuId} className="p-3 pb-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                  }
                  className="rounded-full px-2 py-1 text-sm text-muted hover:bg-paper hover:text-ink"
                >
                  ‹
                </button>
                <p className="text-sm font-medium">
                  {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                  }
                  className="rounded-full px-2 py-1 text-sm text-muted hover:bg-paper hover:text-ink"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-muted">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="py-1">
                    {day}
                  </span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthGrid(cursor).map((day, index) => {
                  if (!day) return <span key={`e-${index}`} />;
                  const ymd = toYmd(new Date(cursor.getFullYear(), cursor.getMonth(), day));
                  const isSelected = ymd === selected;
                  const isToday = ymd === today;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => pick(ymd)}
                      className={`h-8 rounded-full text-sm ${
                        isSelected
                          ? "bg-accent text-white"
                          : isToday
                            ? "bg-accent-soft text-accent-deep"
                            : "text-ink hover:bg-paper"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </Popover>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
