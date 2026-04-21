"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Play, Square, User, Activity, Waves, Ruler, ArrowLeft, Sliders, Zap, Layers, Map as MapIcon } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { saveScan, type Patient } from "@/lib/firebase"
import { MetricCard } from "./metric-card"
import { SensorAnimation } from "./sensor-animation"
import { StatusIndicator } from "./status-indicator"
import mqtt from "mqtt"

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
  
  // Real-time sensor state variables as requested
  const [distance, setDistance] = useState(0)
  const [frequency, setFrequency] = useState(0)
  const [gain, setGain] = useState(0)
  const [chi, setChi] = useState(0)
  const [dr, setDr] = useState(0)

  // Static defined values
  const sa = "3/4"
  const map = "A/0"

  const mqttClientRef = useRef<mqtt.MqttClient | null>(null)
  const startTimeRef = useRef<number>(0)

  const startScanning = () => {
    setIsScanning(true)
    setScanData([])
    startTimeRef.current = Date.now()

    // Connect to HiveMQ using WebSocket
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt", { 
        reconnectPeriod: 1000, // automatic reconnect
    })
    mqttClientRef.current = client

    client.on("connect", () => {
      console.log("[v0] Connected to MQTT broker. Subscribing to marma/distance...")
      client.subscribe("marma/distance")
    })
    
    // Auto reconnect handlers
    client.on("reconnect", () => {
      console.log("[v0] Reconnecting to MQTT broker...")
    })
    
    client.on("close", () => {
      console.log("[v0] Disconnected from MQTT broker.")
    })

    client.on("message", (topic, message) => {
      try {
        const data = JSON.parse(message.toString())
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

        // Update exact state variables
        setDistance(data.distance || 0)
        setFrequency(data.frequency || 0)
        setGain(data.gain || 0)
        setChi(data.chi || 0)
        setDr(data.dr || 0)

        setScanData((prev) => {
          const newData = [
            ...prev,
            {
              time: elapsedTime,
              distance: parseFloat((data.distance || 0).toFixed(2)),
              frequency: parseFloat((data.frequency || 0).toFixed(2)),
            },
          ]
          // Keep only last 20 data points for the graph
          return newData.slice(-20)
        })
      } catch (error) {
        console.error("[v0] Error parsing MQTT message:", error)
      }
    })
  }


  const stopScanning = async () => {
    if (mqttClientRef.current) {
      mqttClientRef.current.end()
      mqttClientRef.current = null
    }
    setIsScanning(false)
    setIsSaving(true)

    try {
      await saveScan({
        uid: patient.uid,
        distance: distance,
        frequency: frequency,
        chi: chi.toString(),
        temperature: 36.5, // Not in hardware display but needed for DB schema
        gain: gain,
        dr: dr,
        sa: sa,
        map: map,
      })
      router.push("/records")
    } catch (error) {
      console.error("[v0] Error saving scan:", error)
      setIsSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.end()
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
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="CHI"
              value={chi}
              unit=""
              icon={<Activity className="w-5 h-5" />}
              isLive={isScanning}
              color="blue"
            />
            <MetricCard
              label="Frq"
              value={frequency}
              unit=""
              icon={<Waves className="w-5 h-5" />}
              isLive={isScanning}
              color="red"
            />
            <MetricCard
              label="Gn"
              value={gain}
              unit=""
              icon={<Zap className="w-5 h-5" />}
              isLive={isScanning}
              color="yellow"
            />
            <MetricCard
              label="S/A"
              value={sa}
              unit=""
              icon={<Layers className="w-5 h-5" />}
              isLive={false}
              color="green"
            />
            <MetricCard
              label="Map"
              value={map}
              unit=""
              icon={<MapIcon className="w-5 h-5" />}
              isLive={false}
              color="yellow"
            />
            <MetricCard
              label="D"
              value={distance}
              unit="cm"
              icon={<Ruler className="w-5 h-5" />}
              isLive={isScanning}
              color="green"
            />
            <MetricCard
              label="DR"
              value={dr}
              unit=""
              icon={<Sliders className="w-5 h-5" />}
              isLive={isScanning}
              color="blue"
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

