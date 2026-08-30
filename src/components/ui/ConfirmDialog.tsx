"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[160] grid place-items-center bg-[var(--color-static-black)]/50 p-4 backdrop-blur-[2px]"
      onMouseDown={() => {
        if (!pending) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="rounded-[calc(var(--radius-lg)-4px)] bg-background p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] ${
                destructive
                  ? "bg-[var(--status-error-soft)] text-danger"
                  : "bg-[var(--color-primary-soft)] text-brand-primary"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 id="confirm-dialog-title" className="text-lg font-bold text-text-primary">
                {title}
              </h2>
              {description && (
                <div className="mt-2 text-sm leading-6 text-text-secondary">{description}</div>
              )}
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              disabled={pending}
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className={`rounded-md px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] transition-opacity hover:opacity-90 disabled:opacity-50 ${
                destructive ? "bg-danger" : "bg-brand-primary"
              }`}
            >
              {pending ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
