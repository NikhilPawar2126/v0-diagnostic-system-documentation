import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: 'Marma Diagnostic System',
  description: 'Medical sensor diagnostic system for healthcare professionals. Register patients, perform live sensor scans, and manage patient records.',
  keywords: ['medical', 'diagnostic', 'sensor', 'healthcare', 'patient management'],
}

export const viewport: Viewport = {
  themeColor: '#e0e5ec',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}>
        <Navbar />
        <main className="pb-8">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
