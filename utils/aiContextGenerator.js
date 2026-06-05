/**
 * Transforms the frozen structured JSON into a clean text prompt for the LLM.
 */
function generateClinicalSummaryPrompt(structuredData) {
  const { reportType, measurements } = structuredData;
  const reportDate = structuredData.patient_info?.reportDate || "Unknown Date";

  const abnormalities = measurements.filter(
    (m) => m.status === "high" || m.status === "low" || m.status === "critical",
  );
  const normalMarkers = measurements.filter((m) => m.status === "normal");

  let promptContext = `MEDICAL REPORT CONTEXT:\n`;
  promptContext += `- Report Type: ${reportType || "Comprehensive Blood Panel"}\n`;
  promptContext += `- Report Date: ${reportDate}\n\n`;

  promptContext += `CRITICAL FINDINGS (ABNORMALITIES):\n`;
  if (abnormalities.length === 0) {
    promptContext += `None detected in this report.\n`;
  } else {
    abnormalities.forEach((item) => {
      const value = item.normalizedValue ?? item.value;
      promptContext += `- ${item.name.toUpperCase()}: ${value} ${item.unit || ""} (Status: ${item.status.toUpperCase()}, Ref Range: ${item.referenceRange || "N/A"})\n`;
    });
  }

  promptContext += `\nNORMAL MARKERS:\n`;
  if (normalMarkers.length === 0) {
    promptContext += `None confirmed.\n`;
  } else {
    const normalNames = normalMarkers.map((m) => m.name).join(", ");
    promptContext += `The following markers are within normal reference ranges: ${normalNames}.\n`;
  }

  promptContext += `\nINSTRUCTIONS FOR AI:\n`;
  promptContext += `Using the data above, generate a patient-friendly Health Summary, explain the Critical Findings, suggest lifestyle/dietary recommendations, and identify any long-term health trends. Do NOT provide a medical diagnosis. Include the disclaimer: "This is not a medical diagnosis. Please consult your doctor."`;

  return promptContext;
}

module.exports = { generateClinicalSummaryPrompt };
