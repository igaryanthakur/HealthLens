import { FlaskConical } from 'lucide-react'

function capitalizeName(name) {
  if (!name) return 'Unknown'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getStatusStyles(status) {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'normal') {
    return {
      badge: 'bg-primary/10 border-primary/20 text-primary',
      card: 'border-primary/10',
    }
  }

  if (normalized === 'low' || normalized === 'high') {
    return {
      badge: 'bg-amber-50 border-amber-200 text-amber-700',
      card: 'border-amber-200/60',
    }
  }

  return {
    badge: 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant',
    card: 'border-outline-variant/20',
  }
}

function resolveValue(measurement) {
  if (measurement.value != null) return measurement.value
  if (measurement.normalizedValue != null) return measurement.normalizedValue
  return measurement.rawValue ?? '—'
}

function resolveUnit(measurement) {
  return measurement.unit ?? measurement.normalizedUnit ?? ''
}

export default function BiomarkerGrid({ measurements = [], className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="text-primary" size={22} />
        <h2 className="text-lg font-semibold text-on-surface">Biomarkers</h2>
      </div>

      {measurements.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No measurements extracted from this report.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {measurements.map((measurement, index) => {
            const styles = getStatusStyles(measurement.status)
            const value = resolveValue(measurement)
            const unit = resolveUnit(measurement)

            return (
              <div
                key={measurement.id ?? `${measurement.name}-${index}`}
                className={`bg-surface-container-lowest rounded-xl border shadow-ambient p-5 ${styles.card}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-medium text-on-surface text-sm">
                    {capitalizeName(measurement.name)}
                  </h3>
                  {measurement.status && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${styles.badge}`}
                    >
                      {measurement.status}
                    </span>
                  )}
                </div>

                <p className="text-2xl font-semibold text-on-surface mb-2">
                  {value}
                  {unit && <span className="text-base font-normal text-on-surface-variant ml-1">{unit}</span>}
                </p>

                {measurement.referenceRange && (
                  <p className="text-xs text-on-surface-variant">
                    Ref: {measurement.referenceRange}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
