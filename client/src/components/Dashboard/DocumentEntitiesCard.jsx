import { Pill, Stethoscope, ClipboardList, FlaskConical, Activity } from 'lucide-react'

function Section({ icon: Icon, title, children, empty }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-teal-700" />
        <h4 className="font-semibold text-slate-900">{title}</h4>
      </div>
      {empty ? (
        <p className="text-sm text-slate-400">None recorded.</p>
      ) : (
        children
      )}
    </div>
  )
}

function symptomText(symptom) {
  return typeof symptom === 'string' ? symptom : symptom?.description
}

export default function DocumentEntitiesCard({ structured, className = '' }) {
  const medications = structured?.medications ?? []
  const diagnoses = structured?.diagnoses ?? []
  const symptoms = structured?.symptoms ?? []
  const doctorAdvice = structured?.doctorAdvice ?? []
  const testsAdvised = structured?.testsAdvised ?? []

  return (
    <div
      className={[
        'bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-slate-100 space-y-5',
        className,
      ].join(' ')}
    >
      <Section icon={Pill} title="Medications" empty={medications.length === 0}>
        <div className="space-y-2">
          {medications.map((med, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2"
            >
              <span className="font-medium text-slate-900">{med.name}</span>
              {med.dosage && <span className="text-sm text-slate-500">{med.dosage}</span>}
              {med.frequency && (
                <span className="text-sm text-slate-500">- {med.frequency}</span>
              )}
              {med.duration && (
                <span className="text-sm text-slate-500">for {med.duration}</span>
              )}
              {med.route && (
                <span className="text-xs text-slate-400 uppercase">({med.route})</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Stethoscope} title="Diagnoses" empty={diagnoses.length === 0}>
        <ul className="space-y-1">
          {diagnoses.map((dx, i) => (
            <li key={i} className="text-sm text-slate-700">
              {dx.condition}
              {dx.status && dx.status !== 'unknown' && (
                <span className="text-slate-400"> ({dx.status})</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={Activity} title="Symptoms" empty={symptoms.length === 0}>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
          {symptoms.map((s, i) => (
            <li key={i}>{symptomText(s)}</li>
          ))}
        </ul>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={ClipboardList} title="Doctor's advice" empty={doctorAdvice.length === 0}>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {doctorAdvice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
        <Section icon={FlaskConical} title="Tests advised" empty={testsAdvised.length === 0}>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {testsAdvised.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
