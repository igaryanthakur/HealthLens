import { Sparkles } from 'lucide-react'

export default function AIRecommendationCard({ data, className = '' }) {
  const recommendations = data?.recommendations ?? []
  const primaryText = recommendations[0] || data?.summary || 'No recommendations available yet.'
  const additionalTips = recommendations.slice(1)

  return (
    <div
      className={`glass-card bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 border-l-4 border-l-primary shadow-ambient p-6 md:p-8 flex flex-col justify-center h-full ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-primary" size={22} />
        <h2 className="text-lg font-semibold text-on-surface">AI Recommendation</h2>
      </div>

      <p className="text-on-surface leading-relaxed font-medium">{primaryText}</p>

      {additionalTips.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-outline-variant/20 pt-4">
          {additionalTips.map((tip, index) => (
            <li key={index} className="text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
