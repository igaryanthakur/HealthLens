const express = require("express");
const Report = require("../models/Report");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// documentTypes that may be saved via the reviewed-document path, mapped to the
// legacy human-readable reportType slot.
const REPORT_TYPE_BY_DOCUMENT = {
  prescription: "PRESCRIPTION",
  scan_report: "SCAN_REPORT",
  discharge_summary: "DISCHARGE_SUMMARY",
  typed_note: "TYPED_NOTE",
  unknown: "DOCUMENT",
};

function resolveDocumentType(documentType) {
  return REPORT_TYPE_BY_DOCUMENT[documentType] ? documentType : "prescription";
}

function sanitizeMedications(medications = []) {
  return medications
    .filter((m) => m && typeof m.name === "string" && m.name.trim())
    .map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage || undefined,
      frequency: m.frequency || undefined,
      duration: m.duration || undefined,
      route: m.route || undefined,
      confidence: typeof m.confidence === "number" ? m.confidence : undefined,
      uncertain: Boolean(m.uncertain),
    }));
}

function sanitizeDiagnoses(diagnoses = []) {
  const allowed = new Set(["active", "resolved", "unknown"]);
  return diagnoses
    .filter((d) => d && typeof d.condition === "string" && d.condition.trim())
    .map((d) => ({
      condition: d.condition.trim(),
      status: allowed.has(d.status) ? d.status : "unknown",
      confidence: typeof d.confidence === "number" ? d.confidence : undefined,
      uncertain: Boolean(d.uncertain),
    }));
}

function sanitizeSymptoms(symptoms = []) {
  return (Array.isArray(symptoms) ? symptoms : [])
    .filter((s) => s && typeof s.description === "string" && s.description.trim())
    .map((s) => ({
      description: s.description.trim(),
      confidence: typeof s.confidence === "number" ? s.confidence : undefined,
      uncertain: Boolean(s.uncertain),
    }));
}

function sanitizeStringList(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
}

function buildDocumentSummary(documentType, { medications, diagnoses, symptoms }) {
  const labels = {
    prescription: "Prescription",
    scan_report: "Scan report",
    discharge_summary: "Discharge summary",
    typed_note: "Clinical note",
    unknown: "Document",
  };
  const label = labels[documentType] || "Document";

  const parts = [];
  if (medications.length) {
    parts.push(`${medications.length} medication${medications.length === 1 ? "" : "s"}`);
  }
  if (diagnoses.length) {
    parts.push(`${diagnoses.length} diagnosis${diagnoses.length === 1 ? "" : "es"}`);
  }
  if (symptoms.length) {
    parts.push(`${symptoms.length} symptom${symptoms.length === 1 ? "" : "s"}`);
  }

  const detail = parts.length ? ` ${parts.join(", ")} recorded.` : "";
  return `${label} saved.${detail} Please verify these details with your doctor or pharmacist before acting on them.`;
}

async function saveDocumentHandler(req, res, deps = {}) {
  try {
    const saveReport = deps.saveReport ?? (async (doc) => doc.save());
    const body = req.body || {};

    const documentType = resolveDocumentType(body.documentType);
    const medications = sanitizeMedications(body.medications);
    const diagnoses = sanitizeDiagnoses(body.diagnoses);
    const symptoms = sanitizeSymptoms(body.symptoms);
    const doctorAdvice = sanitizeStringList(body.doctorAdvice);
    const testsAdvised = sanitizeStringList(body.testsAdvised);

    if (
      !medications.length &&
      !diagnoses.length &&
      !symptoms.length &&
      !doctorAdvice.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A document must include at least one medication, diagnosis, symptom, or advice item.",
      });
    }

    const report = new Report({
      userId: req.user.id,
      reportType: REPORT_TYPE_BY_DOCUMENT[documentType],
      documentType,
      reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
      measurements: [],
      medications,
      diagnoses,
      symptoms,
      doctorAdvice,
      testsAdvised,
      provenance: body.provenance || { extractionMethod: "groq-text" },
      aiInterpretation: {
        summary: buildDocumentSummary(documentType, {
          medications,
          diagnoses,
          symptoms,
        }),
        findings: [],
        recommendations: [],
      },
    });

    const saved = await saveReport(report);

    return res.status(200).json({
      success: true,
      reportId: saved._id.toString(),
    });
  } catch (error) {
    console.error("Document Save Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Backward-compatible prescription save: forces documentType to prescription.
async function savePrescriptionHandler(req, res, deps = {}) {
  req.body = { ...(req.body || {}), documentType: "prescription" };
  return saveDocumentHandler(req, res, deps);
}

router.post("/", protect, savePrescriptionHandler);

module.exports = router;
module.exports.savePrescriptionHandler = savePrescriptionHandler;
module.exports.saveDocumentHandler = saveDocumentHandler;
