const { extractEntitiesFromText } = require("./groqService");
const { annotateMedications } = require("./prescriptionService");

// Maps a documentType to the legacy `reportType` slot so the rest of the
// pipeline (and the dashboard) has a stable, human-readable label.
const REPORT_TYPE_BY_DOCUMENT = {
  scan_report: "SCAN_REPORT",
  discharge_summary: "DISCHARGE_SUMMARY",
  typed_note: "TYPED_NOTE",
  unknown: "DOCUMENT",
};

/**
 * Reads the cleaned text of a printed clinical document and returns a
 * `structured`-shaped object the upload route can return and the review UI can
 * edit. Numbers are NEVER extracted here (handled by the deterministic lane).
 *
 * @param {string} cleanedText - Cleaned full document text.
 * @param {string} documentType - The classified documentType driving routing.
 * @param {Object} deps - { extractEntities } for testing.
 * @returns {Promise<Object>} structured entity payload.
 */
async function extractDocumentEntities(cleanedText, documentType, deps = {}) {
  const extractEntities = deps.extractEntities ?? extractEntitiesFromText;

  const extracted = await extractEntities(cleanedText);

  return {
    documentType,
    reportType: REPORT_TYPE_BY_DOCUMENT[documentType] || "DOCUMENT",
    measurements: [],
    medications: annotateMedications(extracted.medications || []),
    diagnoses: extracted.diagnoses || [],
    symptoms: extracted.symptoms || [],
    doctorAdvice: extracted.doctorAdvice || [],
    testsAdvised: extracted.testsAdvised || [],
    provenance: {
      extractionMethod: "groq-text",
    },
  };
}

module.exports = {
  extractDocumentEntities,
  REPORT_TYPE_BY_DOCUMENT,
};
