import { useEffect, useState } from 'react'
import { HeartPulse } from 'lucide-react'

const STAGES = [
  'Reading your report…',
  'Extracting biomarkers…',
  'Generating AI insights…',
]

export default function ProcessingView() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card shadow-ambient rounded-2xl p-10 max-w-lg w-full text-center border border-outline-variant/20">
        <HeartPulse className="mx-auto text-primary mb-6 animate-pulse" size={48} />
        <h2 className="text-xl font-semibold text-on-surface mb-2">Analyzing your report</h2>
        <p className="text-on-surface-variant text-sm mb-8">{STAGES[stageIndex]}</p>

        <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-1/3 progress-indeterminate" />
        </div>
      </div>
    </div>
  )
}
