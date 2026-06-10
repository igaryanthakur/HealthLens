// Doctor Summary data builder (Stage 2.1).
//
// Pure, deterministic consolidation of a user's structured health data into a
// single doctor-readable contract. No Gemini here: the longitudinal insight
// block is rebuilt deterministically via buildDeterministicInsights(). Numbers
// are never re-derived; this only reshapes already-structured data.
//
// Mirrors the dependency-light style of utils/longitudinalInsights.js. Never
// imports frontend code, raw OCR text, AI prompt text, or provenance.

const {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
} = require("./repositoryAggregator");
const { buildTimeline } = require("./timelineBuilder");
const { INSIGHTS_DISCLAIMER } = require("./longitudinalInsights");
const { calculateAge, calculateBmi } = require("./profileContextBuilder");

const TIMELINE_HIGHLIGHT_CAP = 8;

function toTime(date) {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? null : t;
}

function reportId(report) {
  const id = report && (report._id ?? report.id);
  return id != null ? String(id) : undefined;
}

function reportDate(report) {
  return (report && report.reportDate) || (report && report.createdAt) || null;
}

function isLabReport(report) {
  return (
    report &&
    (report.documentType === "lab_report" || report.documentType == null) &&
    Array.isArray(report.measurements) &&
    report.measurements.length > 0
  );
}

// Most recent lab report (the clinically current snapshot), or null.
function latestLabReport(reports) {
  const labs = (Array.isArray(reports) ? reports : []).filter(isLabReport);
  if (!labs.length) return null;
  return labs
    .slice()
    .sort((a, b) => (toTime(a.reportDate) ?? 0) - (toTime(b.reportDate) ?? 0))
    .pop();
}

// Latest valid report date across all reports, or null. Never leaks Invalid Date.
function latestReportDate(reports) {
  const times = (Array.isArray(reports) ? reports : [])
    .map((r) => toTime(reportDate(r)))
    .filter((t) => t != null);
  if (!times.length) return null;
  return new Date(Math.max(...times)).toISOString();
}

function buildPatientBlock(user, { referenceDate = new Date() } = {}) {
  const profile = (user && user.profile) || {};
  const lifestyle = profile.lifestyle || {};

  return {
    name: (user && user.name) || null,
    email: (user && user.email) || null,
    age: calculateAge(profile.dateOfBirth, referenceDate),
    gender: profile.gender || "Unknown",
    bloodGroup: profile.bloodGroup || "Unknown",
    heightCm: profile.heightCm ?? null,
    weightKg: profile.weightKg ?? null,
    bmi: calculateBmi(profile.heightCm, profile.weightKg),
    chronicConditions: Array.isArray(profile.chronicConditions)
      ? profile.chronicConditions
      : [],
    lifestyle: {
      smokingStatus: lifestyle.smokingStatus || "Unknown",
      alcoholConsumption: lifestyle.alcoholConsumption || "Unknown",
    },
  };
}

// All measurements from the most recent lab report, compact + traceable.
function buildLatestVitals(reports) {
  const report = latestLabReport(reports);
  if (!report) return [];

  const id = reportId(report);
  const date = reportDate(report);

  return (report.measurements || []).map((m) => ({
    name: m.name,
    value: m.value,
    unit: m.unit ?? "",
    status: m.status || "unknown",
    referenceRange: m.referenceRange ?? "",
    reportId: id,
    reportDate: date,
  }));
}

// Abnormal (high/low) markers from the most recent lab report, traceable.
function buildAbnormalMarkers(reports) {
  const report = latestLabReport(reports);
  if (!report) return [];

  const id = reportId(report);
  const date = reportDate(report);

  return (report.measurements || [])
    .filter((m) => m && (m.status === "high" || m.status === "low"))
    .map((m) => ({
      marker: m.name,
      value: m.value,
      unit: m.unit ?? "",
      status: m.status,
      referenceRange: m.referenceRange ?? "",
      reportId: id,
      reportDate: date,
    }));
}

// Newest-first timeline events, capped. Reuses the shared timeline builder.
function buildTimelineHighlights(reports) {
  return buildTimeline(reports).slice(0, TIMELINE_HIGHLIGHT_CAP);
}

// Doctor-summary insight subset. Strips generatedBy: the doctor summary does
// not expose whether the brief was AI-reworded or deterministic.
function buildInsightsSubset(insights = {}) {
  return {
    summary: insights.summary || "",
    improvingSignals: insights.improvingSignals || [],
    needsAttention: insights.needsAttention || [],
    doctorQuestions: insights.doctorQuestions || [],
    followUpSuggestions: insights.followUpSuggestions || [],
  };
}

function buildDoctorSummary({
  user,
  reports = [],
  insights = {},
  generatedAt = new Date().toISOString(),
  referenceDate = new Date(),
} = {}) {
  const medications = aggregateMedications(reports);
  const diagnoses = aggregateDiagnoses(reports);
  const symptoms = aggregateSymptoms(reports);
  const advice = aggregateAdvice(reports);
  const latestVitals = buildLatestVitals(reports);
  const abnormalMarkers = buildAbnormalMarkers(reports);
  const timelineHighlights = buildTimelineHighlights(reports);

  const list = Array.isArray(reports) ? reports : [];
  const labReportCount = list.filter(isLabReport).length;
  const activeConditionCount = diagnoses.filter(
    (d) => d.latestStatus === "active",
  ).length;

  return {
    patient: buildPatientBlock(user, { referenceDate }),
    snapshot: {
      totalReports: list.length,
      latestReportDate: latestReportDate(reports),
      labReportCount,
      activeConditionCount,
      currentMedicationCount: medications.length,
      abnormalMarkerCount: abnormalMarkers.length,
    },
    medications,
    diagnoses,
    symptoms,
    advice,
    latestVitals,
    abnormalMarkers,
    timelineHighlights,
    insights: buildInsightsSubset(insights),
    disclaimer: INSIGHTS_DISCLAIMER,
    generatedAt,
  };
}

module.exports = {
  buildDoctorSummary,
  buildPatientBlock,
  buildLatestVitals,
  buildAbnormalMarkers,
  buildTimelineHighlights,
};
