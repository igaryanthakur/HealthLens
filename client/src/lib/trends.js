// Builds per-biomarker time series from report history for Trend Analytics (I11).
//
// Persisted measurements carry only name/value/unit/status/referenceRange, so
// series are keyed by measurement name across all reports.

function resolveValue(measurement) {
  if (typeof measurement.value === 'number') return measurement.value
  if (typeof measurement.normalizedValue === 'number') return measurement.normalizedValue
  const raw = Number(measurement.rawValue)
  return Number.isFinite(raw) ? raw : null
}

function titleCase(name) {
  return String(name || '')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// Returns { [metricKey]: { label, unit, points: [{ date, value, status, referenceRange }] } }
export function buildMetricSeries(history = []) {
  const series = {}

  for (const report of history) {
    const date = report.reportDate
    for (const measurement of report.measurements ?? []) {
      const key = String(measurement.name || '').trim().toLowerCase()
      if (!key) continue

      const value = resolveValue(measurement)
      if (value == null) continue

      if (!series[key]) {
        series[key] = {
          label: titleCase(measurement.name),
          unit: measurement.unit ?? measurement.normalizedUnit ?? '',
          points: [],
        }
      }
      if (!series[key].unit) {
        series[key].unit = measurement.unit ?? measurement.normalizedUnit ?? ''
      }

      series[key].points.push({
        date,
        value,
        status: measurement.status,
        referenceRange: measurement.referenceRange,
      })
    }
  }

  for (const key of Object.keys(series)) {
    series[key].points.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  return series
}

// Metric keys sorted by data richness (most data points first), then alphabetically.
export function listAvailableMetrics(series) {
  return Object.keys(series).sort((a, b) => {
    const diff = series[b].points.length - series[a].points.length
    if (diff !== 0) return diff
    return series[a].label.localeCompare(series[b].label)
  })
}
