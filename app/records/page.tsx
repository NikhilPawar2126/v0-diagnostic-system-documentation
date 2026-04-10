"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Filter, Loader2, FileText, Users } from "lucide-react"
import { getPatients, getScansForPatient, type Patient } from "@/lib/firebase"
import { PatientRow } from "@/components/patient-row"

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
      console.log("[v0] Fetching patients from Firebase...")
      const fetchedPatients = await getPatients()
      console.log("[v0] Fetched patients:", fetchedPatients.length, fetchedPatients)
      
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
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
