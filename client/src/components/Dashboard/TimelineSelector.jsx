import { Activity } from 'lucide-react'

function formatTimelineDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TimelineSelector({ history = [], activeReportId, onSelectReport }) {
  if (history.length <= 1) return null

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-ambient p-4 mb-6 print:hidden">
      <h3 className="text-sm font-semibold text-on-surface mb-3">Report Timeline</h3>

      <div className="flex overflow-x-auto gap-4 scrollbar-hide">
        {history.map((report) => {
          const isActive = String(report._id) === String(activeReportId)

          return (
            <button
              key={report._id}
              type="button"
              onClick={() => onSelectReport(report._id)}
              className={`shrink-0 rounded-xl px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive && <Activity size={14} className="shrink-0" />}
                <p className="text-sm font-semibold">{formatTimelineDate(report.reportDate)}</p>
              </div>
              <p
                className={`text-xs mt-0.5 ${isActive ? 'text-on-primary/90' : 'text-on-surface-variant'}`}
              >
                {report.reportType || 'Report'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
