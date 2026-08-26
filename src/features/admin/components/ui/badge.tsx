"use client";

import * as React from "react"
import { cn } from "@/features/admin/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-brand-primary text-background": variant === "default",
          "border-transparent bg-surface-muted text-text-primary": variant === "secondary",
          "text-foreground": variant === "outline",
          "border-transparent bg-success/10 text-success": variant === "success",
          "border-transparent bg-warning/10 text-warning": variant === "warning",
          "border-transparent bg-danger/10 text-danger": variant === "danger",
          "border-transparent bg-info/10 text-info": variant === "info",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
