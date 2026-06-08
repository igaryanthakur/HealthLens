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
  buildChatPrompt,
  formatReportDate,
};
