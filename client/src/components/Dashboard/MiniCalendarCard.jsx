import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function countAbnormal(report) {
  return (report.measurements ?? []).filter(
    (m) => m.status === 'low' || m.status === 'high',
  ).length
}

export default function MiniCalendarCard({ history = [], onSelectReport, className = '' }) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  // Map of "YYYY-M-D" -> reportId for event days.
  const eventsByDay = useMemo(() => {
    const map = new Map()
    for (const report of history) {
      const date = new Date(report.reportDate)
      if (Number.isNaN(date.getTime())) continue
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      map.set(key, report._id)
    }
    return map
  }, [history])

  const recentRecords = useMemo(
    () =>
      [...history]
        .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))
        .slice(0, 4),
    [history],
  )

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)

  function shiftMonth(delta) {
    setCursor(new Date(year, month + delta, 1))
  }

  function handleDayClick(day) {
    const key = `${year}-${month}-${day}`
    const reportId = eventsByDay.get(key)
    if (reportId && onSelectReport) onSelectReport(reportId)
  }

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />

          const key = `${year}-${month}-${day}`
          const hasEvent = eventsByDay.has(key)
          const isToday = sameDay(new Date(year, month, day), today)

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!hasEvent}
              className={[
                'relative h-9 w-full rounded-full text-sm flex items-center justify-center transition-colors',
                isToday ? 'bg-teal-700 text-white font-semibold' : 'text-slate-700',
                !isToday && hasEvent
                  ? 'ring-2 ring-teal-500 ring-inset font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer'
                  : '',
                !isToday && !hasEvent ? 'hover:bg-slate-50' : '',
              ].join(' ')}
              title={hasEvent ? 'Health record on this day' : undefined}
            >
              {day}
              {hasEvent && !isToday && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-teal-600" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full ring-2 ring-teal-500 ring-inset" /> Record
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2.5">
          Recent Records
        </h4>
        {recentRecords.length === 0 ? (
          <p className="text-xs text-slate-400">No records yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {recentRecords.map((report) => {
              const abnormal = countAbnormal(report)
              return (
                <li key={report._id}>
                  <button
                    type="button"
                    onClick={() => onSelectReport && onSelectReport(report._id)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-slate-400 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-slate-700 group-hover:text-teal-700 transition-colors truncate">
                          {report.reportType || 'Report'}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatShortDate(report.reportDate)}
                        </span>
                      </span>
                    </span>
                    {abnormal > 0 ? (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                        {abnormal} flagged
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Clear
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
