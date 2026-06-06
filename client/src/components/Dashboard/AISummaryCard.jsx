import { CheckCircle2, Sparkles } from 'lucide-react'

export default function AISummaryCard({ data, className = '' }) {
  const summary = data?.summary || 'No summary available.'
  const recommendations = data?.recommendations ?? []

  return (
    <div
      className={`bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-outline-variant/20 shadow-ambient p-6 md:p-8 ${className}`}
    >
      <div className="bg-surface-container-lowest/80 rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-primary" size={22} />
          <h2 className="text-lg font-semibold text-on-surface">AI Health Summary</h2>
        </div>

        <p className="text-on-surface leading-relaxed mb-6">{summary}</p>

        {recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wide">
              Recommendations
            </h3>
            <ul className="space-y-3">
              {recommendations.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-on-surface">
                  <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
