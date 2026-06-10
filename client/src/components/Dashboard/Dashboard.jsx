import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { Download, Stethoscope } from 'lucide-react'
import VitalitySnapshotCard from './VitalitySnapshotCard'
import MiniCalendarCard from './MiniCalendarCard'
import NeedsAttentionCard from './NeedsAttentionCard'
import LongitudinalInsightsCard from './LongitudinalInsightsCard'
import AIInsightsBanner from './AIInsightsBanner'
import TrendAnalyticsCard from './TrendAnalyticsCard'
import BiomarkerGrid from './BiomarkerGrid'
import DocumentEntitiesCard from './DocumentEntitiesCard'
import TimelineSelector from './TimelineSelector'

function getActiveReport(history, activeReportId) {
  return history.find((r) => String(r._id) === String(activeReportId)) || null
}

export default function Dashboard({
  payload,
  history = [],
  activeReportId,
  onSelectReport,
  insights = null,
  insightsLoading = false,
  insightsError = null,
}) {
  const componentRef = useRef(null)
  const navigate = useNavigate()

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'HealthLens_AI_Report',
    pageStyle: `
      @page {
        size: A4;
        margin: 14mm;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white;
        }
      }
    `,
  })

  if (!payload) return null

  const documentType = payload.structured?.documentType
  const isEntityDocument = Boolean(documentType) && documentType !== 'lab_report'

  const activeReport = getActiveReport(history, activeReportId)
  const labReportCount = history.filter(
    (r) => !r.documentType || r.documentType === 'lab_report',
  ).length
  const measurements = payload.structured?.measurements ?? []
  const alerts = measurements.filter((m) => m.status === 'low' || m.status === 'high')
  const vitalityScore =
    typeof activeReport?.vitalityScore === 'number' ? activeReport.vitalityScore : 100

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
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto print:hidden">
            <button
              type="button"
              onClick={() => navigate('/doctor-summary')}
              className="inline-flex items-center gap-2 bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Stethoscope size={16} />
              Doctor Summary
            </button>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-200 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Download size={16} />
              Export Current Report
            </button>
          </div>
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

          {/* Flagship longitudinal brief — whole-history, always visible */}
          <LongitudinalInsightsCard
            insights={insights}
            loading={insightsLoading}
            error={insightsError}
            labReportCount={labReportCount}
          />

          {/* Middle: attention + trend, or document entities */}
          {isEntityDocument ? (
            <DocumentEntitiesCard structured={payload.structured} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NeedsAttentionCard activeReport={activeReport} history={history} />
              <TrendAnalyticsCard history={history} />
            </div>
          )}

          {/* Assistant CTA */}
          <AIInsightsBanner />

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
