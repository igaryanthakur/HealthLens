const express = require("express");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");
const { generateInterpretation } = require("../services/aiService");
const Report = require("../models/Report");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

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

async function interpretHandler(req, res, deps = {}) {
  try {
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
    const interpretation = await genInterpret(aiPrompt);

    const report = new Report({
      userId: req.user.id,
      reportType: structured.reportType || "CBC",
      reportDate: structured.patient_info?.reportDate
        ? new Date(structured.patient_info.reportDate)
        : undefined,
      measurements: mapMeasurementsForReport(structured.measurements),
      aiInterpretation: interpretation,
    });

    const saved = await saveReport(report);

    return res.status(200).json({
      success: true,
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
