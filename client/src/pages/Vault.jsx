import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  FileText,
  ListFilter,
  Loader2,
  Search,
  Stethoscope,
  Trash2,
} from 'lucide-react'
import { deleteReport, fetchReportHistory } from '../lib/api'

function formatReportDateLong(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDateParts(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { day: '—', month: '—' }
  }
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

function reportNeedsAttention(report) {
  return (report.measurements ?? []).some(
    (m) => m.status === 'low' || m.status === 'high',
  )
}

function countAbnormalMeasurements(report) {
  return (report.measurements ?? []).filter(
    (m) => m.status === 'low' || m.status === 'high',
  ).length
}

function getReportTitle(report) {
  if (report.documentType === 'prescription') return 'Prescription'
  if (report.documentType && report.documentType !== 'lab_report') {
    return report.documentType
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  return report.reportType || 'Report'
}

export default function Vault() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setLoading(true)
      setError(null)

      try {
        const json = await fetchReportHistory()
        if (!cancelled) setReports(json.reports ?? [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load report history.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [])

  const attentionCount = useMemo(
    () => reports.filter(reportNeedsAttention).length,
    [reports],
  )

  const latestReportDate = useMemo(() => {
    if (reports.length === 0) return '—'
    const sorted = [...reports].sort(
      (a, b) => new Date(b.reportDate) - new Date(a.reportDate),
    )
    return formatReportDateLong(sorted[0].reportDate)
  }, [reports])

  const displayedReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let list = [...reports]

    list.sort((a, b) => {
      const diff = new Date(a.reportDate) - new Date(b.reportDate)
      return sortDesc ? -diff : diff
    })

    if (!query) return list

    return list.filter((report) => {
      const title = (report.reportType || 'Report').toLowerCase()
      const date = formatReportDateLong(report.reportDate).toLowerCase()
      return title.includes(query) || date.includes(query)
    })
  }, [reports, searchQuery, sortDesc])

  function openReport(reportId) {
    navigate(`/dashboard?reportId=${reportId}`)
  }

  async function handleDeleteReport(e, report) {
    e.stopPropagation()

    const title = getReportTitle(report)
    const date = formatReportDateLong(report.reportDate)
    const confirmed = window.confirm(
      `Delete "${title}" from ${date}? This will remove it from your vault, repository, and timeline. This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(report._id)
    setError(null)

    try {
      await deleteReport(report._id)
      setReports((prev) => prev.filter((r) => r._id !== report._id))
    } catch (err) {
      setError(err.message || 'Failed to delete report.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleCardKeyDown(event, reportId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openReport(reportId)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-[1280px] mx-auto px-margin-desktop pb-20">
        <header className="pt-12 mb-8">
          <h2 className="text-4xl font-semibold text-[#0b1c30] tracking-tight mb-2">
            Your Health Vault
          </h2>
          <p className="text-[#3d4947] text-lg font-body-lg">
            A complete, chronological archive of your medical history and AI analyses.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-ambient flex items-center gap-4 border border-outline-variant/10">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <FileText />
            </div>
            <div>
              <p className="text-on-surface font-semibold text-xl">
                {loading ? '—' : `${reports.length} Total Records`}
              </p>
              <p className="text-label-sm text-outline">Stored securely</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-ambient flex items-center gap-4 border border-outline-variant/10">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <CalendarClock />
            </div>
            <div>
              <p className="text-on-surface font-semibold text-xl">
                {loading ? '—' : latestReportDate}
              </p>
              <p className="text-label-sm text-outline">Last record upload</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-ambient flex items-center gap-4 border border-outline-variant/10">
            <div className="w-12 h-12 bg-tertiary/10 rounded-full flex items-center justify-center text-tertiary">
              <Activity />
            </div>
            <div>
              <p className="text-on-surface font-semibold text-xl">
                {loading ? '—' : `${attentionCount} Flagged`}
              </p>
              <p className="text-label-sm text-outline">Reports needing attention</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
              placeholder="Search by test type or date..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/doctor-summary')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-label-md hover:opacity-90 transition-all"
            >
              <Stethoscope size={20} />
              Doctor Summary
            </button>
            <button
              type="button"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-outline-variant rounded-full text-on-surface-variant font-label-md hover:bg-surface-variant/30 transition-all"
            >
              <ListFilter size={20} />
              Filter
            </button>
            <button
              type="button"
              onClick={() => setSortDesc((prev) => !prev)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-outline-variant rounded-full text-on-surface-variant font-label-md hover:bg-surface-variant/30 transition-all"
            >
              <ArrowUpDown size={20} />
              Sort
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-error text-center py-24">{error}</p>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border border-outline-variant/10 shadow-ambient">
              <p className="text-on-surface-variant mb-4">No reports in your vault yet.</p>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-full bg-primary text-on-primary px-8 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                Upload your first report
              </Link>
            </div>
          )}

          {!loading &&
            !error &&
            reports.length > 0 &&
            displayedReports.length === 0 && (
              <div className="text-center py-24 bg-white rounded-2xl border border-outline-variant/10 shadow-ambient">
                <p className="text-on-surface-variant">No records match your search.</p>
              </div>
            )}

          {!loading &&
            !error &&
            displayedReports.map((report) => {
              const needsAttention = reportNeedsAttention(report)
              const abnormalCount = countAbnormalMeasurements(report)
              const biomarkerCount = (report.measurements ?? []).length
              const { day, month } = getDateParts(report.reportDate)
              const title = getReportTitle(report)
              const isDeleting = deletingId === report._id

              if (needsAttention) {
                return (
                  <div
                    key={report._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openReport(report._id)}
                    onKeyDown={(e) => handleCardKeyDown(e, report._id)}
                    className="group relative bg-white rounded-2xl p-4 border border-error/10 shadow-ambient flex items-center gap-6 cursor-pointer hover:border-error/30 transition-all hover:bg-error-container/10 active:scale-[0.99]"
                  >
                    <div className="w-16 h-16 bg-error-container/50 rounded-xl flex flex-col items-center justify-center text-error shrink-0">
                      <span className="text-2xl font-bold leading-none">{day}</span>
                      <span className="text-xs font-semibold uppercase">{month}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-on-surface group-hover:text-error transition-colors">
                        {title}
                      </h4>
                      <p className="text-on-surface-variant text-sm flex items-center gap-1.5">
                        <AlertTriangle className="text-secondary" size={16} />
                        Analyzed by HealthLens AI • {abnormalCount} High Value
                        {abnormalCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden md:inline-flex px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">
                        Attention Needed
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReport(e, report)}
                        disabled={isDeleting}
                        aria-label={`Delete ${title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={report._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openReport(report._id)}
                  onKeyDown={(e) => handleCardKeyDown(e, report._id)}
                  className="group relative bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-ambient flex items-center gap-6 cursor-pointer hover:border-primary/30 transition-all hover:bg-surface-bright active:scale-[0.99]"
                >
                  <div className="w-16 h-16 bg-primary-fixed/30 rounded-xl flex flex-col items-center justify-center text-primary-container shrink-0">
                    <span className="text-2xl font-bold leading-none">{day}</span>
                    <span className="text-xs font-semibold uppercase">{month}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">
                      {title}
                    </h4>
                    <p className="text-on-surface-variant text-sm flex items-center gap-1.5">
                      <BadgeCheck size={16} />
                      Analyzed by HealthLens AI • {biomarkerCount} Biomarker
                      {biomarkerCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden md:inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                      Stable
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteReport(e, report)}
                      disabled={isDeleting}
                      aria-label={`Delete ${title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                    <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
        </div>

      </div>
    </main>
  )
}
