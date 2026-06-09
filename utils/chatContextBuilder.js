function formatReportDate(value) {
  if (!value) return "Unknown Date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown Date";
  return date.toISOString().split("T")[0];
}

function buildVaultContext(reports = []) {
  if (!reports.length) {
    return "HEALTH VAULT: No medical reports on file yet.";
  }

  const blocks = reports.map((report, index) => {
    const lines = [];
    lines.push(`--- Report ${index + 1} ---`);
    lines.push(`Type: ${report.reportType || "Report"}`);
    lines.push(`Date: ${formatReportDate(report.reportDate)}`);
    lines.push(`Vitality Score: ${report.vitalityScore ?? "N/A"}`);

    const measurements = report.measurements || [];
    if (measurements.length > 0) {
      lines.push("Measurements:");
      for (const m of measurements) {
        const status = (m.status || "unknown").toUpperCase();
        lines.push(
          `  - ${m.name}: ${m.value} ${m.unit || ""} (${status}, Ref: ${m.referenceRange || "N/A"})`,
        );
      }
    }

    const interpretation = report.aiInterpretation;
    if (interpretation?.summary) {
      lines.push(`AI Summary: ${interpretation.summary}`);
    }

    const abnormalFindings = (interpretation?.findings || []).filter((f) => {
      const status = (f.status || "").toLowerCase();
      return status === "low" || status === "high";
    });

    if (abnormalFindings.length > 0) {
      lines.push("Notable Findings:");
      for (const f of abnormalFindings) {
        lines.push(`  - ${f.parameter} (${f.status}): ${f.explanation || ""}`);
      }
    }

    return lines.join("\n");
  });

  return `HEALTH VAULT (${reports.length} report${reports.length === 1 ? "" : "s"}):\n\n${blocks.join("\n\n")}`;
}

function buildBoundedChatHistory(reports = [], options = {}) {
  const maxReports = options.maxReports ?? 10;
  const maxMeasurementsPerReport = options.maxMeasurementsPerReport ?? 8;
  const maxEntityItems = options.maxEntityItems ?? 5;
  const maxSummaryLength = options.maxSummaryLength ?? 400;

  const sorted = [...reports].sort((a, b) => {
    const dateA = new Date(a.reportDate || 0).getTime();
    const dateB = new Date(b.reportDate || 0).getTime();
    return dateB - dateA;
  });

  return sorted.slice(0, maxReports).map((report) => {
    const doc = typeof report.toJSON === "function" ? report.toJSON() : report;
    const measurements = doc.measurements || [];

    const abnormal = measurements.filter((m) =>
      ["low", "high"].includes(String(m.status).toLowerCase()),
    );
    const keyNormals = measurements
      .filter((m) => String(m.status).toLowerCase() === "normal")
      .slice(0, 3);

    const summary = doc.aiInterpretation?.summary;
    const aiSummary =
      typeof summary === "string" && summary.length > maxSummaryLength
        ? summary.slice(0, maxSummaryLength)
        : summary || null;

    return {
      reportType: doc.reportType,
      documentType: doc.documentType,
      reportDate: doc.reportDate,
      vitalityScore: doc.vitalityScore,
      measurements: [...abnormal, ...keyNormals].slice(0, maxMeasurementsPerReport),
      medications: (doc.medications || []).slice(0, maxEntityItems).map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
      })),
      diagnoses: (doc.diagnoses || []).slice(0, maxEntityItems).map((d) => ({
        condition: d.condition,
        status: d.status,
      })),
      doctorAdvice: (doc.doctorAdvice || []).slice(0, maxEntityItems),
      testsAdvised: (doc.testsAdvised || []).slice(0, maxEntityItems),
      aiSummary,
    };
  });
}

function buildChatPrompt({ profileContext, vaultContext, message, history = [] }) {
  const parts = [
    profileContext || "",
    vaultContext || "",
    "You are the HealthLens AI Assistant. Answer the patient's question using ONLY the vault data and profile above.",
    "Do not diagnose diseases or prescribe medications. Include a brief reminder to consult their physician for medical decisions.",
  ];

  if (history.length > 0) {
    parts.push("\nCONVERSATION HISTORY:");
    for (const turn of history) {
      const role = turn.role === "assistant" ? "Assistant" : "Patient";
      parts.push(`${role}: ${turn.content}`);
    }
  }

  parts.push(`\nPatient: ${message}`);
  parts.push("\nAssistant:");

  return parts.filter(Boolean).join("\n\n");
}

module.exports = {
  buildVaultContext,
  buildBoundedChatHistory,
  buildChatPrompt,
  formatReportDate,
};
