"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { ScrollArea } from "./scroll-area";

export function PageFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ModalFrame({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-4 sm:items-center"
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
            className={`flex w-full flex-col overflow-hidden rounded-[24px] border border-line bg-paper-raised p-6 shadow-xl ${
              wide ? "max-w-3xl max-h-[90vh]" : "max-w-lg max-h-[90vh]"
            }`}
          >
            <div className="mb-5 flex shrink-0 items-center justify-between">
              <h2 className="font-display text-2xl">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-muted hover:text-ink"
              >
                Close
              </button>
            </div>
            <ScrollArea axis="y" compact className="min-h-0 flex-1">
              {children}
            </ScrollArea>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
    </div>
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";
