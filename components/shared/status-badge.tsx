"use client"

import { cn } from "@/lib/utils"

type StatusVariant = "success" | "warning" | "destructive" | "info" | "default"

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  className?: string
}

const variants: Record<StatusVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning-foreground border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
  default: "bg-secondary text-secondary-foreground border-border",
}

export function StatusBadge({ label, variant = "default", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

export function getExamStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "completed": return "success"
    case "not-started": return "default"
    case "in-progress": return "warning"
    default: return "default"
  }
}
