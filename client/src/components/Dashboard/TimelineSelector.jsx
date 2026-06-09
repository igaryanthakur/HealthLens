import { FileText } from 'lucide-react'

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
    <div className="mb-8 print:hidden">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={15} className="text-slate-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your Reports
        </h3>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
        {history.map((report) => {
          const isActive = String(report._id) === String(activeReportId)

          return (
            <button
              key={report._id}
              type="button"
              onClick={() => onSelectReport(report._id)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-left border transition-all ${
                isActive
                  ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-teal-200 hover:bg-teal-50/40'
              }`}
            >
              <p className="text-sm font-semibold">{formatTimelineDate(report.reportDate)}</p>
              <p className={`text-xs mt-0.5 ${isActive ? 'text-teal-50' : 'text-slate-400'}`}>
                {report.reportType || 'Report'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
