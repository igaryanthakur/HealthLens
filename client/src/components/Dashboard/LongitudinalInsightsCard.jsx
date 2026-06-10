import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

function GeneratedBadge({ generatedBy }) {
  const isAi = generatedBy === 'ai'
  return (
    <span
      className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        isAi ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      <Sparkles size={11} />
      {isAi ? 'AI generated' : 'Deterministic fallback'}
    </span>
  )
}

function InsightList({ icon: Icon, title, items, tone }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className={tone} />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.replace('text-', 'bg-')}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Shell({ children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-10 w-10 shrink-0 rounded-2xl bg-teal-50 flex items-center justify-center">
          <TrendingUp size={20} className="text-teal-700" />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">
          What Changed Since Your Last Report?
        </h2>
      </div>
      {children}
    </div>
  )
}

export default function LongitudinalInsightsCard({
  insights,
  loading = false,
  error = null,
  labReportCount = 0,
}) {
  if (loading && !insights) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-slate-500 py-6">
          <Loader2 size={18} className="animate-spin text-teal-600" />
          <span className="text-sm">Analyzing your health timeline...</span>
        </div>
      </Shell>
    )
  }

  if (labReportCount < 2 && !insights) {
    return (
      <Shell>
        <div className="text-center py-6">
          <p className="text-sm text-slate-600">
            Upload another lab report to unlock trend-based health intelligence.
          </p>
        </div>
      </Shell>
    )
  }

  if (error && !insights) {
    return (
      <Shell>
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Longitudinal insights are temporarily unavailable. Your dashboard and reports are still
            available.
          </p>
        </div>
      </Shell>
    )
  }

  if (!insights) return null

  const {
    summary,
    improvingSignals = [],
    needsAttention = [],
    doctorQuestions = [],
    followUpSuggestions = [],
    disclaimer,
    generatedBy,
  } = insights

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-10 w-10 shrink-0 rounded-2xl bg-teal-50 flex items-center justify-center">
          <TrendingUp size={20} className="text-teal-700" />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">
          What Changed Since Your Last Report?
        </h2>
        <GeneratedBadge generatedBy={generatedBy} />
      </div>

      {summary && (
        <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-6">{summary}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InsightList
          icon={ArrowUpRight}
          title="Improving"
          items={improvingSignals}
          tone="text-emerald-600"
        />
        <InsightList
          icon={AlertTriangle}
          title="Needs Attention"
          items={needsAttention}
          tone="text-orange-600"
        />
        <InsightList
          icon={HelpCircle}
          title="Questions for Your Doctor"
          items={doctorQuestions}
          tone="text-teal-600"
        />
        <InsightList
          icon={Activity}
          title="Suggested Follow-Up"
          items={followUpSuggestions}
          tone="text-slate-500"
        />
      </div>

      {disclaimer && (
        <p className="text-[11px] text-slate-400 leading-relaxed mt-6 pt-4 border-t border-slate-100">
          {disclaimer}
        </p>
      )}
    </div>
  )
}
