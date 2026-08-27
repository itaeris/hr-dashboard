"use client";

import { initials, stageLabel } from "@/lib/format";
import { positionTone } from "@/lib/position-color";
import type { Stage } from "@/lib/types";

export function DriveLink({ url }: { url?: string | null }) {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return null;
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex max-w-full truncate text-[12px] font-medium text-accent hover:underline"
    >
      Open recording
    </a>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent-deep ${
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
      }`}
    >
      {initials(name)}
    </span>
  );
}

export function PositionChip({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  const tone = positionTone(title);
  return (
    <span
      title={title}
      className={`inline-flex max-w-[220px] truncate rounded-full px-2.5 py-0.5 text-[11px] font-medium ${className}`}
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {title}
    </span>
  );
}

export function StageChip({ stage }: { stage: Stage }) {
  const muted = stage === "rejected";
  const success = stage === "hired";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] ${
        muted
          ? "bg-paper text-muted"
          : success
            ? "bg-accent text-white"
            : "bg-accent-soft text-accent-deep"
      }`}
    >
      {stageLabel(stage)}
    </span>
  );
}
