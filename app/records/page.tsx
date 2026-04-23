"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Filter, Loader2, FileText, Users, Download } from "lucide-react"
import { getPatients, getScansForPatient, getAllScans, type Patient, type Scan } from "@/lib/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dynamic from "next/dynamic"

const PatientRow = dynamic(
  () => import("@/components/patient-row").then((mod) => mod.PatientRow),
  { ssr: false }
)

interface PatientWithTestStatus extends Patient {
  isTested: boolean
}

export default function RecordsPage() {
  const [patients, setPatients] = useState<PatientWithTestStatus[]>([])
  const [filteredPatients, setFilteredPatients] = useState<PatientWithTestStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all")
  const [testFilter, setTestFilter] = useState<"all" | "tested" | "not-tested">("all")

  const fetchPatients = useCallback(async () => {
    try {
      const fetchedPatients = await getPatients()
      
      // Check if each patient has been tested
      const patientsWithStatus = await Promise.all(
        fetchedPatients.map(async (patient) => {
          const scans = await getScansForPatient(patient.uid)
          return {
            ...patient,
            isTested: scans.length > 0,
          }
        })
      )
      
      setPatients(patientsWithStatus)
      setFilteredPatients(patientsWithStatus)
    } catch (error) {
      console.error("[v0] Error fetching patients:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Apply filters
  useEffect(() => {
    let result = patients

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.uid.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    // Test filter
    if (testFilter === "tested") {
      result = result.filter((p) => p.isTested)
    } else if (testFilter === "not-tested") {
      result = result.filter((p) => !p.isTested)
    }

    setFilteredPatients(result)
  }, [patients, searchQuery, statusFilter, testFilter])

  const handleStatusChange = () => {
    fetchPatients()
  }

  const handleDownloadData = async (type: "temperature" | "pressure" | "heartRate" | "spo2") => {
    try {
      const allPatients = await getPatients()
      const allScans = await getAllScans()
      
      // Create patient map for quick lookup
      const patientMap = new Map<string, Patient>()
      allPatients.forEach(p => patientMap.set(p.uid, p))

      // Filter out legacy scans that might not have this new parameter
      const relevantScans = allScans.filter(scan => scan[type] !== undefined)

      let csvContent = "Username,UserID,Value,Timestamp\n"
      
      relevantScans.forEach(scan => {
        const p = patientMap.get(scan.uid)
        const username = p ? p.name : "Unknown"
        const uid = scan.uid
        const value = scan[type]
        
        let timestampStr = "Unknown"
        if (scan.timestamp) {
           // Handle both Firestore Timestamp and native Date
           const dateObj = typeof (scan.timestamp as any).toDate === 'function' 
             ? (scan.timestamp as any).toDate() 
             : new Date(scan.timestamp as Date)
             
           // Format to YYYY-MM-DD
           timestampStr = dateObj.toISOString().split('T')[0]
        }

        csvContent += `"${username}","${uid}",${value},"${timestampStr}"\n`
      })

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${type}_data.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("[v0] Error generating CSV:", error)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="neu-btn p-3 rounded-xl">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient Records</h1>
            <p className="text-sm text-muted-foreground">
              {patients.length} total patients
            </p>
          </div>
        </div>

        {/* Filters and Download */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search UID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-input pl-10 pr-4 py-3 w-full sm:w-[200px] text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="neu-input pl-10 pr-8 py-3 w-full sm:w-[150px] text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Test Filter */}
          <select
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value as typeof testFilter)}
            className="neu-input px-4 py-3 w-full sm:w-[150px] text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Tests</option>
            <option value="tested">Tested</option>
            <option value="not-tested">Not Tested</option>
          </select>

          {/* Download Data Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="neu-btn flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-accent hover:text-accent/80 transition-colors w-full lg:w-auto">
                <Download className="w-4 h-4" />
                Download Data
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuItem onClick={() => handleDownloadData("temperature")} className="cursor-pointer">
                Download Temperature Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadData("pressure")} className="cursor-pointer">
                Download Pressure Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadData("heartRate")} className="cursor-pointer">
                Download Heart Rate Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadData("spo2")} className="cursor-pointer">
                Download SpO2 Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading patient records...</p>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="neu-card p-12 text-center">
          <div className="neu-btn w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Patients Found
          </h3>
          <p className="text-muted-foreground">
            {patients.length === 0
              ? "Register your first patient to get started"
              : "No patients match your current filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <PatientRow
              key={patient.id}
              patient={patient}
              isTested={patient.isTested}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
