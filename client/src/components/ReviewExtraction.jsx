import { useState } from 'react'
import { AlertTriangle, Check, Plus, Trash2, X } from 'lucide-react'

const EMPTY_MED = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: '',
  uncertain: false,
}

const DOC_TYPE_LABELS = {
  prescription: 'prescription',
  scan_report: 'scan report',
  discharge_summary: 'discharge summary',
  typed_note: 'clinical note',
  unknown: 'document',
}

export default function ReviewExtraction({
  structured,
  documentType = 'prescription',
  onConfirm,
  onCancel,
  saving = false,
  error,
}) {
  const [medications, setMedications] = useState(
    (structured?.medications ?? []).map((m) => ({ ...EMPTY_MED, ...m })),
  )
  const [diagnoses, setDiagnoses] = useState(
    (structured?.diagnoses ?? []).map((d) => ({
      condition: '',
      status: 'unknown',
      uncertain: false,
      ...d,
    })),
  )
  const [symptoms, setSymptoms] = useState(
    (structured?.symptoms ?? [])
      .map((s) => (typeof s === 'string' ? s : s?.description))
      .filter(Boolean)
      .join('\n'),
  )
  const [doctorAdvice, setDoctorAdvice] = useState((structured?.doctorAdvice ?? []).join('\n'))
  const [testsAdvised, setTestsAdvised] = useState((structured?.testsAdvised ?? []).join('\n'))

  const docLabel = DOC_TYPE_LABELS[documentType] || 'document'

  function updateMed(index, field, value) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    )
  }

  function removeMed(index) {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  function addMed() {
    setMedications((prev) => [...prev, { ...EMPTY_MED }])
  }

  function updateDiagnosis(index, field, value) {
    setDiagnoses((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  function removeDiagnosis(index) {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index))
  }

  function addDiagnosis() {
    setDiagnoses((prev) => [...prev, { condition: '', status: 'unknown', uncertain: false }])
  }

  function handleConfirm() {
    const payload = {
      documentType,
      medications: medications
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage?.trim() || undefined,
          frequency: m.frequency?.trim() || undefined,
          duration: m.duration?.trim() || undefined,
          route: m.route?.trim() || undefined,
          confidence: m.confidence,
          uncertain: Boolean(m.uncertain),
        })),
      diagnoses: diagnoses
        .filter((d) => d.condition.trim())
        .map((d) => ({
          condition: d.condition.trim(),
          status: d.status || 'unknown',
          confidence: d.confidence,
          uncertain: Boolean(d.uncertain),
        })),
      symptoms: symptoms
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((description) => ({ description })),
      doctorAdvice: doctorAdvice
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      testsAdvised: testsAdvised
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      provenance: structured?.provenance,
    }
    onConfirm(payload)
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-on-surface">Did we read this right?</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            We used AI to read your {docLabel}. Please review and correct anything before saving.
            Highlighted rows are low-confidence reads.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-error-container text-error rounded-xl p-4 text-sm border border-error/20">
            {error}
          </div>
        )}

        <section className="glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface">Medications</h3>
            <button
              type="button"
              onClick={addMed}
              className="text-primary text-sm inline-flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {medications.length === 0 && (
            <p className="text-sm text-on-surface-variant">No medications detected. Add any manually.</p>
          )}

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={index}
                className={[
                  'rounded-xl p-3 border',
                  med.uncertain
                    ? 'border-amber-400/60 bg-amber-50'
                    : 'border-outline-variant/30 bg-surface-container-lowest',
                ].join(' ')}
              >
                {med.uncertain && (
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs mb-2">
                    <AlertTriangle size={14} />
                    Low confidence{med.suggestion ? ` - did you mean "${med.suggestion}"?` : ''}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <input
                    className="md:col-span-3 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                    placeholder="Medicine name"
                    value={med.name}
                    onChange={(e) => updateMed(index, 'name', e.target.value)}
                  />
                  <input
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                    placeholder="Dosage"
                    value={med.dosage || ''}
                    onChange={(e) => updateMed(index, 'dosage', e.target.value)}
                  />
                  <input
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                    placeholder="Frequency"
                    value={med.frequency || ''}
                    onChange={(e) => updateMed(index, 'frequency', e.target.value)}
                  />
                  <input
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                    placeholder="Duration"
                    value={med.duration || ''}
                    onChange={(e) => updateMed(index, 'duration', e.target.value)}
                  />
                  <input
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                    placeholder="Route"
                    value={med.route || ''}
                    onChange={(e) => updateMed(index, 'route', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeMed(index)}
                    className="md:col-span-1 text-on-surface-variant hover:text-error flex justify-center"
                    aria-label="Remove medication"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface">Diagnoses</h3>
            <button
              type="button"
              onClick={addDiagnosis}
              className="text-primary text-sm inline-flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {diagnoses.length === 0 && (
            <p className="text-sm text-on-surface-variant">None detected.</p>
          )}

          <div className="space-y-2">
            {diagnoses.map((dx, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <input
                  className="md:col-span-8 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
                  placeholder="Condition"
                  value={dx.condition}
                  onChange={(e) => updateDiagnosis(index, 'condition', e.target.value)}
                />
                <select
                  className="md:col-span-3 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm bg-white"
                  value={dx.status || 'unknown'}
                  onChange={(e) => updateDiagnosis(index, 'status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="unknown">Unknown</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeDiagnosis(index)}
                  className="md:col-span-1 text-on-surface-variant hover:text-error flex justify-center"
                  aria-label="Remove diagnosis"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20 mb-6">
          <h3 className="font-semibold text-on-surface mb-2">Symptoms</h3>
          <p className="text-xs text-on-surface-variant mb-2">One symptom per line.</p>
          <textarea
            className="w-full h-24 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <section className="glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="font-semibold text-on-surface mb-2">Doctor's advice</h3>
            <p className="text-xs text-on-surface-variant mb-2">One item per line.</p>
            <textarea
              className="w-full h-28 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
              value={doctorAdvice}
              onChange={(e) => setDoctorAdvice(e.target.value)}
            />
          </section>
          <section className="glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="font-semibold text-on-surface mb-2">Tests advised</h3>
            <p className="text-xs text-on-surface-variant mb-2">One item per line.</p>
            <textarea
              className="w-full h-28 px-3 py-2 rounded-lg border border-outline-variant/40 text-sm"
              value={testsAdvised}
              onChange={(e) => setTestsAdvised(e.target.value)}
            />
          </section>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low inline-flex items-center gap-2"
          >
            <X size={18} /> Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-white hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={18} /> {saving ? 'Saving…' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
