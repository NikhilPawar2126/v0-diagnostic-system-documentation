"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Play, Square, Save, User, Activity, ArrowLeft, Thermometer, Gauge, Wind } from "lucide-react"
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
  temperature: number
  pressure: number
}

export function ScanPageContent({ patient }: ScanPageContentProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanData, setScanData] = useState<ScanData[]>([])
  
  // Real-time sensor state variables
  const [temperature, setTemperature] = useState(0)
  const [pressure, setPressure] = useState(0)
  const [heartRate, setHeartRate] = useState(0)
  const [spo2, setSpo2] = useState(0)

  const mqttClientRef = useRef<mqtt.MqttClient | null>(null)
  const startTimeRef = useRef<number>(0)

  const startScanning = () => {
    setIsScanning(true)
    setScanData([])
    startTimeRef.current = Date.now()

    // Connect to HiveMQ using wss for secure WebSocket
    const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", { 
        reconnectPeriod: 1000, // automatic reconnect
    })
    mqttClientRef.current = client

    client.on("connect", () => {
      console.log("[v0] Connected to MQTT broker. Subscribing to marma/data...")
      client.subscribe("marma/data")
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

        // Ensure we parse safely, defaulting to 0
        const currentTemp = parseFloat(data.temperature) || 0
        const currentPressure = parseFloat(data.pressure) || 0
        const currentHR = parseFloat(data.heartRate) || 0
        const currentSpo2 = parseFloat(data.spo2) || 0

        // Update exact state variables
        setTemperature(currentTemp)
        setPressure(currentPressure)
        setHeartRate(currentHR)
        setSpo2(currentSpo2)

        setScanData((prev) => {
          const newData = [
            ...prev,
            {
              time: elapsedTime,
              temperature: parseFloat(currentTemp.toFixed(2)),
              pressure: parseFloat(currentPressure.toFixed(2)),
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


  const stopScanning = () => {
    if (mqttClientRef.current) {
      mqttClientRef.current.end()
      mqttClientRef.current = null
    }
    setIsScanning(false)
  }

  const saveData = async () => {
    setIsSaving(true)
    try {
      await saveScan({
        uid: patient.uid,
        temperature: temperature,
        pressure: pressure,
        heartRate: heartRate,
        spo2: spo2,
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

          {/* Control Buttons */}
          <div className="neu-card p-6 space-y-4">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isSaving}
                className="neu-btn w-full py-4 flex items-center justify-center gap-3 text-accent font-semibold text-lg disabled:opacity-50"
              >
                <Play className="w-8 h-8" />
                START EXAMINING
              </button>
            ) : (
              <button
                onClick={stopScanning}
                disabled={isSaving}
                className="neu-btn w-full py-4 flex items-center justify-center gap-3 text-destructive font-semibold text-lg disabled:opacity-50"
              >
                <Square className="w-8 h-8" />
                STOP EXAMINING
              </button>
            )}

            <button
              onClick={saveData}
              disabled={isScanning || isSaving}
              className="neu-btn w-full py-4 flex items-center justify-center gap-3 text-primary font-semibold text-lg disabled:opacity-50"
            >
              <Save className="w-6 h-6" />
              {isSaving ? "SAVING..." : "SAVE SCAN"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Temp"
              value={temperature}
              unit="°C"
              icon={<Thermometer className="w-5 h-5" />}
              isLive={isScanning}
              color="red"
            />
            <MetricCard
              label="Pressure"
              value={pressure}
              unit=""
              icon={<Gauge className="w-5 h-5" />}
              isLive={isScanning}
              color="blue"
            />
            <MetricCard
              label="HR (Paused)"
              value={0}
              unit="bpm"
              icon={<Activity className="w-5 h-5" />}
              isLive={false}
              color="green"
            />
            <MetricCard
              label="SpO2 (Paused)"
              value={0}
              unit="%"
              icon={<Wind className="w-5 h-5" />}
              isLive={false}
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
                      dataKey="temperature"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      dot={false}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="pressure"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      name="Pressure"
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

