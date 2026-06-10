const express = require("express");
const Report = require("../models/Report");
const User = require("../models/User");
const logger = require("../utils/logger");
const { protect } = require("../middleware/authMiddleware");
const {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
} = require("../utils/repositoryAggregator");
const { buildTimeline } = require("../utils/timelineBuilder");
const {
  buildInsightsContext,
  buildDeterministicInsights,
} = require("../utils/longitudinalInsights");
const { generateLongitudinalInsights } = require("../services/aiService");

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

// Longitudinal insights need both the user profile and the full report history,
// so this cannot use makeHandler (which only loads reports). Gemini only rewords
// the deterministic facts; any AI failure (or <2 lab reports) returns the
// deterministic brief with success:true so the dashboard never breaks.
async function insightsHandler(req, res, deps = {}) {
  const findReports = deps.findReports ?? (() => defaultFindReports(req));
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));
  const generateInsights = deps.generateInsights ?? generateLongitudinalInsights;
  const buildDeterministic = deps.buildDeterministic ?? buildDeterministicInsights;
  // AI wording is opt-in (deterministic is always correct). Enable only when
  // Gemini is known stable, e.g. for evaluation.
  const aiEnabled =
    deps.aiEnabled ?? process.env.LONGITUDINAL_AI_ENABLED === "true";

  let user;
  let reports;
  try {
    [user, reports] = await Promise.all([
      findUserById(req.user.id),
      findReports(),
    ]);
  } catch (error) {
    logger.error("Repository insights load failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to generate health insights.",
    });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const context = buildInsightsContext({ reports, user });

  // Compute the deterministic brief up front: it is the guaranteed answer and
  // the explicit fallback for every AI path below.
  const deterministic = buildDeterministic(context);

  // Skip Gemini when AI is disabled or trend comparison is impossible (<2 labs).
  let insights = deterministic;
  if (aiEnabled && (context.labReportCount ?? 0) >= 2) {
    try {
      insights = await generateInsights(context);
    } catch (error) {
      logger.error("Repository insights AI failed; using deterministic fallback", {
        error: error.message,
      });
      insights = deterministic;
    }
  }

  return res.json({
    success: true,
    insights,
    generatedAt: new Date().toISOString(),
  });
}

router.get("/medications", protect, medicationsHandler);
router.get("/diagnoses", protect, diagnosesHandler);
router.get("/symptoms", protect, symptomsHandler);
router.get("/advice", protect, adviceHandler);
router.get("/timeline", protect, timelineHandler);
router.get("/summary", protect, summaryHandler);
router.get("/insights", protect, insightsHandler);

module.exports = router;
module.exports.medicationsHandler = medicationsHandler;
module.exports.diagnosesHandler = diagnosesHandler;
module.exports.symptomsHandler = symptomsHandler;
module.exports.adviceHandler = adviceHandler;
module.exports.timelineHandler = timelineHandler;
module.exports.summaryHandler = summaryHandler;
module.exports.insightsHandler = insightsHandler;
