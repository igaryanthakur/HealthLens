import {
  Activity,
  ArrowUpRight,
  Droplets,
  Heart,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const trend = [38, 42, 40, 46, 44, 52, 58, 55, 63, 68, 72, 78]

function Sparkline() {
  const width = 260
  const height = 64
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const points = trend
    .map((value, index) => {
      const x = (index / (trend.length - 1)) * width
      const y = height - ((value - min) / (max - min)) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vitalityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00685f" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00685f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#vitalityFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#00685f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const biomarkers = [
  { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', status: 'Normal', icon: Droplets },
  { name: 'Vitamin D', value: '28', unit: 'ng/mL', status: 'Low', icon: Activity },
  { name: 'Cholesterol', value: '178', unit: 'mg/dL', status: 'Normal', icon: Heart },
]

function statusStyle(status) {
  if (status === 'Normal') return 'bg-primary/10 text-primary'
  return 'bg-amber-50 text-amber-700'
}

export default function ProductPreview() {
  return (
    <div className="relative">
      {/* Soft glow behind the preview */}
      <div
        className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2.5rem] bg-primary/5 blur-2xl"
        aria-hidden="true"
      />

      <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-ambient overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-outline-variant/20 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-outline-variant/50" />
          <span className="h-3 w-3 rounded-full bg-outline-variant/40" />
          <span className="h-3 w-3 rounded-full bg-outline-variant/30" />
          <div className="ml-3 flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-primary" />
            app.healthlens.ai
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
          {/* Vitality score */}
          <div className="md:col-span-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-on-surface-variant">Vitality Score</p>
                <p className="mt-1 text-4xl font-semibold text-on-surface">78</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <TrendingUp size={13} />
                +6 this month
              </span>
            </div>
            <Sparkline />
            <div className="mt-1 flex justify-between text-[11px] text-on-surface-variant">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>

          {/* AI insight */}
          <div className="rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">AI Insight</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-on-surface">
              Your vitamin D dipped below range. A short daily sunlight habit could bring it back up.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              View plan
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Biomarker row */}
          {biomarkers.map((marker) => {
            const Icon = marker.icon
            return (
              <div
                key={marker.name}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4"
              >
                <div className="flex items-center justify-between">
                  <Icon size={18} className="text-primary" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle(marker.status)}`}
                  >
                    {marker.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">{marker.name}</p>
                <p className="text-lg font-semibold text-on-surface">
                  {marker.value}
                  <span className="ml-1 text-xs font-normal text-on-surface-variant">
                    {marker.unit}
                  </span>
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating upload chip */}
      <div className="absolute -bottom-5 left-6 hidden items-center gap-2.5 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-ambient sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity size={16} />
        </span>
        <div>
          <p className="text-xs font-medium text-on-surface">Report analyzed</p>
          <p className="text-[11px] text-on-surface-variant">42 biomarkers extracted</p>
        </div>
      </div>
    </div>
  )
}
