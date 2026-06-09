// Animated circular SVG progress ring for the Vitality Score.
export default function VitalityRing({ score = 0, size = 176, stroke = 14 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safeScore / 100)

  const rating =
    safeScore >= 85 ? 'Excellent' : safeScore >= 70 ? 'Good' : safeScore >= 50 ? 'Fair' : 'Needs care'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="vitality-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#vitality-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-slate-900 tracking-tight">{safeScore}</span>
        <span className="text-xs font-medium text-slate-400 mt-1">Vitality Score</span>
        <span className="mt-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
          {rating}
        </span>
      </div>
    </div>
  )
}
