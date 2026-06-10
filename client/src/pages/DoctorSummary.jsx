import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import { fetchDoctorSummary } from '../lib/api'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function display(value) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

function Section({ title, children }) {
  return (
    <section className="border-t border-slate-200 pt-6 print:break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

function EmptyState({ label = 'No records available.' }) {
  return <p className="text-sm text-slate-400 italic">{label}</p>
}

function InfoGrid({ items }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {item.label}
          </dt>
          <dd className="text-sm text-slate-800 mt-0.5">{display(item.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

const STATUS_STYLES = {
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  low: 'bg-amber-50 text-amber-700 border-amber-200',
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {key || 'unknown'}
    </span>
  )
}

function SummaryTable({ columns, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm print:text-[11px] border-collapse">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col} className="py-2 pr-4 print:py-1.5 print:pr-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => renderRow(row, idx))}
        </tbody>
      </table>
    </div>
  )
}

function ListBlock({ title, items, renderItem }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-2">{title}</h3>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-700 flex gap-2">
              <span className="text-teal-600 shrink-0">•</span>
              <span>{renderItem(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DoctorSummary() {
  const navigate = useNavigate()
  const componentRef = useRef(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'HealthLens_Doctor_Summary',
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

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const json = await fetchDoctorSummary()
        if (!cancelled) setSummary(json.summary ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load doctor summary. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-slate-600 text-center">
          {error || 'Unable to load doctor summary. Please try again.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>
      </div>
    )
  }

  const {
    patient = {},
    snapshot = {},
    medications = [],
    diagnoses = [],
    symptoms = [],
    advice = [],
    latestVitals = [],
    abnormalMarkers = [],
    timelineHighlights = [],
    insights = {},
    disclaimer = '',
    generatedAt,
  } = summary

  const lifestyle = patient.lifestyle || {}
  const bmiValue =
    patient.bmi != null && patient.heightCm != null && patient.weightKg != null
      ? `${patient.bmi} (${patient.heightCm} cm / ${patient.weightKg} kg)`
      : patient.bmi ?? '—'
  const adviceItems = advice.filter((a) => a.kind !== 'test')
  const testItems = advice.filter((a) => a.kind === 'test')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-5 py-8 md:px-8 md:py-10">
        {/* Screen-only action bar (outside the printable ref) */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => handlePrint()}
            className="inline-flex items-center gap-2 bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>

        {/* Printable content */}
        <div
          ref={componentRef}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7 md:p-10 space-y-8 print:shadow-none print:border-none print:rounded-none print:p-0"
        >
          {/* Header */}
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              HealthLens AI — Doctor Summary
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {display(patient.name)}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Prepared for clinical discussion, not diagnosis.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Generated: {formatDateTime(generatedAt)}
            </p>
            {disclaimer && (
              <p className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {disclaimer}
              </p>
            )}
          </header>

          {/* 1. Patient Profile */}
          <Section title="Patient Profile">
            <InfoGrid
              items={[
                { label: 'Name', value: patient.name },
                { label: 'Email', value: patient.email },
                { label: 'Age', value: patient.age },
                { label: 'Gender', value: patient.gender },
                { label: 'Blood Group', value: patient.bloodGroup },
                { label: 'Height / Weight / BMI', value: bmiValue },
                { label: 'Smoking', value: lifestyle.smokingStatus },
                { label: 'Alcohol', value: lifestyle.alcoholConsumption },
              ]}
            />
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5">
                Chronic Conditions
              </p>
              {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.chronicConditions.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center rounded-full bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState label="None recorded." />
              )}
            </div>
          </Section>

          {/* 2. Health Snapshot */}
          <Section title="Health Snapshot">
            <InfoGrid
              items={[
                { label: 'Total Reports', value: snapshot.totalReports ?? 0 },
                { label: 'Latest Report', value: formatDate(snapshot.latestReportDate) },
                { label: 'Lab Reports', value: snapshot.labReportCount ?? 0 },
                { label: 'Active Conditions', value: snapshot.activeConditionCount ?? 0 },
                {
                  label: 'Current/Recent Meds',
                  value: snapshot.currentMedicationCount ?? 0,
                },
                { label: 'Abnormal Markers', value: snapshot.abnormalMarkerCount ?? 0 },
              ]}
            />
          </Section>

          {/* 3. Current / Recent Medications */}
          <Section title="Current / Recent Medications">
            {medications.length === 0 ? (
              <EmptyState />
            ) : (
              <SummaryTable
                columns={['Medication', 'Dosage', 'Frequency', 'First Seen', 'Last Seen', 'Count']}
                rows={medications}
                renderRow={(m, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2 font-medium text-slate-900">{display(m.name)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{display(m.latest?.dosage)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{display(m.latest?.frequency)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{formatDate(m.firstSeen)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{formatDate(m.lastSeen)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{display(m.count)}</td>
                  </tr>
                )}
              />
            )}
          </Section>

          {/* 4. Diagnoses & Symptoms */}
          <Section title="Diagnoses & Symptoms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListBlock
                title="Diagnoses"
                items={diagnoses}
                renderItem={(d) => (
                  <>
                    <span className="font-medium text-slate-900">{display(d.condition)}</span>
                    {d.latestStatus && (
                      <span className="text-slate-500"> — {d.latestStatus}</span>
                    )}
                    <span className="text-slate-400">
                      {' '}
                      (last seen {formatDate(d.lastSeen)}, x{d.count})
                    </span>
                  </>
                )}
              />
              <ListBlock
                title="Symptoms"
                items={symptoms}
                renderItem={(s) => (
                  <>
                    <span className="font-medium text-slate-900">{display(s.description)}</span>
                    <span className="text-slate-400">
                      {' '}
                      (last seen {formatDate(s.lastSeen)}, x{s.count})
                    </span>
                  </>
                )}
              />
            </div>
          </Section>

          {/* 5. Advice & Tests Advised */}
          <Section title="Advice & Tests Advised">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListBlock
                title="Doctor Advice"
                items={adviceItems}
                renderItem={(a) => (
                  <>
                    <span className="text-slate-800">{display(a.text)}</span>
                    <span className="text-slate-400"> (last seen {formatDate(a.lastSeen)})</span>
                  </>
                )}
              />
              <ListBlock
                title="Tests Advised"
                items={testItems}
                renderItem={(a) => (
                  <>
                    <span className="text-slate-800">{display(a.text)}</span>
                    <span className="text-slate-400"> (last seen {formatDate(a.lastSeen)})</span>
                  </>
                )}
              />
            </div>
          </Section>

          {/* 6. Latest Vitals */}
          <Section title="Latest Vitals">
            {latestVitals.length === 0 ? (
              <EmptyState label="No lab measurements available." />
            ) : (
              <SummaryTable
                columns={['Marker', 'Value', 'Status', 'Reference Range', 'Report Date']}
                rows={latestVitals}
                renderRow={(v, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2 font-medium text-slate-900">{display(v.name)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">
                      {display(v.value)}
                      {v.unit ? ` ${v.unit}` : ''}
                    </td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{display(v.referenceRange)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{formatDate(v.reportDate)}</td>
                  </tr>
                )}
              />
            )}
          </Section>

          {/* 7. Abnormal Markers */}
          <Section title="Abnormal Markers">
            {abnormalMarkers.length === 0 ? (
              <EmptyState label="No abnormal markers in the latest lab report." />
            ) : (
              <SummaryTable
                columns={['Marker', 'Value', 'Status', 'Reference Range', 'Report Date']}
                rows={abnormalMarkers}
                renderRow={(m, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2 font-medium text-slate-900">{display(m.marker)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">
                      {display(m.value)}
                      {m.unit ? ` ${m.unit}` : ''}
                    </td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{display(m.referenceRange)}</td>
                    <td className="py-2 pr-4 print:py-1.5 print:pr-2">{formatDate(m.reportDate)}</td>
                  </tr>
                )}
              />
            )}
          </Section>

          {/* 8. Timeline Highlights */}
          <Section title="Timeline Highlights">
            {timelineHighlights.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-3">
                {timelineHighlights.map((event, idx) => (
                  <li key={event.id || idx} className="flex gap-4">
                    <span className="text-xs font-medium text-slate-400 w-24 shrink-0 pt-0.5">
                      {formatDate(event.date)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {display(event.title)}
                        {event.reportType ? (
                          <span className="text-slate-400 font-normal"> · {event.reportType}</span>
                        ) : null}
                      </p>
                      {event.summary && (
                        <p className="text-sm text-slate-600 mt-0.5">{event.summary}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 9. Health Intelligence Brief */}
          <Section title="Health Intelligence Brief">
            {insights.summary ? (
              <p className="text-sm text-slate-700 mb-4">{insights.summary}</p>
            ) : (
              <EmptyState label="No longitudinal summary available yet." />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListBlock
                title="Needs Attention"
                items={insights.needsAttention || []}
                renderItem={(t) => t}
              />
              <ListBlock
                title="Improving Signals"
                items={insights.improvingSignals || []}
                renderItem={(t) => t}
              />
              <ListBlock
                title="Questions for Your Doctor"
                items={insights.doctorQuestions || []}
                renderItem={(t) => t}
              />
              <ListBlock
                title="Suggested Follow-up"
                items={insights.followUpSuggestions || []}
                renderItem={(t) => t}
              />
            </div>
          </Section>

          {/* Footer disclaimer (repeated for print) */}
          {disclaimer && (
            <p className="border-t border-slate-200 pt-6 text-xs text-slate-400">
              {disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
