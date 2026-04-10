"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { getPatients, type Patient } from "@/lib/firebase"
import { ScanPageContent } from "@/components/scan-page-content"

interface ScanPageProps {
  params: Promise<{ uid: string }>
}

export default function ScanPage({ params }: ScanPageProps) {
  const { uid } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatient() {
      try {
        const patients = await getPatients()
        const found = patients.find(p => p.uid === uid)
        
        if (found) {
          setPatient(found)
        } else {
          setError("Patient not found")
        }
      } catch (err) {
        console.error("[v0] Error fetching patient:", err)
        setError("Failed to load patient data")
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [uid])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="neu-card p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="neu-card p-8 flex flex-col items-center gap-4 max-w-md text-center">
          <div className="neu-btn p-4 rounded-full">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Patient Not Found</h2>
          <p className="text-muted-foreground">
            {error || `No patient found with ID: ${uid}`}
          </p>
          <button
            onClick={() => router.push("/records")}
            className="neu-btn px-6 py-3 text-primary font-medium"
          >
            Go to Records
          </button>
        </div>
      </div>
    )
  }

  return <ScanPageContent patient={patient} />
}
