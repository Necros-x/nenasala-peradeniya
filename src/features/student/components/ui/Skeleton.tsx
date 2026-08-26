"use client";

import * as React from "react"
import { cn } from "@/features/student/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--color-border)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
