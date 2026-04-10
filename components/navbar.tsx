"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, UserPlus, FileText, User, Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Marma</h1>
              <p className="text-xs text-muted-foreground">Diagnostic</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                isActive("/") && pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              New Patient
            </Link>
            <Link
              href="/records"
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                isActive("/records")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <FileText className="h-4 w-4" />
              Records
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Doctor Profile - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Dr. Profile</p>
                <p className="text-xs text-muted-foreground">Practitioner</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 py-3 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md font-medium text-sm transition-all ${
                  isActive("/") && pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  New Patient
                </span>
              </Link>
              <Link
                href="/records"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md font-medium text-sm transition-all ${
                  isActive("/records")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Records
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
