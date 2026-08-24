"use client";

import {
  EMAIL_TEMPLATE_KINDS,
  EMAIL_TEMPLATE_META,
  buildEmlFile,
  downloadTextFile,
  fillTemplate,
  gmailComposeUrl,
  loadTemplates,
  suggestedTemplate,
  templateVars,
  type EmailAttachment,
  type EmailTemplateKind,
} from "@/lib/email-templates";
import { useRecruitment } from "@/lib/recruitment-context";
import type { ApplicationView } from "@/lib/types";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { EmailSignaturePreview } from "./email-signature-preview";
import { FileAttachList } from "./file-attach";
import { Field, ModalFrame, fieldClass } from "./ui";

export function SendEmailModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ApplicationView | null;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <ModalFrame
      open={open && Boolean(item)}
      onClose={onClose}
      title="Send email"
      wide
    >
      {item ? <SendEmailComposer key={`${item.id}:${open ? "open" : "closed"}`} item={item} /> : null}
    </ModalFrame>,
    document.body,
  );
}

function SendEmailComposer({ item }: { item: ApplicationView }) {
  const { slug, brand } = useRecruitment();
  const initialKind = suggestedTemplate(item);
  const initialTemplate = loadTemplates(slug, brand.name).find(
    (entry) => entry.kind === initialKind,
  );
  const initialVars = templateVars(item, brand.name, initialKind);
  const [kind, setKind] = useState<EmailTemplateKind>(initialKind);
  const [subject, setSubject] = useState(
    fillTemplate(initialTemplate?.subject ?? "", initialVars),
  );
  const [body, setBody] = useState(fillTemplate(initialTemplate?.body ?? "", initialVars));
  const [attachments, setAttachments] = useState<EmailAttachment[]>(
    initialTemplate?.attachments ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const to = item.candidate.email ?? "";

  const gmailUrl = useMemo(() => {
    if (!to) return "";
    const extra =
      attachments.length > 0
        ? `\n\n—\nPlease attach: ${attachments.map((file) => file.name).join(", ")}`
        : "";
    return gmailComposeUrl(to, subject, `${body}${extra}`);
  }, [attachments, body, subject, to]);

  function applyKind(next: EmailTemplateKind) {
    const template = loadTemplates(slug, brand.name).find((entry) => entry.kind === next);
    const vars = templateVars(item, brand.name, next);
    setKind(next);
    setSubject(fillTemplate(template?.subject ?? "", vars));
    setBody(fillTemplate(template?.body ?? "", vars));
    setAttachments(template?.attachments ?? []);
  }

  async function sendEmail() {
    if (!to) return;
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, attachments, company: slug }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not send email.");
      }
      setStatus("Email sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send email.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadEml() {
    setBusy(true);
    try {
      const eml = await buildEmlFile({ to, subject, body, attachments, company: slug });
      downloadTextFile(
        `${EMAIL_TEMPLATE_META[kind].label} — ${item.candidate.full_name}.eml`,
        eml,
        "message/rfc822",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="break-words text-sm text-muted">
        To <span className="font-medium text-ink">{item.candidate.full_name}</span> · {to}
      </p>
      <div className="flex flex-wrap gap-2">
        {EMAIL_TEMPLATE_KINDS.map((itemKind) => (
          <button
            key={itemKind}
            type="button"
            onClick={() => applyKind(itemKind)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              itemKind === kind
                ? "bg-accent text-white"
                : "border border-line text-muted hover:text-ink"
            }`}
          >
            {EMAIL_TEMPLATE_META[itemKind].label}
          </button>
        ))}
      </div>
      <Field label="Subject">
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="Body">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          className={`${fieldClass} resize-y`}
        />
      </Field>
      <Field label="Attachments">
        <FileAttachList files={attachments} onChange={setAttachments} />
      </Field>
      <EmailSignaturePreview slug={slug} />
      {status ? <p className="text-sm text-accent">{status}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void sendEmail()}
          disabled={busy || !to}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send email"}
        </button>
        <a
          href={gmailUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-line px-4 py-3 text-sm text-ink hover:bg-paper"
        >
          Open in Gmail
        </a>
        <button
          type="button"
          onClick={() => void downloadEml()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-line px-4 py-3 text-sm text-ink hover:bg-paper disabled:opacity-50"
        >
          Download .eml
        </button>
      </div>
    </div>
  );
}
