import { useState } from 'react'
import { HeartPulse } from 'lucide-react'
import UploadZone from './components/UploadZone'
import ProcessingView from './components/ProcessingView'
import Dashboard from './components/Dashboard/Dashboard'
import { uploadReport, interpretStructured } from './lib/api'

const APP_STATE = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
}

function normalizeStructured(structured) {
  if (!structured) return structured

  return {
    ...structured,
    measurements: (structured.measurements ?? []).map((m) => ({
      ...m,
      value: m.normalizedValue ?? (m.rawValue != null ? Number(m.rawValue) : null),
      unit: m.unit ?? m.normalizedUnit,
      referenceRange: m.referenceRange,
    })),
  }
}

function AppHeader() {
  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center gap-2">
        <HeartPulse className="text-primary" size={28} />
        <span className="font-semibold text-primary text-lg">HealthLens AI</span>
      </div>
    </header>
  )
}

export default function App() {
  const [appState, setAppState] = useState(APP_STATE.IDLE)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)

  async function handleFileSelected(file) {
    setError(null)
    setAppState(APP_STATE.PROCESSING)

    try {
      const uploadJson = await uploadReport(file)
      const interpretJson = await interpretStructured(uploadJson.structured)

      setDashboardData({
        success: true,
        data: interpretJson.data,
        structured: normalizeStructured(uploadJson.structured),
      })
      setAppState(APP_STATE.RESOLVED)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setAppState(APP_STATE.IDLE)
    }
  }

  return (
    <>
      <AppHeader />

      {appState === APP_STATE.IDLE && (
        <UploadZone onFileSelected={handleFileSelected} error={error} />
      )}

      {appState === APP_STATE.PROCESSING && <ProcessingView />}

      {appState === APP_STATE.RESOLVED && dashboardData && (
        <Dashboard payload={dashboardData} />
      )}
    </>
  )
}
