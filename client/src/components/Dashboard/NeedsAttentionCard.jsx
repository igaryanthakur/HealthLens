import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldAlert, Sparkle } from 'lucide-react'
import { buildAttentionItems, countNormal, statusMeta } from '../../lib/biomarkerIntelligence'

const TONE_CLASSES = {
  orange: 'bg-orange-50 text-orange-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
}

function ChangeBadge({ change }) {
  if (!change) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
        <Sparkle size={11} />
        New finding
      </span>
    )
  }

  if (change.direction === 'flat') {
    return <span className="text-[11px] text-slate-400">No change since last report</span>
  }

  const Icon = change.direction === 'up' ? ArrowUpRight : ArrowDownRight
  const magnitude = Math.abs(Number(change.delta.toFixed(2)))
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      <Icon size={12} className={change.direction === 'up' ? 'text-orange-500' : 'text-teal-600'} />
      {magnitude} since last report
    </span>
  )
}

export default function NeedsAttentionCard({ activeReport, history = [], className = '' }) {
  const items = useMemo(
    () => buildAttentionItems(activeReport, history),
    [activeReport, history],
  )
  const normalCount = countNormal(activeReport)

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={20} className="text-teal-700" />
        <h2 className="text-lg font-semibold text-slate-900">Needs Attention</h2>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
            {items.length} flagged
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <span className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-sm font-semibold text-slate-900">All clear</p>
          <p className="text-xs text-slate-500 mt-1">
            {normalCount > 0
              ? `${normalCount} marker${normalCount === 1 ? '' : 's'} in this report are within range.`
              : 'No abnormal markers in this report.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 -my-1">
          {items.map((item, i) => {
            const meta = statusMeta(item.status)
            return (
              <li key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TONE_CLASSES[meta.tone]}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1">
                    <ChangeBadge change={item.change} />
                  </div>
                  {item.referenceRange && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Ref: {item.referenceRange}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xl font-bold text-slate-900">{item.value}</span>
                  {item.unit && <span className="text-xs text-slate-400 ml-1">{item.unit}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
