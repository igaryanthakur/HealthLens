import { useState } from 'react'
import UploadZone from '../components/UploadZone'
import ProcessingView from '../components/ProcessingView'
import ReportDashboard from '../components/Dashboard/Dashboard'
import { uploadReport, interpretStructured } from '../lib/api'
import { APP_STATE, normalizeStructured } from '../lib/structured'

export default function Dashboard() {
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

  if (appState === APP_STATE.PROCESSING) {
    return <ProcessingView />
  }

  if (appState === APP_STATE.RESOLVED && dashboardData) {
    return <ReportDashboard payload={dashboardData} />
  }

  return <UploadZone onFileSelected={handleFileSelected} error={error} />
}
