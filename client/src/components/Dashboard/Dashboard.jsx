import AISummaryCard from './AISummaryCard'
import BiomarkerGrid from './BiomarkerGrid'
import HealthTimelineCard from './HealthTimelineCard'
import { CircleCheckBig } from 'lucide-react'

export default function Dashboard({ payload }) {
  if (!payload) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <HealthTimelineCard className="md:col-span-12" />

          <AISummaryCard data={payload.data} className="md:col-span-8" />

          <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-ambient p-6 flex flex-col justify-center">
            <CircleCheckBig className="text-primary mb-3" size={32} />
            <h3 className="font-semibold text-on-surface mb-1">Analysis Complete</h3>
            <p className="text-sm text-on-surface-variant">
              {payload.structured?.reportType
                ? `${payload.structured.reportType} report processed`
                : 'Your report has been processed'}
            </p>
            {payload.structured?.patient_info?.reportDate && (
              <p className="text-xs text-on-surface-variant mt-2">
                Report date: {payload.structured.patient_info.reportDate}
              </p>
            )}
          </div>

          <BiomarkerGrid
            measurements={payload.structured?.measurements ?? []}
            className="md:col-span-12"
          />
        </div>
      </div>
    </div>
  )
}
