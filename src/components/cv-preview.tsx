"use client";

import { cvMeta, previewable } from "@/lib/cv";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";
import { EmptyValue } from "./data-table";
import { IconClose, IconFile } from "./icons";

export function CvCell({ url }: { url: string | null }) {
  const [open, setOpen] = useState(false);

  if (!url) return <EmptyValue />;

  const meta = cvMeta(url);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex max-w-full items-center gap-2 text-left text-[12px] font-medium text-accent"
      >
        {meta.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-9 w-7 rounded-md object-cover ring-1 ring-line"
          />
        ) : (
          <IconFile className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{meta.name}</span>
      </button>
      <CvPreviewDialog url={url} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CvPreviewDialog({
  url,
  open,
  onClose,
}: {
  url: string;
  open: boolean;
  onClose: () => void;
}) {
  const meta = cvMeta(url);
  const canPreview = previewable(meta.kind);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(94dvh,840px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-paper-raised shadow-xl sm:h-[min(88vh,840px)] sm:rounded-[24px]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">CV</p>
                <h2 className="truncate font-display text-xl text-ink">{meta.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={url}
                  download={meta.name}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Open file
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
                  aria-label="Close preview"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-paper">
              {meta.kind === "image" ? (
                <div className="flex h-full items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={meta.name}
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                </div>
              ) : canPreview ? (
                <iframe title={meta.name} src={url} className="h-full w-full border-0 bg-white" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <IconFile className="h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">
                    This file type cannot be previewed here. Open it instead.
                  </p>
                  <a
                    href={url}
                    download={meta.name}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Open {meta.name}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
