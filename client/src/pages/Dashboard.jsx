import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ProcessingView from '../components/ProcessingView'
import ReviewExtraction from '../components/ReviewExtraction'
import ReportDashboard from '../components/Dashboard/Dashboard'
import {
  fetchReportHistory,
  uploadReport,
  interpretStructured,
  saveReviewedDocument,
} from '../lib/api'
import { APP_STATE, normalizeStructured, reportToDashboardPayload } from '../lib/structured'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reportId = searchParams.get('reportId')

  const [appState, setAppState] = useState(APP_STATE.IDLE)
  const [history, setHistory] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [aiUnavailableNotice, setAiUnavailableNotice] = useState(null)
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

  async function handleFileSelected(file, documentType = 'auto') {
    if (appState === APP_STATE.PROCESSING) return

    setError(null)
    setAiUnavailableNotice(null)
    setAppState(APP_STATE.PROCESSING)

    try {
      const uploadJson = await uploadReport(file, documentType)

      const resolvedDocType = uploadJson.structured?.documentType
      if (resolvedDocType && resolvedDocType !== 'lab_report') {
        setReviewData(uploadJson.structured)
        setAppState(APP_STATE.REVIEW)
        return
      }

      const interpretJson = await interpretStructured(uploadJson.structured)

      await loadHistory()
      setSearchParams({ reportId: interpretJson.reportId })

      if (interpretJson.aiUnavailable) {
        setAiUnavailableNotice(
          'AI interpretation is temporarily unavailable. Your structured report data was still saved.',
        )
      }

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

  async function handleConfirmDocument(payload) {
    setError(null)
    setSaving(true)

    try {
      const json = await saveReviewedDocument(payload)
      await loadHistory()
      setReviewData(null)
      setSearchParams({ reportId: json.reportId })
    } catch (err) {
      setError(err.message || 'Failed to save the document. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelReview() {
    setReviewData(null)
    setError(null)
    setAppState(APP_STATE.IDLE)
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

  if (appState === APP_STATE.REVIEW && reviewData) {
    return (
      <ReviewExtraction
        structured={reviewData}
        documentType={reviewData.documentType}
        onConfirm={handleConfirmDocument}
        onCancel={handleCancelReview}
        saving={saving}
        error={error}
      />
    )
  }

  if (appState === APP_STATE.RESOLVED && dashboardData) {
    return (
      <>
        {aiUnavailableNotice && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm text-center py-2 px-4">
            {aiUnavailableNotice}
          </div>
        )}
        <ReportDashboard
          payload={dashboardData}
          history={history}
          activeReportId={dashboardData._id}
          onSelectReport={handleTimelineSelect}
        />
      </>
    )
  }

  return (
    <UploadZone
      onFileSelected={handleFileSelected}
      error={error}
      disabled={appState === APP_STATE.PROCESSING}
    />
  )
}
