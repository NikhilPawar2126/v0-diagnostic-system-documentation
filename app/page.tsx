import { PatientRegistrationForm } from "@/components/patient-registration-form"
import { UserPlus } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="neu-btn w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Patient Registration
        </h1>
        <p className="text-muted-foreground">
          Register a new patient and generate a unique identifier for examination
        </p>
      </div>

      {/* Registration Card */}
      <div className="neu-card p-8">
        <PatientRegistrationForm />
      </div>
    </div>
  )
}
