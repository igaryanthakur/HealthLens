import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ProcessingView from '../components/ProcessingView'
import ReportDashboard from '../components/Dashboard/Dashboard'
import { fetchReportHistory, uploadReport, interpretStructured } from '../lib/api'
import { APP_STATE, normalizeStructured, reportToDashboardPayload } from '../lib/structured'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reportId = searchParams.get('reportId')

  const [appState, setAppState] = useState(APP_STATE.IDLE)
  const [history, setHistory] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = useCallback(async () => {
    const json = await fetchReportHistory()
    setHistory(json.reports ?? [])
    return json.reports ?? []
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initHistory() {
      setLoadingHistory(true)
      setError(null)

      try {
        await loadHistory()
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load report history.')
      } finally {
        if (!cancelled) setLoadingHistory(false)
      }
    }

    initHistory()

    return () => {
      cancelled = true
    }
  }, [loadHistory])

  useEffect(() => {
    if (loadingHistory) return

    if (history.length === 0) {
      setDashboardData(null)
      setAppState(APP_STATE.IDLE)
      return
    }

    const selected = reportId
      ? history.find((r) => String(r._id) === reportId)
      : history[history.length - 1]

    if (selected) {
      setDashboardData(reportToDashboardPayload(selected))
      setAppState(APP_STATE.RESOLVED)
      setError(null)
    } else if (reportId) {
      setError('Report not found.')
      setDashboardData(null)
      setAppState(APP_STATE.IDLE)
    }
  }, [history, reportId, loadingHistory])

  function handleTimelineSelect(id) {
    setSearchParams({ reportId: id })
  }

  async function handleFileSelected(file) {
    setError(null)
    setAppState(APP_STATE.PROCESSING)

    try {
      const uploadJson = await uploadReport(file)
      const interpretJson = await interpretStructured(uploadJson.structured)

      await loadHistory()
      setSearchParams({ reportId: interpretJson.reportId })

      setDashboardData({
        _id: interpretJson.reportId,
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

  if (loadingHistory && appState !== APP_STATE.PROCESSING) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (appState === APP_STATE.PROCESSING) {
    return <ProcessingView />
  }

  if (appState === APP_STATE.RESOLVED && dashboardData) {
    return (
      <ReportDashboard
        payload={dashboardData}
        history={history}
        activeReportId={dashboardData._id}
        onSelectReport={handleTimelineSelect}
      />
    )
  }

  return <UploadZone onFileSelected={handleFileSelected} error={error} />
}
