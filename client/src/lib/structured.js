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

export function reportToDashboardPayload(report) {
  return {
    _id: report._id,
    success: true,
    data: report.aiInterpretation,
    structured: {
      reportType: report.reportType,
      patient_info: { reportDate: report.reportDate },
      measurements: report.measurements ?? [],
    },
  }
}
