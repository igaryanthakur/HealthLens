export const APP_STATE = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  REVIEW: 'REVIEW',
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

/** Lab and entity reports shown in the dashboard switcher; prescriptions live in Repository/Vault. */
export function getDashboardSelectableHistory(history = []) {
  return history.filter((r) => r.documentType !== 'prescription')
}

export function reportToDashboardPayload(report) {
  return {
    _id: report._id,
    success: true,
    data: report.aiInterpretation,
    structured: {
      reportType: report.reportType,
      documentType: report.documentType,
      patient_info: { reportDate: report.reportDate },
      measurements: report.measurements ?? [],
      medications: report.medications ?? [],
      diagnoses: report.diagnoses ?? [],
      symptoms: report.symptoms ?? [],
      doctorAdvice: report.doctorAdvice ?? [],
      testsAdvised: report.testsAdvised ?? [],
    },
  }
}
