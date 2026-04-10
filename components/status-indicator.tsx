"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "standby" | "live" | "active" | "inactive"
  label?: string
  size?: "sm" | "md" | "lg"
}

export function StatusIndicator({ status, label, size = "md" }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const statusConfig = {
    standby: {
      color: "bg-muted-foreground",
      pulse: false,
      defaultLabel: "Standby",
    },
    live: {
      color: "bg-success",
      pulse: true,
      defaultLabel: "Live",
    },
    active: {
      color: "bg-success",
      pulse: false,
      defaultLabel: "Active",
    },
    inactive: {
      color: "bg-destructive",
      pulse: false,
      defaultLabel: "Inactive",
    },
  }

  const config = statusConfig[status]
  const displayLabel = label || config.defaultLabel

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <span className={cn(
          "rounded-full",
          sizeClasses[size],
          config.color
        )} />
        {config.pulse && (
          <span className={cn(
            "absolute rounded-full animate-ping-dot",
            sizeClasses[size],
            config.color,
            "opacity-75"
          )} />
        )}
      </div>
      <span className={cn(
        "font-semibold text-xs",
        status === "live" ? "text-success" : 
        status === "active" ? "text-success" :
        status === "inactive" ? "text-destructive" :
        "text-muted-foreground"
      )}>
        {displayLabel}
      </span>
    </div>
  )
}
