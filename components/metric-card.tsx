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
    green: "text-accent",
    yellow: "text-chart-4",
  }

  return (
    <div className="neu-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn("p-2 rounded-lg neu-btn-pressed", colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span 
          className={cn(
            "text-3xl font-bold tabular-nums transition-all",
            colorClasses[color],
            isLive && "animate-pulse-glow"
          )}
        >
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
