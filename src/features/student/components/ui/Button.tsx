"use client";

import * as React from "react"
import { cn } from "@/features/student/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--color-primary)] text-[var(--color-static-white)] hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-static-white)] rounded-[var(--radius-sm)]": variant === "default",
            "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-[var(--radius-sm)]": variant === "outline",
            "bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-[var(--radius-sm)]": variant === "ghost",
            "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-sm)]": variant === "secondary",
            "bg-[var(--color-error)] text-[var(--color-static-white)] hover:bg-[var(--color-error)]/90 rounded-[var(--radius-sm)]": variant === "danger",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3 text-xs": size === "sm",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
