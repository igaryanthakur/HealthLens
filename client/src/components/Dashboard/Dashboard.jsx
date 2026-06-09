import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import AIRecommendationCard from './AIRecommendationCard'
import BiomarkerGrid from './BiomarkerGrid'
import HealthTimelineCard from './HealthTimelineCard'
import PrescriptionCard from './PrescriptionCard'
import TimelineSelector from './TimelineSelector'
import { Download } from 'lucide-react'

export default function Dashboard({ payload, history = [], activeReportId, onSelectReport }) {
  const componentRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'HealthLens_AI_Report',
  })

  if (!payload) return null

  const isPrescription = payload.structured?.documentType === 'prescription'

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

        {history.length > 1 && onSelectReport && (
          <TimelineSelector
            history={history}
            activeReportId={activeReportId}
            onSelectReport={onSelectReport}
          />
        )}

        <div ref={componentRef} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {isPrescription ? (
            <>
              <AIRecommendationCard data={payload.data} className="md:col-span-4" />
              <PrescriptionCard structured={payload.structured} className="md:col-span-8" />
            </>
          ) : (
            <>
              <HealthTimelineCard className="md:col-span-8" />

              <AIRecommendationCard data={payload.data} className="md:col-span-4" />

              <BiomarkerGrid
                measurements={payload.structured?.measurements ?? []}
                className="md:col-span-12"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
