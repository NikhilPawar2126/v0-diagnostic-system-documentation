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
    const menuWidth = 200

    let left = rect.right - menuWidth
    if (left < 8) left = 8

    setMenuPos({
      top: rect.bottom + 8,
      left,
    })

    setShowMenu(true) // 🔥 FIXED
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

  const formatTimestamp = (timestamp: Timestamp | Date) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  return (
    <>
      {/* Card */}
      <div className="neu-card" style={{ overflow: "visible" }}>
        {/* Main Row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer select-none"
          onClick={handleExpand}
        >
          <StatusIndicator status={patient.status === "Active" ? "active" : "inactive"} size="sm" />

          <span className="text-primary font-mono font-bold text-sm min-w-[56px]">
            {patient.uid}
          </span>

          <span className="font-semibold text-foreground flex-1 truncate">
            {patient.name}
          </span>

          <span className="text-muted-foreground text-sm hidden sm:block w-16">
            {patient.gender}
          </span>

          <span className="text-muted-foreground text-sm hidden md:block flex-1 truncate max-w-[180px]">
            {patient.diagnosis || "No diagnosis"}
          </span>

          {/* Buttons — stop row click propagation */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <button
              ref={menuButtonRef}
              onMouseDown={(e) => {
                e.stopPropagation()
                openMenu(e)
              }}
              className="neu-btn p-2 rounded-lg"
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
              className="neu-btn p-2 rounded-lg"
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
          <div className="border-t border-border bg-secondary/20 p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
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
              minWidth: "200px",
              background: "var(--background)",
              borderRadius: "12px",
              padding: "6px",
              boxShadow:
                "10px 10px 24px var(--neu-shadow-dark), -10px -10px 24px var(--neu-shadow-light), 0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            <button
              onMouseDown={e => { e.stopPropagation(); handleNewExamination() }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--foreground)",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Stethoscope style={{ width: 16, height: 16, color: "var(--primary)", flexShrink: 0 }} />
              New Examination
            </button>

            <button
              onMouseDown={e => { e.stopPropagation(); handleDownloadPDF() }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--foreground)",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Download style={{ width: 16, height: 16, color: "var(--accent)", flexShrink: 0 }} />
              Save Data (PDF)
            </button>

            <button
              onMouseDown={e => { e.stopPropagation(); handleToggleStatus() }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--foreground)",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {patient.status === "Active" ? (
                <>
                  <ToggleLeft style={{ width: 16, height: 16, color: "var(--destructive)", flexShrink: 0 }} />
                  Mark Inactive
                </>
              ) : (
                <>
                  <ToggleRight style={{ width: 16, height: 16, color: "var(--accent)", flexShrink: 0 }} />
                  Mark Active
                </>
              )}
            </button>
          </div>
        </>,
        document.body
      )}

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
