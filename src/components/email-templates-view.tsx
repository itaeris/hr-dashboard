"use client";

import {
  EMAIL_TEMPLATE_KINDS,
  EMAIL_TEMPLATE_META,
  loadTemplates,
  loadTemplatesCached,
  saveTemplates,
  saveTemplatesCached,
  type EmailTemplate,
  type EmailTemplateKind,
} from "@/lib/email-templates";
import { useRecruitment } from "@/lib/recruitment-context";
import { useEffect, useRef, useState } from "react";
import { EmailSignaturePreview } from "./email-signature-preview";
import { FileAttachList } from "./file-attach";
import { Field, PageFade, fieldClass } from "./ui";

export function EmailTemplatesPage() {
  const { slug, brand } = useRecruitment();
  const sourceKey = `${slug}:${brand.name}`;
  const [activeKey, setActiveKey] = useState(sourceKey);
  const [kind, setKind] = useState<EmailTemplateKind>("interview");
  const [templates, setTemplates] = useState<EmailTemplate[]>(() =>
    loadTemplatesCached(slug, brand.name),
  );
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveTimer = useRef<number>(0);
  const latest = useRef(templates);
  const dirty = useRef(false);

  if (activeKey !== sourceKey) {
    setActiveKey(sourceKey);
    setTemplates(loadTemplatesCached(slug, brand.name));
  }

  useEffect(() => {
    let active = true;
    dirty.current = false;
    void loadTemplates(slug, brand.name).then((next) => {
      if (!active || dirty.current) return;
      latest.current = next;
      setTemplates(next);
    });
    return () => {
      active = false;
      window.clearTimeout(saveTimer.current);
    };
  }, [slug, brand.name]);

  const current = templates.find((item) => item.kind === kind) ?? templates[0];

  function update(patch: Partial<EmailTemplate>) {
    const next = templates.map((item) =>
      item.kind === kind ? { ...item, ...patch } : item,
    );
    dirty.current = true;
    setTemplates(next);
    latest.current = next;
    saveTemplatesCached(slug, next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveTemplates(slug, latest.current)
        .then(() => {
          setSaveError("");
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1400);
        })
        .catch(() => {
          setSaveError("Could not save to the server. Draft is kept on this device.");
        });
    }, 500);
  }

  return (
    <PageFade>
      <p className="max-w-2xl text-sm text-muted">
        Edit the candidate emails. Merge fields:{" "}
        <code className="break-all text-ink">{"{{candidate_name}}"}</code>,{" "}
        <code className="break-all text-ink">{"{{role}}"}</code>,{" "}
        <code className="break-all text-ink">{"{{company}}"}</code>,{" "}
        <code className="break-all text-ink">{"{{join_date}}"}</code>. Attach a file here
        and it will be included when you send from a candidate. The company logo is
        added as a signature on send. Changes auto-save to this workspace in
        Supabase.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {EMAIL_TEMPLATE_KINDS.map((item) => {
          const meta = EMAIL_TEMPLATE_META[item];
          const active = item === kind;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-accent text-white"
                  : "border border-line bg-paper-raised text-muted hover:text-ink"
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {current ? (
        <div className="mt-6 rounded-[24px] border border-line bg-paper-raised p-4 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-2xl sm:text-3xl">{EMAIL_TEMPLATE_META[current.kind].label}</h2>
              <p className="mt-1 text-sm text-muted">
                {EMAIL_TEMPLATE_META[current.kind].hint}
              </p>
            </div>
            <p
              className={`text-xs ${
                saveError
                  ? "text-[#E24B4A]"
                  : "uppercase tracking-[0.16em] text-muted"
              }`}
            >
              {saveError || (saved ? "Saved" : "Auto-saves")}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Subject">
              <input
                value={current.subject}
                onChange={(event) => update({ subject: event.target.value })}
                className={fieldClass}
              />
            </Field>
            <Field label="CC">
              <input
                value={current.cc}
                onChange={(event) => update({ cc: event.target.value })}
                className={fieldClass}
                placeholder="hiring.manager@aerisbeaute.com"
              />
              <p className="mt-1.5 text-xs text-muted">
                Optional. Separate multiple addresses with a comma. Used when
                you send this template.
              </p>
            </Field>
            <Field label="Body">
              <textarea
                value={current.body}
                onChange={(event) => update({ body: event.target.value })}
                rows={12}
                className={`${fieldClass} min-h-[240px] resize-y`}
              />
            </Field>
            <Field label="Attachments">
              <FileAttachList
                files={current.attachments}
                onChange={(attachments) => update({ attachments })}
                label="Attach file to this template"
              />
            </Field>
            <EmailSignaturePreview slug={slug} />
          </div>
        </div>
      ) : null}
    </PageFade>
  );
}
