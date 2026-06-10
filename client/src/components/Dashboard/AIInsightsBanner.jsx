import { useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'

export default function AIInsightsBanner({ className = '' }) {
  const navigate = useNavigate()

  return (
    <div
      className={`relative overflow-hidden bg-teal-900 text-white rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-teal-700/40 blur-3xl"
        aria-hidden="true"
      />
      <div className="flex items-start gap-4 relative">
        <span className="h-11 w-11 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center">
          <MessageCircle size={22} className="text-teal-200" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300 mb-1">
            Ask HealthLens Assistant
          </p>
          <p className="text-sm md:text-base leading-relaxed text-teal-50 max-w-2xl">
            Have a question about your records? Ask the assistant about trends, medications, or what
            to discuss with your doctor — grounded only in your uploaded reports.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/chat')}
        className="relative shrink-0 inline-flex items-center gap-2 bg-white text-teal-900 hover:bg-teal-50 font-semibold text-sm rounded-xl px-5 py-3 transition-colors"
      >
        Open Assistant
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
