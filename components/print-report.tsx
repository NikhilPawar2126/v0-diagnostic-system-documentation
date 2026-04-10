"use client"

import { type Patient, type Scan } from "@/lib/firebase"
import { Timestamp } from "firebase/firestore"

interface PrintReportProps {
  patient: Patient
  scans: Scan[]
  onClose: () => void
}

export function PrintReport({ patient, scans, onClose }: PrintReportProps) {
  const formatTimestamp = (timestamp: Timestamp | Date) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Print-only content */}
        <div className="p-8 print:p-4" id="print-content">
          {/* Header */}
          <div className="text-center border-b-2 border-primary pb-4 mb-6">
            <h1 className="text-2xl font-bold text-primary">Marma Diagnostic Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Medical Examination Record</p>
          </div>

          {/* Patient Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">Patient Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Patient ID:</span>
                <span className="ml-2 text-foreground font-mono">{patient.uid}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Name:</span>
                <span className="ml-2 text-foreground">{patient.name}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Gender:</span>
                <span className="ml-2 text-foreground">{patient.gender}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Age:</span>
                <span className="ml-2 text-foreground">{patient.age}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">DOB:</span>
                <span className="ml-2 text-foreground">{patient.dob}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>
                <span className={`ml-2 ${patient.status === "Active" ? "text-accent" : "text-destructive"}`}>
                  {patient.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Referring Doctor:</span>
                <span className="ml-2 text-foreground">{patient.doctor}</span>
              </div>
              {patient.diagnosis && (
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Diagnosis:</span>
                  <span className="ml-2 text-foreground">{patient.diagnosis}</span>
                </div>
              )}
            </div>
          </div>

          {/* Examination History */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">Examination History</h2>
            {scans.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="text-left p-2 font-medium">#</th>
                    <th className="text-left p-2 font-medium">Date/Time</th>
                    <th className="text-right p-2 font-medium">Distance (cm)</th>
                    <th className="text-right p-2 font-medium">Frequency (Hz)</th>
                    <th className="text-right p-2 font-medium">CHI (%)</th>
                    <th className="text-right p-2 font-medium">Temp (C)</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan, index) => (
                    <tr key={scan.id} className="border-b">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{formatTimestamp(scan.timestamp)}</td>
                      <td className="p-2 text-right">{scan.distance.toFixed(2)}</td>
                      <td className="p-2 text-right">{scan.frequency.toFixed(2)}</td>
                      <td className="p-2 text-right">{scan.chi?.toFixed(2) || "N/A"}</td>
                      <td className="p-2 text-right">{scan.temperature?.toFixed(2) || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No examination records found</p>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-6">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p className="mt-1">Marma Diagnostic System</p>
          </div>
        </div>

        {/* Action buttons - hidden in print */}
        <div className="flex justify-end gap-3 p-4 border-t print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
