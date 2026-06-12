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
const { buildDoctorSummary } = require("../utils/doctorSummaryBuilder");
const { generateLongitudinalInsights } = require("../services/groqService");

const router = express.Router();

// Shared loader: all rollups compute over the user's full report history,
// chronologically ascending so first/last-seen math is natural.
function defaultFindReports(req) {
  // Plain objects are enough for rollups and avoid Mongoose hydration overhead.
  return Report.find({ userId: req.user.id }).sort({ reportDate: 1 }).lean();
}

function buildRepositoryOverview(reports) {
  const list = Array.isArray(reports) ? reports : [];
  const medications = aggregateMedications(list);
  const diagnoses = aggregateDiagnoses(list);
  const symptoms = aggregateSymptoms(list);
  const advice = aggregateAdvice(list);
  const timeline = buildTimeline(list);

  return {
    summary: {
      totalReports: list.length,
      medications: medications.length,
      diagnoses: diagnoses.length,
      symptoms: symptoms.length,
      advice: advice.length,
      events: timeline.length,
    },
    medications,
    diagnoses,
    symptoms,
    advice,
  };
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
  (reports) => buildRepositoryOverview(reports).summary,
  "repository summary",
);

// Single-fetch bundle for the Repository UI (Stage 2.3 perf). One MongoDB read +
// one pass of each rollup instead of five parallel /history-style fetches.
async function overviewHandler(req, res, deps = {}) {
  const findReports = deps.findReports ?? (() => defaultFindReports(req));

  try {
    const reports = await findReports();
    return res.json({ success: true, ...buildRepositoryOverview(reports) });
  } catch (error) {
    logger.error("Repository overview fetch failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch repository overview.",
    });
  }
}

// Longitudinal insights need both the user profile and the full report history,
// so this cannot use makeHandler (which only loads reports). Groq only rewords
// the deterministic facts; any AI failure (or <2 lab reports) returns the
// deterministic brief with success:true so the dashboard never breaks.
async function insightsHandler(req, res, deps = {}) {
  const findReports = deps.findReports ?? (() => defaultFindReports(req));
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));
  const generateInsights = deps.generateInsights ?? generateLongitudinalInsights;
  const buildDeterministic = deps.buildDeterministic ?? buildDeterministicInsights;
  // AI wording is opt-in (deterministic is always correct). Enable only when
  // Groq is known stable, e.g. for evaluation.
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

  // Skip Groq when AI is disabled or trend comparison is impossible (<2 labs).
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

// Doctor Summary (Stage 2.1). Like insights, it needs both the user profile and
// the full report history, so it cannot use makeHandler. Fully deterministic
// (no Groq): the longitudinal insight block is rebuilt via
// buildDeterministicInsights. Empty reports still return 200 with a populated
// patient block and empty arrays.
async function doctorSummaryHandler(req, res, deps = {}) {
  const findReports = deps.findReports ?? (() => defaultFindReports(req));
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));
  const buildInsights = deps.buildInsights ?? buildDeterministicInsights;
  const buildSummary = deps.buildSummary ?? buildDoctorSummary;

  let user;
  let reports;
  try {
    [user, reports] = await Promise.all([
      findUserById(req.user.id),
      findReports(),
    ]);
  } catch (error) {
    logger.error("Doctor summary load failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to generate doctor summary.",
    });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const context = buildInsightsContext({ reports, user });
  const insights = buildInsights(context);

  return res.json({
    success: true,
    summary: buildSummary({ user, reports, insights }),
  });
}

router.get("/overview", protect, overviewHandler);
router.get("/medications", protect, medicationsHandler);
router.get("/diagnoses", protect, diagnosesHandler);
router.get("/symptoms", protect, symptomsHandler);
router.get("/advice", protect, adviceHandler);
router.get("/timeline", protect, timelineHandler);
router.get("/summary", protect, summaryHandler);
router.get("/insights", protect, insightsHandler);
router.get("/doctor-summary", protect, doctorSummaryHandler);

module.exports = router;
module.exports.medicationsHandler = medicationsHandler;
module.exports.diagnosesHandler = diagnosesHandler;
module.exports.symptomsHandler = symptomsHandler;
module.exports.adviceHandler = adviceHandler;
module.exports.timelineHandler = timelineHandler;
module.exports.summaryHandler = summaryHandler;
module.exports.overviewHandler = overviewHandler;
module.exports.buildRepositoryOverview = buildRepositoryOverview;
module.exports.insightsHandler = insightsHandler;
module.exports.doctorSummaryHandler = doctorSummaryHandler;
