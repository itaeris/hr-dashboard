"use client";

import {
  EMAIL_FILE_ACCEPT,
  EMAIL_FILE_MAX_BYTES,
  EMAIL_FILE_MAX_COUNT,
  fileToAttachment,
  type EmailAttachment,
} from "@/lib/email-templates";
import { useRef, useState } from "react";
import { CvPreviewDialog } from "./cv-preview";
import { IconClose, IconFile, IconPaperclip } from "./icons";

export function FileAttachList({
  files,
  onChange,
  label = "Attach file",
}: {
  files: EmailAttachment[];
  onChange: (files: EmailAttachment[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<EmailAttachment | null>(null);

  async function add(list: FileList | null) {
    const next = list?.[0];
    if (!next) return;
    if (files.length >= EMAIL_FILE_MAX_COUNT) {
      setError(`Up to ${EMAIL_FILE_MAX_COUNT} files`);
      return;
    }
    if (next.size > EMAIL_FILE_MAX_BYTES) {
      setError("File must be under 8 MB");
      return;
    }
    setError("");
    onChange([...files, await fileToAttachment(next)]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={EMAIL_FILE_ACCEPT}
        className="sr-only"
        onChange={(event) => void add(event.target.files)}
      />
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2"
            >
              <button
                type="button"
                onClick={() => setPreview(file)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
              >
                <IconFile className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">{file.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, item) => item !== index))}
                className="rounded-full p-1 text-muted hover:bg-paper-raised hover:text-ink"
                aria-label={`Remove ${file.name}`}
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= EMAIL_FILE_MAX_COUNT}
        className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm text-muted hover:text-ink disabled:opacity-50"
      >
        <IconPaperclip className="h-4 w-4" />
        {label}
      </button>
      {error ? <p className="text-xs text-accent">{error}</p> : null}
      {preview ? (
        <CvPreviewDialog
          url={preview.url}
          open
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
