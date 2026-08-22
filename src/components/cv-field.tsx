"use client";

import { CV_ACCEPT, CV_MAX_BYTES } from "@/lib/cv";
import { useRef, useState } from "react";
import { IconClose, IconPaperclip } from "./icons";
import { fieldClass } from "./ui";

export function CvField({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function pick(next: File | null) {
    if (next && next.size > CV_MAX_BYTES) {
      setError("File must be under 8 MB");
      return;
    }
    setError("");
    onChange(next);
    if (!next && inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={CV_ACCEPT}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0] ?? null)}
      />
      <div className={`${fieldClass} flex items-center gap-3`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <IconPaperclip className="h-4 w-4 shrink-0 text-muted" />
          <span className={`truncate ${file ? "text-ink" : "text-muted"}`}>
            {file ? file.name : "Attach CV"}
          </span>
        </button>
        {file ? (
          <button
            type="button"
            onClick={() => pick(null)}
            className="rounded-full p-1 text-muted hover:bg-paper-raised hover:text-ink"
            aria-label="Remove CV"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-muted">
            PDF · DOC · IMG
          </span>
        )}
      </div>
      {error ? <p className="text-xs text-accent">{error}</p> : null}
    </div>
  );
}
