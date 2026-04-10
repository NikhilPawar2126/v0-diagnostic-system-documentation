"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Play, Square, User, Activity, Waves, Ruler, Thermometer, ArrowLeft } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { saveScan, type Patient } from "@/lib/firebase"
import { MetricCard } from "./metric-card"
import { SensorAnimation } from "./sensor-animation"
import { StatusIndicator } from "./status-indicator"

interface ScanPageContentProps {
  patient: Patient
}

interface ScanData {
  time: number
  distance: number
  frequency: number
}

export function ScanPageContent({ patient }: ScanPageContentProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanData, setScanData] = useState<ScanData[]>([])
  const [currentMetrics, setCurrentMetrics] = useState({
    chi: 0,
    frequency: 0,
    distance: 0,
    temperature: 36.5,
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Generate simulated sensor data
  const generateMetrics = useCallback(() => {
    const baseDistance = 15
    const baseFrequency = 42
    const baseChi = 75
    const baseTemp = 36.5

    return {
      distance: baseDistance + (Math.random() - 0.5) * 4,
      frequency: baseFrequency + (Math.random() - 0.5) * 8,
      chi: baseChi + (Math.random() - 0.5) * 20,
      temperature: baseTemp + (Math.random() - 0.5) * 1,
    }
  }, [])

  const startScanning = () => {
    setIsScanning(true)
    setScanData([])
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const metrics = generateMetrics()
      const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

      setCurrentMetrics(metrics)
      setScanData((prev) => {
        const newData = [
          ...prev,
          {
            time: elapsedTime,
            distance: parseFloat(metrics.distance.toFixed(2)),
            frequency: parseFloat(metrics.frequency.toFixed(2)),
          },
        ]
        // Keep only last 20 data points for the graph
        return newData.slice(-20)
      })
    }, 1000)
  }

  const stopScanning = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsScanning(false)
    setIsSaving(true)

    try {
      await saveScan({
        uid: patient.uid,
        distance: parseFloat(currentMetrics.distance.toFixed(2)),
        frequency: parseFloat(currentMetrics.frequency.toFixed(2)),
        chi: parseFloat(currentMetrics.chi.toFixed(2)),
        temperature: parseFloat(currentMetrics.temperature.toFixed(2)),
      })
      router.push("/records")
    } catch (error) {
      console.error("[v0] Error saving scan:", error)
      setIsSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/records")}
        className="neu-btn px-4 py-2 flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Records
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info Card */}
          <div className="neu-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="neu-btn p-3 rounded-full">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{patient.name}</h2>
                <p className="text-sm text-muted-foreground">{patient.gender}</p>
              </div>
            </div>
            <div className="neu-card-inset p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Patient ID</p>
              <p className="text-2xl font-bold text-primary">{patient.uid}</p>
            </div>
          </div>

          {/* Status Card */}
          <div className="neu-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Examination Status</h3>
            <div className="neu-card-inset p-4 flex items-center justify-center">
              <StatusIndicator
                status={isScanning ? "live" : "standby"}
                size="lg"
              />
            </div>
          </div>

          {/* Control Button */}
          <div className="neu-card p-6">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isSaving}
                className="neu-btn w-full py-6 flex items-center justify-center gap-3 text-accent font-semibold text-lg disabled:opacity-50"
              >
                <Play className="w-8 h-8" />
                START EXAMINING
              </button>
            ) : (
              <button
                onClick={stopScanning}
                disabled={isSaving}
                className="neu-btn w-full py-6 flex items-center justify-center gap-3 text-destructive font-semibold text-lg disabled:opacity-50"
              >
                <Square className="w-8 h-8" />
                {isSaving ? "SAVING..." : "STOP & SAVE"}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="CHI Metric"
              value={currentMetrics.chi.toFixed(1)}
              unit="%"
              icon={<Activity className="w-5 h-5" />}
              isLive={isScanning}
              color="blue"
            />
            <MetricCard
              label="Frequency"
              value={currentMetrics.frequency.toFixed(1)}
              unit="Hz"
              icon={<Waves className="w-5 h-5" />}
              isLive={isScanning}
              color="red"
            />
            <MetricCard
              label="Distance"
              value={currentMetrics.distance.toFixed(1)}
              unit="cm"
              icon={<Ruler className="w-5 h-5" />}
              isLive={isScanning}
              color="green"
            />
            <MetricCard
              label="Temperature"
              value={currentMetrics.temperature.toFixed(1)}
              unit="°C"
              icon={<Thermometer className="w-5 h-5" />}
              isLive={isScanning}
              color="yellow"
            />
          </div>

          {/* Chart and Animation */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="xl:col-span-2 neu-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Live Sensor Data</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="time"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}s`}
                    />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "none",
                        borderRadius: "var(--radius)",
                        boxShadow: "4px 4px 8px var(--neu-shadow-dark), -4px -4px 8px var(--neu-shadow-light)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="distance"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      name="Distance (cm)"
                    />
                    <Line
                      type="monotone"
                      dataKey="frequency"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      dot={false}
                      name="Frequency (Hz)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensor Animation */}
            <div className="neu-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Sensor Status</h3>
              <SensorAnimation isActive={isScanning} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
