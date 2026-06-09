const express = require("express");
const Report = require("../models/Report");
const logger = require("../utils/logger");
const { protect } = require("../middleware/authMiddleware");
const {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
} = require("../utils/repositoryAggregator");
const { buildTimeline } = require("../utils/timelineBuilder");

const router = express.Router();

// Shared loader: all rollups compute over the user's full report history,
// chronologically ascending so first/last-seen math is natural.
function defaultFindReports(req) {
  return Report.find({ userId: req.user.id }).sort({ reportDate: 1 });
}

// Wraps a rollup handler with shared fetch + error handling. `key` is the
// response field name; `compute(reports, req)` returns the payload.
function makeHandler(key, compute, label) {
  return async function handler(req, res, deps = {}) {
    const findReports = deps.findReports ?? (() => defaultFindReports(req));

    try {
      const reports = await findReports();
      return res.json({ success: true, [key]: compute(reports, req) });
    } catch (error) {
      logger.error(`Repository ${label} fetch failed`, { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to fetch ${label}.`,
      });
    }
  };
}

const medicationsHandler = makeHandler(
  "medications",
  (reports) => aggregateMedications(reports),
  "medication history",
);

const diagnosesHandler = makeHandler(
  "diagnoses",
  (reports) => aggregateDiagnoses(reports),
  "diagnosis history",
);

const symptomsHandler = makeHandler(
  "symptoms",
  (reports) => aggregateSymptoms(reports),
  "symptom history",
);

const adviceHandler = makeHandler(
  "advice",
  (reports) => aggregateAdvice(reports),
  "advice history",
);

const timelineHandler = makeHandler(
  "timeline",
  (reports) => buildTimeline(reports),
  "health timeline",
);

const summaryHandler = makeHandler(
  "summary",
  (reports) => ({
    totalReports: Array.isArray(reports) ? reports.length : 0,
    medications: aggregateMedications(reports).length,
    diagnoses: aggregateDiagnoses(reports).length,
    symptoms: aggregateSymptoms(reports).length,
    advice: aggregateAdvice(reports).length,
    events: buildTimeline(reports).length,
  }),
  "repository summary",
);

router.get("/medications", protect, medicationsHandler);
router.get("/diagnoses", protect, diagnosesHandler);
router.get("/symptoms", protect, symptomsHandler);
router.get("/advice", protect, adviceHandler);
router.get("/timeline", protect, timelineHandler);
router.get("/summary", protect, summaryHandler);

module.exports = router;
module.exports.medicationsHandler = medicationsHandler;
module.exports.diagnosesHandler = diagnosesHandler;
module.exports.symptomsHandler = symptomsHandler;
module.exports.adviceHandler = adviceHandler;
module.exports.timelineHandler = timelineHandler;
module.exports.summaryHandler = summaryHandler;
