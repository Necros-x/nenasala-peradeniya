"use client";

import * as React from "react"
import { cn } from "@/features/student/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-primary)] text-[var(--color-static-white)]": variant === 'default',
          "border-transparent bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]": variant === 'secondary',
          "border-[var(--color-border)] text-[var(--color-text-primary)]": variant === 'outline',
          "border-transparent bg-[var(--color-success-soft)] text-[var(--color-success)]": variant === 'success',
          "border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]": variant === 'warning',
          "border-transparent bg-[var(--color-error-soft)] text-[var(--color-error)]": variant === 'error',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
