"use client"

import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  unit: string
  icon: React.ReactNode
  isLive?: boolean
  color?: "blue" | "red" | "green" | "yellow"
}

export function MetricCard({ label, value, unit, icon, isLive = false, color = "blue" }: MetricCardProps) {
  const colorClasses = {
    blue: "text-primary",
    red: "text-destructive",
    green: "text-success",
    yellow: "text-warning",
  }

  const bgClasses = {
    blue: "bg-primary/10",
    red: "bg-destructive/10",
    green: "bg-success/10",
    yellow: "bg-warning/10",
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        <div className={cn("p-2.5 rounded-lg", bgClasses[color])}>
          <div className={colorClasses[color]}>
            {icon}
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span 
          className={cn(
            "text-3xl sm:text-4xl font-bold tabular-nums transition-all",
            colorClasses[color],
            isLive && "animate-pulse"
          )}
        >
          {value}
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">{unit}</span>
      </div>
    </div>
  )
}
