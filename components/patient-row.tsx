"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Stethoscope, 
  Download, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Calendar,
  Ruler,
  Waves
} from "lucide-react"
import { type Patient, type Scan, getScansForPatient, updatePatientStatus } from "@/lib/firebase"
import { StatusIndicator } from "./status-indicator"
import { PrintReport } from "./print-report"
import { Timestamp } from "firebase/firestore"

interface PatientRowProps {
  patient: Patient
  onStatusChange: () => void
}

function DropdownPortal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Full screen overlay to close menu on outside click */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
        }}
        onClick={onClose}
      />
      {children}
    </>,
    document.body
  )
}

export function PatientRow({ patient, onStatusChange }: PatientRowProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [scans, setScans] = useState<Scan[]>([])
  const [loadingScans, setLoadingScans] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showPrintReport, setShowPrintReport] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const handleExpand = async () => {
    if (!isExpanded && scans.length === 0) {
      setLoadingScans(true)
      try {
        const fetchedScans = await getScansForPatient(patient.uid)
        setScans(fetchedScans)
      } catch (error) {
        console.error("[v0] Error fetching scans:", error)
      } finally {
        setLoadingScans(false)
      }
    }
    setIsExpanded(!isExpanded)
  }

  const handleNewExamination = () => {
    setShowMenu(false)
    router.push(`/scan/${patient.uid}`)
  }

  const handleToggleStatus = async () => {
    setShowMenu(false)
    setUpdatingStatus(true)
    try {
      const newStatus = patient.status === "Active" ? "Inactive" : "Active"
      await updatePatientStatus(patient.id!, newStatus)
      onStatusChange()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatTimestamp = (timestamp: Timestamp | Date) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  const handleDownloadPDF = async () => {
    setShowMenu(false)

    if (scans.length === 0) {
      setLoadingScans(true)
      try {
        const fetchedScans = await getScansForPatient(patient.uid)
        setScans(fetchedScans)
      } catch (error) {
        console.error("[v0] Error fetching scans for PDF:", error)
        setLoadingScans(false)
        return
      }
      setLoadingScans(false)
    }

    setShowPrintReport(true)
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(rect.right - 190, window.innerWidth - 200),
      })
    }
    setShowMenu((prev) => !prev)
  }

  return (
    <>
      <div className="neu-card overflow-hidden">
        {/* Main Row */}
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={handleExpand}
        >
          {/* Status Badge */}
          <StatusIndicator status={patient.status === "Active" ? "active" : "inactive"} size="sm" />

          {/* UID */}
          <span className="text-primary font-mono font-semibold min-w-[60px]">
            {patient.uid}
          </span>

          {/* Name */}
          <span className="font-medium text-foreground flex-1">
            {patient.name}
          </span>

          {/* Gender */}
          <span className="text-muted-foreground hidden sm:block w-20">
            {patient.gender}
          </span>

          {/* Diagnosis */}
          <span className="text-muted-foreground hidden md:block flex-1 truncate max-w-[200px]">
            {patient.diagnosis || "No diagnosis"}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              className="neu-btn p-2 rounded-lg"
            >
              {updatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Expand Arrow */}
            <div className="neu-btn p-2 rounded-lg cursor-pointer" onClick={handleExpand}>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="border-t border-border bg-secondary/20 p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Examination History
            </h4>

            {loadingScans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No examination records found</p>
                <button
                  onClick={handleNewExamination}
                  className="neu-btn px-4 py-2 mt-4 text-primary text-sm"
                >
                  Start First Examination
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scans.map((scan, index) => (
                  <div key={scan.id} className="neu-card-inset p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">
                        Exam #{scans.length - index}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(scan.timestamp).split(",")[0]}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-accent" />
                        <span className="text-foreground">{scan.distance.toFixed(1)} cm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Waves className="w-3 h-3 text-destructive" />
                        <span className="text-foreground">{scan.frequency.toFixed(1)} Hz</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Menu rendered via Portal directly into document.body */}
      {showMenu && (
        <DropdownPortal onClose={() => setShowMenu(false)}>
          <div
            style={{
              position: "absolute",
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 99999,
              minWidth: "190px",
              background: "var(--background)",
              borderRadius: "var(--radius)",
              boxShadow:
                "10px 10px 24px var(--neu-shadow-dark), -10px -10px 24px var(--neu-shadow-light), 0 8px 32px rgba(0,0,0,0.18)",
              padding: "8px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleNewExamination}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 text-left text-sm text-foreground"
            >
              <Stethoscope className="w-4 h-4 text-primary" />
              New Examination
            </button>
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 text-left text-sm text-foreground"
            >
              <Download className="w-4 h-4 text-accent" />
              Save Data (PDF)
            </button>
            <button
              onClick={handleToggleStatus}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 text-left text-sm text-foreground"
            >
              {patient.status === "Active" ? (
                <>
                  <ToggleLeft className="w-4 h-4 text-destructive" />
                  Mark Inactive
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-accent" />
                  Mark Active
                </>
              )}
            </button>
          </div>
        </DropdownPortal>
      )}

      {/* Print Report Modal */}
      {showPrintReport && (
        <PrintReport
          patient={patient}
          scans={scans}
          onClose={() => setShowPrintReport(false)}
        />
      )}
    </>
  )
}
