"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"

interface UIDOverlayProps {
  uid: string
  patientName: string
  onClose: () => void
}

export function UIDOverlay({ uid, patientName, onClose }: UIDOverlayProps) {
  const router = useRouter()

  const handleProceed = () => {
    router.push(`/scan/${uid}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/80">
      <div className="neu-card p-10 max-w-md w-full mx-4 text-center">
        {/* Success Icon */}
        <div className="neu-btn w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Patient Registered Successfully
        </h2>
        <p className="text-muted-foreground mb-8">
          {patientName} has been added to the system
        </p>

        {/* UID Display */}
        <div className="neu-card-inset p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-2">Unique Patient ID</p>
          <p className="text-4xl font-bold text-primary animate-pulse-glow tracking-wider">
            {uid}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleProceed}
            className="neu-btn px-6 py-4 flex items-center justify-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            Proceed to Examination
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Register Another Patient
          </button>
        </div>
      </div>
    </div>
  )
}
