"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
  key?: React.Key;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:opacity-90 uppercase tracking-widest text-[10px]": variant === "default",
          "border-transparent bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] uppercase tracking-widest text-[10px]": variant === "secondary",
          "text-[var(--color-text-primary)] border-[var(--color-border)] uppercase tracking-widest text-[10px]": variant === "outline",
          "border-transparent bg-[var(--color-success)]/10 text-[var(--color-success)] uppercase tracking-widest text-[10px]": variant === "success",
          "border-transparent bg-[var(--color-warning)]/10 text-[var(--color-warning)] uppercase tracking-widest text-[10px]": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}
