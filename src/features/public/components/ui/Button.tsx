"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--color-accent)] text-[var(--color-static-white)] hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-static-white)]": variant === "primary",
            "bg-[var(--color-static-white)] text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-[var(--color-background)]": variant === "secondary",
            "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]": variant === "outline",
            "hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]": variant === "ghost",
            "bg-[var(--color-error)] text-[var(--color-static-white)] hover:bg-[var(--color-error)]/90": variant === "destructive",
            "h-9 px-4 py-2": size === "md",
            "h-8 rounded-[var(--radius-md)] px-3 text-xs": size === "sm",
            "h-11 rounded-[var(--radius-md)] px-8 text-base": size === "lg",
            "h-9 w-9 rounded-[var(--radius-md)]": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
