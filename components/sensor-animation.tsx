"use client"

import { cn } from "@/lib/utils"

interface SensorAnimationProps {
  isActive: boolean
}

export function SensorAnimation({ isActive }: SensorAnimationProps) {
  return (
    <div className="relative flex items-center justify-center h-full min-h-[300px]">
      {/* Background glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl transition-opacity duration-500",
          isActive ? "opacity-20" : "opacity-0"
        )}
        style={{
          background: isActive 
            ? "radial-gradient(circle at center, var(--primary), transparent 70%)" 
            : "none"
        }}
      />
      
      {/* Outer hexagon ring */}
      <div 
        className={cn(
          "absolute w-48 h-48 border-2 rounded-3xl transition-all duration-500",
          isActive 
            ? "border-primary animate-spin-slow opacity-60" 
            : "border-muted-foreground/30 opacity-30"
        )}
        style={{ transform: "rotate(45deg)" }}
      />
      
      {/* Middle hexagon ring */}
      <div 
        className={cn(
          "absolute w-36 h-36 border-2 rounded-2xl transition-all duration-500",
          isActive 
            ? "border-accent animate-spin-slow opacity-70" 
            : "border-muted-foreground/20 opacity-20"
        )}
        style={{ 
          transform: "rotate(-45deg)",
          animationDirection: "reverse",
          animationDuration: "6s"
        }}
      />
      
      {/* Inner hexagon */}
      <div 
        className={cn(
          "absolute w-24 h-24 rounded-xl transition-all duration-500",
          isActive 
            ? "bg-primary/20 animate-pulse-glow" 
            : "bg-muted/50"
        )}
        style={{ transform: "rotate(45deg)" }}
      />
      
      {/* Center core */}
      <div 
        className={cn(
          "relative w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-300",
          isActive 
            ? "neu-btn-pressed bg-primary/10" 
            : "neu-card"
        )}
        style={{ transform: "rotate(45deg)" }}
      >
        <div 
          className={cn(
            "w-8 h-8 rounded transition-all duration-300",
            isActive 
              ? "bg-primary animate-pulse" 
              : "bg-muted-foreground/30"
          )}
        />
      </div>
      
      {/* Pulsing rings when active */}
      {isActive && (
        <>
          <div className="absolute w-32 h-32 border border-primary/30 rounded-full animate-ping-dot" />
          <div 
            className="absolute w-40 h-40 border border-accent/20 rounded-full animate-ping-dot" 
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
      
      {/* Status text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className={cn(
          "text-sm font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {isActive ? "Sensor Active" : "Sensor Standby"}
        </p>
      </div>
    </div>
  )
}
