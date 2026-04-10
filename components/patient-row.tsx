"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  Clock,
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

interface MenuPosition {
  top: number
  left: number
}

export function PatientRow({ patient, onStatusChange }: PatientRowProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 })
  const [scans, setScans] = useState<Scan[]>([])
  const [loadingScans, setLoadingScans] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showPrintReport, setShowPrintReport] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Close menu on scroll
  useEffect(() => {
    if (!showMenu) return
    const handleScroll = () => setShowMenu(false)
    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)
  }, [showMenu])

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuButtonRef.current) return
    const rect = menuButtonRef.current.getBoundingClientRect()
    // Use fixed positioning — top = button bottom, right-align to button
    const menuWidth = 200
    let left = rect.right - menuWidth
    if (left < 8) left = 8
    setMenuPos({
      top: rect.bottom + 8,
      left,
    })
    setShowMenu(true)
  }, [])

  const closeMenu = useCallback(() => setShowMenu(false), [])

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
    setIsExpanded(prev => !prev)
  }

  const handleNewExamination = () => {
    closeMenu()
    router.push(`/scan/${patient.uid}`)
  }

  const handleToggleStatus = async () => {
    closeMenu()
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

  const handleDownloadPDF = async () => {
    closeMenu()
    if (scans.length === 0) {
      setLoadingScans(true)
      try {
        const fetchedScans = await getScansForPatient(patient.uid)
        setScans(fetchedScans)
      } catch (error) {
        console.error("[v0] Error fetching scans:", error)
        setLoadingScans(false)
        return
      }
      setLoadingScans(false)
    }
    setShowPrintReport(true)
  }

  const formatTimestamp = (timestamp: Timestamp | Date | string | null | undefined): string => {
    if (!timestamp) return "—"
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    }
    return new Date(timestamp as string | Date).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    })
  }

  return (
    <div className={`card overflow-visible ${showMenu ? "relative z-50" : ""}`}>
        {/* Main Row */}
        <div
          className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer select-none hover:bg-secondary/30 transition-colors"
          onClick={handleExpand}
        >
          <StatusIndicator status={patient.status === "Active" ? "active" : "inactive"} size="sm" />

          <span className="text-primary font-mono font-bold text-xs sm:text-sm min-w-[50px] flex-shrink-0">
            {patient.uid}
          </span>

          <span className="font-semibold text-foreground flex-1 truncate min-w-0">
            {patient.name}
          </span>

          <span className="text-muted-foreground text-xs sm:text-sm hidden sm:block w-12 flex-shrink-0">
            {patient.gender}
          </span>

          <span className="text-muted-foreground text-xs sm:text-sm hidden md:block flex-1 truncate max-w-[150px] lg:max-w-[180px] flex-shrink-0">
            {patient.diagnosis || "—"}
          </span>

          {/* Registration Date & Time */}
          {patient.createdAt && (
            <div className="hidden lg:flex flex-col items-end gap-0.5 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatTimestamp(patient.createdAt).split(",")[0]}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatTimestamp(patient.createdAt).split(",")[1]?.trim() || ""}
                </span>
              </div>
            </div>
          )}

          {/* Buttons — stop row click propagation */}
          <div
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <button
              ref={menuButtonRef}
              onMouseDown={openMenu}
              className="btn btn-ghost p-2 rounded-md hover:bg-secondary"
              aria-label="Open patient menu"
            >
              {updatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <button
              onClick={handleExpand}
              className="btn btn-ghost p-2 rounded-md hover:bg-secondary"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>
        </div>

        {/* Expanded scan history */}
        {isExpanded && (
          <div className="border-t border-border bg-secondary/20 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">
              Examination History
            </h4>

            {loadingScans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No examination records found</p>
                <button
                  onClick={handleNewExamination}
                  className="neu-btn px-4 py-2 mt-3 text-primary text-sm"
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
                        {formatTimestamp(scan.timestamp)}
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

      {/* Portal dropdown — rendered directly in <body>, fully outside all cards */}
      {showMenu && typeof document !== "undefined" && createPortal(
        <>
          {/* Invisible full-screen backdrop to catch outside clicks */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "transparent",
            }}
            onClick={closeMenu}
          />

          {/* The actual menu — fixed position, always on top */}
          <div
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 9999,
              minWidth: "180px",
              background: "var(--background)",
              borderRadius: "0.5rem",
              padding: "4px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <button
              onMouseDown={e => { e.stopPropagation(); handleNewExamination() }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-foreground rounded hover:bg-secondary transition-colors text-left"
            >
              <Stethoscope className="w-4 h-4 text-primary flex-shrink-0" />
              New Exam
            </button>

            <button
              onMouseDown={e => { e.stopPropagation(); handleDownloadPDF() }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-foreground rounded hover:bg-secondary transition-colors text-left"
            >
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--foreground)",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Download className="w-4 h-4 text-accent flex-shrink-0" />
              Report (PDF)
            </button>

            <div className="h-px bg-border my-1" />

            <button
              onMouseDown={e => { e.stopPropagation(); handleToggleStatus() }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-foreground rounded hover:bg-secondary transition-colors text-left"
            >
              {patient.status === "Active" ? (
                <>
                  <ToggleLeft className="w-4 h-4 text-destructive flex-shrink-0" />
                  Mark Inactive
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-success flex-shrink-0" />
                  Mark Active
                </>
              )}
            </button>
          </div>
        </>,
        document.body
      )}}

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
