import { buildMetricSeries } from './trends'

const STATUS_META = {
  normal: { label: 'Optimal', tone: 'emerald' },
  high: { label: 'Elevated', tone: 'orange' },
  low: { label: 'Low', tone: 'amber' },
  unknown: { label: 'Stable', tone: 'slate' },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown
}

function titleCase(name) {
  return String(name || '')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function resolveValue(measurement) {
  if (typeof measurement.value === 'number') return measurement.value
  if (typeof measurement.normalizedValue === 'number') return measurement.normalizedValue
  const raw = Number(measurement.rawValue)
  return Number.isFinite(raw) ? raw : null
}

// Builds the "Needs Attention" list: every abnormal (low/high) marker in the
// active report, enriched with how it changed versus the most recent earlier
// report that recorded the same marker.
export function buildAttentionItems(activeReport, history = []) {
  const measurements = activeReport?.measurements ?? []
  const series = buildMetricSeries(history)
  const activeDate = activeReport?.reportDate ? new Date(activeReport.reportDate).getTime() : null

  const items = []
  for (const measurement of measurements) {
    if (measurement.status !== 'low' && measurement.status !== 'high') continue

    const value = resolveValue(measurement)
    if (value == null) continue

    const key = String(measurement.name || '').trim().toLowerCase()
    const points = series[key]?.points ?? []

    // Most recent point strictly before the active report's date.
    let previous = null
    for (const point of points) {
      const t = new Date(point.date).getTime()
      if (activeDate == null || t < activeDate) {
        if (!previous || new Date(point.date) > new Date(previous.date)) previous = point
      }
    }

    let change = null
    if (previous && typeof previous.value === 'number') {
      const delta = value - previous.value
      change = {
        delta,
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
        previous: previous.value,
      }
    }

    items.push({
      name: titleCase(measurement.name),
      value,
      unit: measurement.unit ?? measurement.normalizedUnit ?? '',
      status: measurement.status,
      referenceRange: measurement.referenceRange,
      change,
    })
  }

  return items
}

export function countNormal(activeReport) {
  return (activeReport?.measurements ?? []).filter((m) => m.status === 'normal').length
}
