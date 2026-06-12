const express = require("express");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");
const { buildProfileContext } = require("../utils/profileContextBuilder");
const { generateInterpretation } = require("../services/groqService");
const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const FALLBACK_INTERPRETATION = {
  summary:
    "Structured report data was extracted successfully, but AI interpretation is temporarily unavailable.",
  findings: [],
  recommendations: [
    "Please review abnormal values with a qualified healthcare professional.",
  ],
};

function mapMeasurementsForReport(measurements) {
  return measurements
    .map((m) => {
      const value = m.normalizedValue ?? (m.rawValue != null ? Number(m.rawValue) : NaN);
      const status = (m.status || "unknown").toLowerCase();
      return {
        name: m.name,
        value,
        unit: m.unit ?? m.normalizedUnit ?? undefined,
        status: ["low", "normal", "high"].includes(status) ? status : "unknown",
        referenceRange: m.referenceRange ?? undefined,
      };
    })
    .filter((m) => Number.isFinite(m.value));
}

function buildReportFromStructured(structured, userId, aiInterpretation) {
  return new Report({
    userId,
    reportType: structured.reportType || "CBC",
    documentType: structured.documentType || "lab_report",
    reportDate: structured.patient_info?.reportDate
      ? new Date(structured.patient_info.reportDate)
      : undefined,
    measurements: mapMeasurementsForReport(structured.measurements),
    provenance: structured.provenance || undefined,
    aiInterpretation,
  });
}

async function interpretHandler(req, res, deps = {}) {
  const structured = req.body?.structured;
  const genInterpret = deps.generateInterpretation ?? generateInterpretation;
  const saveReport = deps.saveReport ?? (async (doc) => doc.save());

  if (!structured || !Array.isArray(structured.measurements)) {
    return res.status(400).json({
      success: false,
      message: "Request body must include structured.measurements array.",
    });
  }

  const aiPrompt = generateClinicalSummaryPrompt(structured);
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));

  let user;
  try {
    user = await findUserById(req.user.id);
  } catch (error) {
    console.error("Interpretation Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  const profileContext = buildProfileContext(user);

  let interpretation;
  let aiUnavailable = false;

  try {
    interpretation = await genInterpret(aiPrompt, { profileContext });
  } catch (error) {
    console.error("Interpretation Route Error:", error);
    interpretation = FALLBACK_INTERPRETATION;
    aiUnavailable = true;
  }

  try {
    const report = buildReportFromStructured(structured, req.user.id, interpretation);
    const saved = await saveReport(report);

    return res.status(200).json({
      success: true,
      aiUnavailable,
      aiPrompt,
      data: interpretation,
      reportId: saved._id.toString(),
    });
  } catch (error) {
    console.error("Interpretation Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

router.post("/", protect, interpretHandler);

module.exports = router;
module.exports.interpretHandler = interpretHandler;
module.exports.mapMeasurementsForReport = mapMeasurementsForReport;
module.exports.FALLBACK_INTERPRETATION = FALLBACK_INTERPRETATION;
