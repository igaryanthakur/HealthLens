import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download } from 'lucide-react'
import VitalitySnapshotCard from './VitalitySnapshotCard'
import MiniCalendarCard from './MiniCalendarCard'
import NeedsAttentionCard from './NeedsAttentionCard'
import AIInsightsBanner from './AIInsightsBanner'
import TrendAnalyticsCard from './TrendAnalyticsCard'
import BiomarkerGrid from './BiomarkerGrid'
import DocumentEntitiesCard from './DocumentEntitiesCard'
import TimelineSelector from './TimelineSelector'

function getActiveReport(history, activeReportId) {
  return history.find((r) => String(r._id) === String(activeReportId)) || null
}

export default function Dashboard({ payload, history = [], activeReportId, onSelectReport }) {
  const componentRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'HealthLens_AI_Report',
  })

  if (!payload) return null

  const documentType = payload.structured?.documentType
  const isEntityDocument = Boolean(documentType) && documentType !== 'lab_report'

  const activeReport = getActiveReport(history, activeReportId)
  const measurements = payload.structured?.measurements ?? []
  const alerts = measurements.filter((m) => m.status === 'low' || m.status === 'high')
  const vitalityScore =
    typeof activeReport?.vitalityScore === 'number' ? activeReport.vitalityScore : 100
  const insight = payload.data?.recommendations?.[0] || payload.data?.summary || ''

  const greeting =
    alerts.length > 0
      ? 'Welcome back. A few markers deserve a closer look.'
      : 'Welcome back. Your vitals are trending normally.'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1440px] mx-auto px-5 py-8 md:px-10 md:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Precision Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {greeting}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => handlePrint()}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-200 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors print:hidden"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

        {/* Report switcher */}
        <TimelineSelector
          history={history}
          activeReportId={activeReportId}
          onSelectReport={onSelectReport}
        />

        <div ref={componentRef} className="space-y-8">
          {/* Top row: snapshot + calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VitalitySnapshotCard
              score={vitalityScore}
              alerts={alerts}
              history={history}
              className="lg:col-span-2"
            />
            <MiniCalendarCard
              history={history}
              onSelectReport={onSelectReport}
              className="lg:col-span-1"
            />
          </div>

          {/* Middle: attention + trend, or document entities */}
          {isEntityDocument ? (
            <DocumentEntitiesCard structured={payload.structured} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NeedsAttentionCard activeReport={activeReport} history={history} />
              <TrendAnalyticsCard history={history} />
            </div>
          )}

          {/* AI insights banner */}
          <AIInsightsBanner insight={insight} />

          {/* Full biomarker breakdown for the selected report */}
          {!isEntityDocument && measurements.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Full Report Breakdown
              </h2>
              <BiomarkerGrid measurements={measurements} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
