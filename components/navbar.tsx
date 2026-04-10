"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, UserPlus, FileText, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="neu-card mx-4 mt-4 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="neu-btn p-3 rounded-xl">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Marma Diagnostic</h1>
              <p className="text-xs text-muted-foreground">Medical Sensor System</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                isActive("/") && pathname === "/"
                  ? "neu-btn-pressed text-primary"
                  : "neu-btn text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">New Patient</span>
            </Link>
            <Link
              href="/records"
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                isActive("/records")
                  ? "neu-btn-pressed text-primary"
                  : "neu-btn text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
            </Link>
          </div>

          {/* Doctor Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">Dr. Profile</p>
              <p className="text-xs text-muted-foreground">Practitioner</p>
            </div>
            <div className="neu-btn p-3 rounded-full">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
