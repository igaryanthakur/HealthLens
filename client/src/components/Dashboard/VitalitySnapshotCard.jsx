import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, FileText, Microscope, Pill, Stethoscope } from 'lucide-react'
import VitalityRing from './VitalityRing'
import { fetchDiagnosisHistory, fetchMedicationHistory } from '../../lib/api'

function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Pills({ items, emptyText, tone = 'teal' }) {
  const toneClasses =
    tone === 'teal'
      ? 'bg-teal-50 text-teal-800 border-teal-100'
      : 'bg-slate-50 text-slate-700 border-slate-200'

  if (!items.length) {
    return <p className="text-sm text-slate-400">{emptyText}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${toneClasses}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function StatTile({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
      <span className="h-9 w-9 rounded-xl bg-white text-teal-700 flex items-center justify-center shadow-sm">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-lg font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function VitalitySnapshotCard({ score = 0, alerts = [], history = [], className = '' }) {
  const [conditions, setConditions] = useState([])
  const [medications, setMedications] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [dx, meds] = await Promise.all([
          fetchDiagnosisHistory(),
          fetchMedicationHistory(),
        ])
        if (cancelled) return
        setConditions(dx.diagnoses ?? [])
        setMedications(meds.medications ?? [])
      } catch {
        /* snapshot degrades gracefully on fetch failure */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activeConditions = conditions
    .filter((c) => c.latestStatus === 'active')
    .map((c) => capitalize(c.condition))
  const conditionPills = activeConditions.length
    ? activeConditions
    : conditions.slice(0, 3).map((c) => capitalize(c.condition))

  const medPills = medications.slice(0, 4).map((m) =>
    `${capitalize(m.name)}${m.latest?.dosage ? ` ${m.latest.dosage}` : ''}`,
  )

  const topAlert = alerts[0]
  const extraAlerts = Math.max(0, alerts.length - 1)

  const biomarkersTracked = useMemo(() => {
    const names = new Set()
    for (const report of history) {
      for (const m of report.measurements ?? []) {
        if (m.name) names.add(String(m.name).trim().toLowerCase())
      }
    }
    return names.size
  }, [history])

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col ${className}`}>
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        <div className="flex flex-col items-center justify-center lg:border-r lg:border-slate-100 lg:pr-8 shrink-0">
          <VitalityRing score={score} />
        </div>

        <div className="flex-1 w-full flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Stethoscope size={16} className="text-teal-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Conditions
              </h3>
            </div>
            <Pills items={conditionPills} emptyText="No active conditions on record." />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Pill size={16} className="text-teal-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Medications
              </h3>
            </div>
            <Pills items={medPills} emptyText="No medications recorded yet." tone="slate" />
          </div>

          {topAlert ? (
            <div className="bg-orange-50 text-orange-800 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {topAlert.status === 'high' ? 'Elevated' : 'Low'} {capitalize(topAlert.name)}
                  {extraAlerts > 0 && (
                    <span className="font-normal">
                      {' '}
                      and {extraAlerts} other marker{extraAlerts === 1 ? '' : 's'} need attention
                    </span>
                  )}
                </p>
                <p className="text-xs text-orange-700/90 mt-0.5">
                  Outside the reference range. Consider discussing with your physician and a
                  follow-up test.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-800 rounded-xl p-4 flex items-start gap-3">
              <Activity size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">All tracked markers in range</p>
                <p className="text-xs text-emerald-700/90 mt-0.5">
                  No abnormal values detected in your most recent report.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
        <StatTile icon={FileText} value={history.length} label="Reports tracked" />
        <StatTile icon={Microscope} value={biomarkersTracked} label="Biomarkers tracked" />
        <StatTile icon={AlertTriangle} value={alerts.length} label="Out of range" />
      </div>
    </div>
  )
}
