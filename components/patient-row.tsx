"use client"

import { useState } from "react"
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
  Thermometer,
  Gauge,
  Activity,
  Wind,
  Trash2
} from "lucide-react"

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { type Patient, type Scan, getScansForPatient, updatePatientStatus, deletePatient, deleteScan, updateScan } from "@/lib/firebase"
import { StatusIndicator } from "./status-indicator"
import { Timestamp } from "firebase/firestore"

interface PatientRowProps {
  patient: Patient
  isTested: boolean
  onStatusChange: () => void
}

export function PatientRow({ patient, isTested, onStatusChange }: PatientRowProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [scans, setScans] = useState<Scan[]>([])
  const [loadingScans, setLoadingScans] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null)
  const [remarkText, setRemarkText] = useState("")

  const handleSaveRemark = async (scanId: string) => {
    try {
      await updateScan(scanId, { remark: remarkText })
      setScans(scans.map(s => s.id === scanId ? { ...s, remark: remarkText } : s))
      setEditingRemarkId(null)
    } catch (error) {
      console.error("[v0] Error saving remark:", error)
    }
  }

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
    router.push(`/scan/${patient.uid}`)
  }

  const handleToggleStatus = async () => {
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

  const handleDeletePatient = async () => {
    if (confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      try {
        await deletePatient(patient.id!)
        onStatusChange()
      } catch (error) {
        console.error("[v0] Error deleting patient:", error)
      }
    }
  }

  const handleDeleteScan = async (scanId: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteScan(scanId)
        setScans(scans.filter(s => s.id !== scanId))
      } catch (error) {
        console.error("[v0] Error deleting scan:", error)
      }
    }
  }

  const formatTimestamp = (timestamp: Timestamp | Date) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  const handleDownloadPDF = async () => {
    
    // Fetch latest scans if not already loaded
    let scanData = scans
    if (scans.length === 0) {
      try {
        scanData = await getScansForPatient(patient.uid)
        setScans(scanData)
      } catch (error) {
        console.error("[v0] Error fetching scans for PDF:", error)
      }
    }

    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(59, 89, 152) // Primary color
    doc.text("Marma Diagnostic Report", 105, 20, { align: "center" })
    
    // Patient Info
    doc.setFontSize(12)
    doc.setTextColor(45, 52, 54) // Foreground color
    doc.text(`Patient ID: ${patient.uid}`, 20, 40)
    doc.text(`Name: ${patient.name}`, 20, 50)
    doc.text(`Gender: ${patient.gender}`, 20, 60)
    doc.text(`Age: ${patient.age}`, 120, 50)
    doc.text(`DOB: ${patient.dob}`, 120, 60)
    doc.text(`Doctor: ${patient.doctor}`, 20, 70)
    doc.text(`Diagnosis: ${patient.diagnosis || "N/A"}`, 20, 80)
    doc.text(`Status: ${patient.status}`, 20, 90)
    
    // Examination History
    doc.setFontSize(14)
    doc.text("Examination History", 20, 110)
    
    if (scanData.length > 0) {
      autoTable(doc, {
        startY: 120,
        head: [["Exam #", "Date/Time", "Temp (°C)", "Pressure", "HR (bpm)", "SpO2 (%)"]],
        body: scanData.map((scan, index) => [
          `#${index + 1}`,
          formatTimestamp(scan.timestamp),
          scan.temperature !== undefined ? `${scan.temperature.toFixed(1)}` : "N/A",
          scan.pressure !== undefined ? `${scan.pressure.toFixed(1)}` : "N/A",
          scan.heartRate !== undefined ? `${scan.heartRate}` : "N/A",
          scan.spo2 !== undefined ? `${scan.spo2}` : "N/A",
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 89, 152] },
      })
    } else {
      doc.setFontSize(10)
      doc.text("No examination records found.", 20, 125)
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(99, 110, 114) // Muted foreground
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: "center" })
    
    doc.save(`${patient.uid}_report.pdf`)
  }

  return (
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
        
        {/* Test Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isTested 
            ? "bg-accent/20 text-accent" 
            : "bg-muted text-muted-foreground"
        }`}>
          {isTested ? "Tested" : "Not Tested"}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Menu Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="neu-btn p-2 rounded-lg outline-none"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] z-50">
                <DropdownMenuItem onClick={handleNewExamination} className="cursor-pointer">
                  <Stethoscope className="w-4 h-4 text-primary mr-2" />
                  New Examination
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                  <Download className="w-4 h-4 text-accent mr-2" />
                  Save Data (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
                  {patient.status === "Active" ? (
                    <>
                      <ToggleLeft className="w-4 h-4 text-destructive mr-2" />
                      Mark Inactive
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4 text-accent mr-2" />
                      Mark Active
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeletePatient} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Expand Arrow */}
          <div className="neu-btn p-2 rounded-lg">
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
            <div className="flex flex-col space-y-4">
              {scans.map((scan, index) => (
                <div key={scan.id} className="neu-card p-4">
                  {/* Header: Exam info and Patient Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-primary">
                          Exam #{scans.length - index}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(scan.timestamp)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{patient.name}</span> (ID: {patient.uid})
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (editingRemarkId === scan.id) {
                            setEditingRemarkId(null)
                          } else {
                            setEditingRemarkId(scan.id!)
                            setRemarkText(scan.remark || "")
                          }
                        }}
                        className="neu-btn px-3 py-1.5 text-xs text-accent"
                      >
                        {scan.remark ? "Edit Remark" : "Add Remark"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteScan(scan.id!)
                        }}
                        className="neu-btn px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="neu-card-inset p-3 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Temp</div>
                        <div className="font-medium text-sm">{scan.temperature !== undefined ? `${scan.temperature.toFixed(1)} °C` : "N/A"}</div>
                      </div>
                    </div>
                    <div className="neu-card-inset p-3 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Pressure</div>
                        <div className="font-medium text-sm">{scan.pressure !== undefined ? `${scan.pressure.toFixed(1)}` : "N/A"}</div>
                      </div>
                    </div>
                    <div className="neu-card-inset p-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">HR</div>
                        <div className="font-medium text-sm">{scan.heartRate !== undefined ? `${scan.heartRate} bpm` : "N/A"}</div>
                      </div>
                    </div>
                    <div className="neu-card-inset p-3 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-yellow-500 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">SpO2</div>
                        <div className="font-medium text-sm">{scan.spo2 !== undefined ? `${scan.spo2} %` : "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Remark Section */}
                  {editingRemarkId === scan.id ? (
                    <div className="flex gap-2">
                      <textarea
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        placeholder="Type your remark here..."
                        className="neu-input flex-1 p-2 text-sm resize-none min-h-[60px]"
                      />
                      <button
                        onClick={() => handleSaveRemark(scan.id!)}
                        className="neu-btn px-4 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Save
                      </button>
                    </div>
                  ) : scan.remark ? (
                    <div className="neu-card-inset p-3 text-sm border-l-2 border-accent/50 bg-accent/5">
                      <span className="font-semibold text-accent text-xs block mb-1">Remark:</span>
                      <p className="text-muted-foreground">{scan.remark}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
