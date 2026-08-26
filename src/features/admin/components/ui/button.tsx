"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/features/admin/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand-primary text-background shadow hover:bg-brand-primary-hover": variant === "default",
            "bg-brand-secondary text-brand-primary shadow-sm hover:bg-brand-accent": variant === "secondary",
            "border border-border bg-transparent shadow-sm hover:bg-surface-muted": variant === "outline",
            "hover:bg-surface-muted": variant === "ghost",
            "text-brand-primary underline-offset-4 hover:underline": variant === "link",
            "bg-danger text-[var(--color-static-white)] shadow-sm hover:bg-danger/90": variant === "danger",
            
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-sm px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
