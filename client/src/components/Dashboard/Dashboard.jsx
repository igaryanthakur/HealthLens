import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import AISummaryCard from './AISummaryCard'
import BiomarkerGrid from './BiomarkerGrid'
import HealthTimelineCard from './HealthTimelineCard'
import { CircleCheckBig, Download } from 'lucide-react'

export default function Dashboard({ payload }) {
  const componentRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'HealthLens_AI_Report',
  })

  if (!payload) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-xl font-semibold text-on-surface">Your Health Intelligence</h2>
          <button
            type="button"
            onClick={() => handlePrint()}
            className="bg-white border border-outline-variant/50 text-primary hover:bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>

        <div ref={componentRef} className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
