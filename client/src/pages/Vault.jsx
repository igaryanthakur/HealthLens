import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchReportHistory } from '../lib/api'

function formatReportDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Vault() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-on-surface">Health Vault</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Your personal archive of processed health reports.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-error text-center py-24">{error}</p>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-24 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-ambient">
            <p className="text-on-surface-variant mb-4">No reports in your vault yet.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-lg bg-primary text-on-primary px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Upload your first report
            </Link>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Date</th>
                    <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Type</th>
                    <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Vitality Score</th>
                    <th className="text-right px-6 py-3 font-medium text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...reports].reverse().map((report) => (
                    <tr
                      key={report._id}
                      className="border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-low/50"
                    >
                      <td className="px-6 py-4 text-on-surface">{formatReportDate(report.reportDate)}</td>
                      <td className="px-6 py-4 text-on-surface">{report.reportType || 'Report'}</td>
                      <td className="px-6 py-4 text-on-surface">{report.vitalityScore ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard?reportId=${report._id}`)}
                          className="inline-flex items-center rounded-lg border border-outline-variant/40 bg-white text-primary px-3 py-1.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                        >
                          View Dashboard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
