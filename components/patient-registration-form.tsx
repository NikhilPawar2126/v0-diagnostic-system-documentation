"use client"

import { useState } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { createPatient, type Patient } from "@/lib/firebase"
import { UIDOverlay } from "./uid-overlay"

interface FormData {
  name: string
  gender: string
  age: string
  dob: string
  doctor: string
  diagnosis: string
  reference: string
  mobile: string
}

const initialFormData: FormData = {
  name: "",
  gender: "",
  age: "",
  dob: "",
  doctor: "",
  diagnosis: "",
  reference: "",
  mobile: "",
}

export function PatientRegistrationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name || !formData.gender || !formData.age || !formData.dob || !formData.doctor) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const patient = await createPatient({
        name: formData.name,
        gender: formData.gender,
        age: parseInt(formData.age, 10),
        dob: formData.dob,
        doctor: formData.doctor,
        diagnosis: formData.diagnosis,
        reference: formData.reference,
        mobile: formData.mobile,
      })
      setRegisteredPatient(patient)
    } catch (err: unknown) {
      console.error("[v0] Error creating patient:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      if (errorMessage.includes("Missing or insufficient permissions")) {
        setError("Firebase permissions error. Please ensure Firestore rules allow read/write access.")
      } else if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("permission-denied")) {
        setError("Firebase permissions denied. Please check your Firestore security rules.")
      } else if (errorMessage.includes("not-found") || errorMessage.includes("NOT_FOUND")) {
        setError("Firebase project not found. Please verify your project ID.")
      } else {
        setError(`Failed to register patient: ${errorMessage}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseOverlay = () => {
    setRegisteredPatient(null)
    setFormData(initialFormData)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Name & Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter patient name"
              className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-foreground">
              Gender <span className="text-destructive">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="neu-input w-full px-4 py-3 text-foreground appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Row 2: Age & DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="age" className="block text-sm font-medium text-foreground">
              Age <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter age"
              min="0"
              max="150"
              className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dob" className="block text-sm font-medium text-foreground">
              Date of Birth <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="neu-input w-full px-4 py-3 text-foreground"
              required
            />
          </div>
        </div>

        {/* Row 3: Referring Doctor */}
        <div className="space-y-2">
          <label htmlFor="doctor" className="block text-sm font-medium text-foreground">
            Referring Doctor <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="doctor"
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            placeholder="Enter referring doctor name"
            className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>

        {/* Row 4: Presumptive Diagnosis */}
        <div className="space-y-2">
          <label htmlFor="diagnosis" className="block text-sm font-medium text-foreground">
            Presumptive Diagnosis
          </label>
          <textarea
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder="Enter diagnosis notes"
            rows={3}
            className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        {/* Row 5: Reference & Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="reference" className="block text-sm font-medium text-foreground">
              Reference ID
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Optional reference ID"
              className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="mobile" className="block text-sm font-medium text-foreground">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter mobile number"
              className="neu-input w-full px-4 py-3 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="neu-card-inset p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="neu-btn w-full px-6 py-4 flex items-center justify-center gap-3 text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Registering Patient...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Save & Generate UID
            </>
          )}
        </button>
      </form>

      {/* Success Overlay */}
      {registeredPatient && (
        <UIDOverlay
          uid={registeredPatient.uid}
          patientName={registeredPatient.name}
          onClose={handleCloseOverlay}
        />
      )}
    </>
  )
}
