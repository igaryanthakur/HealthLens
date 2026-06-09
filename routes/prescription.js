const express = require("express");
const Report = require("../models/Report");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

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

function sanitizeStringList(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
}

function buildPrescriptionSummary(medications, diagnoses) {
  const medCount = medications.length;
  const dxCount = diagnoses.length;
  const parts = [];
  parts.push(`${medCount} medication${medCount === 1 ? "" : "s"}`);
  if (dxCount) parts.push(`${dxCount} diagnosis${dxCount === 1 ? "" : "es"}`);
  return `Prescription recorded: ${parts.join(", ")}. Please verify these details with your doctor or pharmacist before acting on them.`;
}

async function savePrescriptionHandler(req, res, deps = {}) {
  try {
    const saveReport = deps.saveReport ?? (async (doc) => doc.save());
    const body = req.body || {};

    const medications = sanitizeMedications(body.medications);
    const diagnoses = sanitizeDiagnoses(body.diagnoses);
    const doctorAdvice = sanitizeStringList(body.doctorAdvice);
    const testsAdvised = sanitizeStringList(body.testsAdvised);

    if (!medications.length && !diagnoses.length && !doctorAdvice.length) {
      return res.status(400).json({
        success: false,
        message:
          "A prescription must include at least one medication, diagnosis, or advice item.",
      });
    }

    const report = new Report({
      userId: req.user.id,
      reportType: "PRESCRIPTION",
      documentType: "prescription",
      reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
      measurements: [],
      medications,
      diagnoses,
      doctorAdvice,
      testsAdvised,
      provenance: body.provenance || { extractionMethod: "gemini-vision" },
      aiInterpretation: {
        summary: buildPrescriptionSummary(medications, diagnoses),
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
    console.error("Prescription Save Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

router.post("/", protect, savePrescriptionHandler);

module.exports = router;
module.exports.savePrescriptionHandler = savePrescriptionHandler;
