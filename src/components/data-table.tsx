import type { ReactNode } from "react";
import { ScrollArea } from "./scroll-area";

export function TableCard({
  children,
  minWidth,
}: {
  children: ReactNode;
  minWidth: string;
}) {
  return (
    <ScrollArea
      axis="x"
      xGutter="pt-5 pb-4"
      className="overflow-hidden rounded-[24px] border border-line bg-paper-raised"
    >
      <table
        className="w-full border-separate border-spacing-0 text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </ScrollArea>
  );
}

export function Th({
  children,
  sticky = false,
  align = "left",
  groupStart = false,
}: {
  children: ReactNode;
  sticky?: boolean;
  align?: "left" | "center" | "right";
  groupStart?: boolean;
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      className={`sticky top-0 z-20 whitespace-nowrap border-b border-line bg-paper px-3 py-3 text-[11px] font-medium tracking-[0.04em] text-muted sm:px-4 sm:py-3.5 ${alignClass} ${
        sticky ? "left-0 z-30 shadow-[1px_0_0_var(--line)]" : ""
      } ${groupStart ? "border-l border-line" : ""}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  sticky = false,
  nowrap = false,
  muted = false,
  align = "left",
  groupStart = false,
  className = "",
}: {
  children: ReactNode;
  sticky?: boolean;
  nowrap?: boolean;
  muted?: boolean;
  align?: "left" | "center" | "right";
  groupStart?: boolean;
  className?: string;
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <td
      className={`border-b border-line/80 px-3 py-3 sm:px-4 sm:py-4 ${alignClass} ${
        nowrap ? "whitespace-nowrap" : ""
      } ${muted ? "text-muted" : ""} ${
        sticky
          ? "sticky left-0 z-10 bg-paper-raised shadow-[1px_0_0_var(--line)] group-hover:bg-paper"
          : ""
      } ${groupStart ? "border-l border-line/80" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export function TableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`group border-0 last:[&>td]:border-b-0 ${
        onClick ? "cursor-pointer" : ""
      } hover:[&>td]:bg-paper`}
    >
      {children}
    </tr>
  );
}

export function EmptyValue() {
  return <span className="text-line">–</span>;
}

export function cell(value: ReactNode) {
  if (value === null || value === undefined || value === "" || value === "—") {
    return <EmptyValue />;
  }
  return value;
}

export function Pill({
  children,
  tone = "soft",
}: {
  children: ReactNode;
  tone?: "soft" | "muted" | "solid" | "warn" | "ok";
}) {
  const tones = {
    soft: "bg-accent-soft text-accent-deep",
    muted: "bg-paper text-muted",
    solid: "bg-accent text-white",
    warn: "bg-ink text-paper-raised",
    ok: "bg-accent-soft text-accent",
  } as const;
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
