import { initials, stageLabel } from "@/lib/format";
import type { Stage } from "@/lib/types";

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
