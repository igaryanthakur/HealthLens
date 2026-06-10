import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Pill,
  Stethoscope,
  Activity,
  ClipboardList,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react'
import { fetchRepositoryOverview } from '../lib/api'

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

function display(value) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-7">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

function EmptyState({ label }) {
  return <p className="text-sm text-slate-400 italic">{label}</p>
}

function UncertainBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
      Uncertain
    </span>
  )
}

// Backend diagnosis status enum is active | resolved | unknown.
const STATUS_STYLES = {
  active: 'bg-orange-50 text-orange-700 border-orange-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col} className="py-2 pr-4 font-medium">
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

const STAT_ICONS = {
  reports: FileText,
  medications: Pill,
  diagnoses: Stethoscope,
  symptoms: Activity,
  advice: ClipboardList,
  events: Calendar,
}

function StatCard({ icon, label, value }) {
  const Icon = STAT_ICONS[icon] || Layers
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value ?? 0}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}

export default function Repository() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const json = await fetchRepositoryOverview()

        if (!cancelled) {
          setData({
            summary: json.summary ?? {},
            medications: json.medications ?? [],
            diagnoses: json.diagnoses ?? [],
            symptoms: json.symptoms ?? [],
            advice: json.advice ?? [],
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load your health repository. Please try again.',
          )
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-slate-600 text-center">
          {error || 'Unable to load your health repository. Please try again.'}
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

  const { summary, medications, diagnoses, symptoms, advice } = data
  const adviceItems = advice.filter((a) => a.kind !== 'test')
  const testItems = advice.filter((a) => a.kind === 'test')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 py-8 md:px-8 md:py-10 space-y-6">
        {/* Header */}
        <header>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            HealthLens AI
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
            Personal Health Repository
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structured health memory extracted from your records.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            This page organizes extracted medicines, diagnoses, symptoms, advice, and
            tests across all uploaded records.
          </p>
        </header>

        {/* 1. Repository Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon="reports" label="Reports" value={summary.totalReports} />
          <StatCard icon="medications" label="Medications" value={summary.medications} />
          <StatCard icon="diagnoses" label="Diagnoses" value={summary.diagnoses} />
          <StatCard icon="symptoms" label="Symptoms" value={summary.symptoms} />
          <StatCard icon="advice" label="Advice / Tests" value={summary.advice} />
          <StatCard icon="events" label="Timeline Events" value={summary.events} />
        </div>

        {/* 2. Medication History */}
        <Section title="Medication History">
          {medications.length === 0 ? (
            <EmptyState label="No medications found yet." />
          ) : (
            <SummaryTable
              columns={['Medication', 'Dosage', 'Frequency', 'First Seen', 'Last Seen', 'Count']}
              rows={medications}
              renderRow={(m, idx) => (
                <tr key={idx} className="text-slate-700">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {display(m.name)}
                    {m.uncertain && <UncertainBadge />}
                  </td>
                  <td className="py-2.5 pr-4">{display(m.latest?.dosage)}</td>
                  <td className="py-2.5 pr-4">{display(m.latest?.frequency)}</td>
                  <td className="py-2.5 pr-4">{formatDate(m.firstSeen)}</td>
                  <td className="py-2.5 pr-4">{formatDate(m.lastSeen)}</td>
                  <td className="py-2.5 pr-4">{display(m.count)}</td>
                </tr>
              )}
            />
          )}
        </Section>

        {/* 3. Diagnosis History */}
        <Section title="Diagnosis History">
          {diagnoses.length === 0 ? (
            <EmptyState label="No diagnoses found yet." />
          ) : (
            <SummaryTable
              columns={['Condition', 'Latest Status', 'First Seen', 'Last Seen', 'Count']}
              rows={diagnoses}
              renderRow={(d, idx) => (
                <tr key={idx} className="text-slate-700">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {display(d.condition)}
                    {d.uncertain && <UncertainBadge />}
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status={d.latestStatus} />
                  </td>
                  <td className="py-2.5 pr-4">{formatDate(d.firstSeen)}</td>
                  <td className="py-2.5 pr-4">{formatDate(d.lastSeen)}</td>
                  <td className="py-2.5 pr-4">{display(d.count)}</td>
                </tr>
              )}
            />
          )}
        </Section>

        {/* 4. Symptom History */}
        <Section title="Symptom History">
          {symptoms.length === 0 ? (
            <EmptyState label="No symptoms found yet." />
          ) : (
            <SummaryTable
              columns={['Symptom', 'First Seen', 'Last Seen', 'Count']}
              rows={symptoms}
              renderRow={(s, idx) => (
                <tr key={idx} className="text-slate-700">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {display(s.description)}
                    {s.uncertain && <UncertainBadge />}
                  </td>
                  <td className="py-2.5 pr-4">{formatDate(s.firstSeen)}</td>
                  <td className="py-2.5 pr-4">{formatDate(s.lastSeen)}</td>
                  <td className="py-2.5 pr-4">{display(s.count)}</td>
                </tr>
              )}
            />
          )}
        </Section>

        {/* 5. Doctor Advice & Tests */}
        <Section title="Doctor Advice & Tests">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Doctor Advice</h3>
              {adviceItems.length === 0 ? (
                <EmptyState label="No doctor advice found yet." />
              ) : (
                <SummaryTable
                  columns={['Advice', 'First Seen', 'Last Seen', 'Count']}
                  rows={adviceItems}
                  renderRow={(a, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2.5 pr-4 text-slate-800">{display(a.text)}</td>
                      <td className="py-2.5 pr-4">{formatDate(a.firstSeen)}</td>
                      <td className="py-2.5 pr-4">{formatDate(a.lastSeen)}</td>
                      <td className="py-2.5 pr-4">{display(a.count)}</td>
                    </tr>
                  )}
                />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Tests Advised</h3>
              {testItems.length === 0 ? (
                <EmptyState label="No tests advised yet." />
              ) : (
                <SummaryTable
                  columns={['Test', 'First Seen', 'Last Seen', 'Count']}
                  rows={testItems}
                  renderRow={(a, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2.5 pr-4 text-slate-800">{display(a.text)}</td>
                      <td className="py-2.5 pr-4">{formatDate(a.firstSeen)}</td>
                      <td className="py-2.5 pr-4">{formatDate(a.lastSeen)}</td>
                      <td className="py-2.5 pr-4">{display(a.count)}</td>
                    </tr>
                  )}
                />
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
