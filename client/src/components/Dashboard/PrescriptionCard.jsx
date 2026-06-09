import { Pill, Stethoscope, ClipboardList, FlaskConical } from 'lucide-react'

function Section({ icon: Icon, title, children, empty }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-primary" />
        <h4 className="font-semibold text-on-surface">{title}</h4>
      </div>
      {empty ? (
        <p className="text-sm text-on-surface-variant">None recorded.</p>
      ) : (
        children
      )}
    </div>
  )
}

export default function PrescriptionCard({ structured, className = '' }) {
  const medications = structured?.medications ?? []
  const diagnoses = structured?.diagnoses ?? []
  const doctorAdvice = structured?.doctorAdvice ?? []
  const testsAdvised = structured?.testsAdvised ?? []

  return (
    <div
      className={[
        'glass-card shadow-ambient rounded-2xl p-6 border border-outline-variant/20',
        className,
      ].join(' ')}
    >
      <Section icon={Pill} title="Medications" empty={medications.length === 0}>
        <div className="space-y-2">
          {medications.map((med, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 px-3 py-2"
            >
              <span className="font-medium text-on-surface">{med.name}</span>
              {med.dosage && <span className="text-sm text-on-surface-variant">{med.dosage}</span>}
              {med.frequency && (
                <span className="text-sm text-on-surface-variant">- {med.frequency}</span>
              )}
              {med.duration && (
                <span className="text-sm text-on-surface-variant">for {med.duration}</span>
              )}
              {med.route && (
                <span className="text-xs text-on-surface-variant uppercase">({med.route})</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-5">
        <Section icon={Stethoscope} title="Diagnoses" empty={diagnoses.length === 0}>
          <ul className="space-y-1">
            {diagnoses.map((dx, i) => (
              <li key={i} className="text-sm text-on-surface">
                {dx.condition}
                {dx.status && dx.status !== 'unknown' && (
                  <span className="text-on-surface-variant"> ({dx.status})</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <Section icon={ClipboardList} title="Doctor's advice" empty={doctorAdvice.length === 0}>
          <ul className="list-disc list-inside space-y-1 text-sm text-on-surface">
            {doctorAdvice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
        <Section icon={FlaskConical} title="Tests advised" empty={testsAdvised.length === 0}>
          <ul className="list-disc list-inside space-y-1 text-sm text-on-surface">
            {testsAdvised.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
