export const APP_STATE = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
}

export function normalizeStructured(structured) {
  if (!structured) return structured

  return {
    ...structured,
    measurements: (structured.measurements ?? []).map((m) => ({
      ...m,
      value: m.normalizedValue ?? (m.rawValue != null ? Number(m.rawValue) : null),
      unit: m.unit ?? m.normalizedUnit,
      referenceRange: m.referenceRange,
    })),
  }
}
