import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ProcessingView from '../components/ProcessingView'
import ReviewExtraction from '../components/ReviewExtraction'
import ReportDashboard from '../components/Dashboard/Dashboard'
import {
  fetchReportHistory,
  fetchRepositoryInsights,
  getCachedInsights,
  setCachedInsights,
  clearRepositoryOverviewCache,
  uploadReport,
  interpretStructured,
  saveReviewedDocument,
} from '../lib/api'
import {
  APP_STATE,
  getDashboardSelectableHistory,
  normalizeStructured,
  reportToDashboardPayload,
} from '../lib/structured'

// Cache signature derived from the report set. Cached insights are reused only
// when this matches current history, so a re-seed / cross-tab Atlas edit / new
// report invalidates the cache even though the auth token still exists.
function computeInsightsSignature(reports = []) {
  return reports
    .map(
      (r) =>
        `${r._id}:${r.reportDate}:${r.measurements?.length ?? 0}:${r.medications?.length ?? 0}`,
    )
    .join('|')
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reportId = searchParams.get('reportId')
  // Upload mode is URL-driven (?upload=1) so it can be triggered from anywhere
  // (Navbar CTA, dashboard button) even when the user already has reports —
  // otherwise the dashboard always auto-resolves to the latest report and the
  // upload zone is unreachable.
  const uploadMode = searchParams.get('upload') === '1'

  const [appState, setAppState] = useState(APP_STATE.IDLE)
  const [history, setHistory] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [aiUnavailableNotice, setAiUnavailableNotice] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState(null)

  const loadHistory = useCallback(async () => {
    const json = await fetchReportHistory()
    setHistory(json.reports ?? [])
    return json.reports ?? []
  }, [])

  // Longitudinal insights are cached client-side keyed by a history signature.
  // A plain dashboard open/reload reuses the cache (no token-costing call) only
  // when the signature still matches; login resets the cache and uploads/saves
  // pass force, so the endpoint is hit just on login, upload, or stale data.
  const loadInsights = useCallback(async (reports = [], { force = false } = {}) => {
    const signature = computeInsightsSignature(reports)

    if (!force) {
      const cached = getCachedInsights()
      if (cached && cached.signature === signature) {
        setInsights(cached.insights ?? null)
        return
      }
    }

    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const json = await fetchRepositoryInsights()
      setInsights(json.insights ?? null)
      setCachedInsights({
        signature,
        insights: json.insights ?? null,
        generatedAt: json.generatedAt,
      })
    } catch (err) {
      setInsightsError(err.message || 'Failed to load health insights.')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initHistory() {
      setLoadingHistory(true)
      setError(null)

      try {
        const reports = await loadHistory()
        if (!cancelled) loadInsights(reports)
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
  }, [loadHistory, loadInsights])

  useEffect(() => {
    if (loadingHistory) return
    // Don't auto-resolve to a report while the user is intentionally uploading.
    if (uploadMode) return

    const selectableHistory = getDashboardSelectableHistory(history)

    if (selectableHistory.length === 0) {
      setDashboardData(null)
      setAppState(APP_STATE.IDLE)
      return
    }

    const selected = reportId
      ? selectableHistory.find((r) => String(r._id) === reportId)
      : selectableHistory[selectableHistory.length - 1]

    const resolved = selected ?? selectableHistory[selectableHistory.length - 1]

    if (resolved) {
      setDashboardData(reportToDashboardPayload(resolved))
      setAppState(APP_STATE.RESOLVED)
      setError(null)
    } else if (reportId) {
      setError('Report not found.')
      setDashboardData(null)
      setAppState(APP_STATE.IDLE)
    }
  }, [history, reportId, loadingHistory, uploadMode])

  function handleStartUpload() {
    setError(null)
    setAiUnavailableNotice(null)
    setAppState(APP_STATE.IDLE)
    setSearchParams({ upload: '1' })
  }

  function handleExitUpload() {
    setError(null)
    setSearchParams({})
  }

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

      clearRepositoryOverviewCache()
      const reports = await loadHistory()
      loadInsights(reports, { force: true })
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
      clearRepositoryOverviewCache()
      const reports = await loadHistory()
      loadInsights(reports, { force: true })
      setReviewData(null)
      // Prescriptions belong in Repository/Vault — return to the latest lab dashboard view.
      const savedIsPrescription = payload?.documentType === 'prescription'
      if (savedIsPrescription) {
        setSearchParams({})
      } else {
        setSearchParams({ reportId: json.reportId })
      }
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
    // Leave upload mode so we return to the dashboard (resolves to latest, or
    // falls back to the upload zone when there is no history yet).
    setSearchParams({})
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

  if (uploadMode) {
    return (
      <UploadZone
        onFileSelected={handleFileSelected}
        onCancel={history.length > 0 ? handleExitUpload : undefined}
        error={error}
        disabled={appState === APP_STATE.PROCESSING}
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
          onUploadNew={handleStartUpload}
          insights={insights}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
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
