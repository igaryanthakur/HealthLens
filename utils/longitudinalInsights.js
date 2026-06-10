// Longitudinal health intelligence (Stage 1.2).
//
// Pure, deterministic logic over a user's report history. No Gemini here: the AI
// layer (services/aiService.js) only rewords the deterministic facts produced
// here, and falls back to buildDeterministicInsights() when it is unavailable.
//
// Mirrors client/src/lib/trends.js conceptually but stays backend-only; do NOT
// import frontend code.

const { buildTimeline } = require("./timelineBuilder");
const {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
} = require("./repositoryAggregator");

const INSIGHTS_DISCLAIMER =
  "HealthLens AI provides informational insights based on uploaded records. It does not diagnose, prescribe treatment, or replace professional medical advice.";

function toTime(date) {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function resolveValue(measurement) {
  if (!measurement) return null;
  if (typeof measurement.value === "number") return measurement.value;
  const raw = Number(measurement.value);
  return Number.isFinite(raw) ? raw : null;
}

function titleCase(name) {
  return String(name || "")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isLabReport(report) {
  return (
    report &&
    (report.documentType === "lab_report" || report.documentType == null) &&
    Array.isArray(report.measurements) &&
    report.measurements.length > 0
  );
}

// Only lab reports carry numeric measurements, sorted chronologically ascending.
function labReportsAsc(reports) {
  const list = Array.isArray(reports) ? reports : [];
  return list
    .filter(isLabReport)
    .slice()
    .sort((a, b) => toTime(a.reportDate) - toTime(b.reportDate));
}

// Returns { [metricKey]: { label, unit, points: [{ date, value, status, referenceRange }] } }
function buildMetricSeries(reports = []) {
  const series = {};

  for (const report of labReportsAsc(reports)) {
    const date = report.reportDate;
    for (const measurement of report.measurements ?? []) {
      const key = String(measurement.name || "")
        .trim()
        .toLowerCase();
      if (!key) continue;

      const value = resolveValue(measurement);
      if (value == null) continue;

      if (!series[key]) {
        series[key] = {
          label: titleCase(measurement.name),
          unit: measurement.unit ?? "",
          points: [],
        };
      }
      if (!series[key].unit) {
        series[key].unit = measurement.unit ?? "";
      }

      series[key].points.push({
        date,
        value,
        status: measurement.status,
        referenceRange: measurement.referenceRange,
      });
    }
  }

  for (const key of Object.keys(series)) {
    series[key].points.sort((a, b) => toTime(a.date) - toTime(b.date));
  }

  return series;
}

// Categorizes a single marker's movement between the previous and latest lab.
function classifyChange(previous, latest) {
  const prevAbnormal = previous.status === "high" || previous.status === "low";
  const latestAbnormal = latest.status === "high" || latest.status === "low";

  if (!prevAbnormal && latestAbnormal) return "new_abnormal";
  if (prevAbnormal && !latestAbnormal) return "resolved_to_normal";

  if (!latestAbnormal && !prevAbnormal) {
    if (latest.value === previous.value) return "stable";
    return "improved"; // movement while staying within normal range
  }

  // Both abnormal: did it move toward the reference range?
  if (latest.status === "high") {
    if (latest.value < previous.value) return "improving_but_still_high";
    if (latest.value > previous.value) return "worsened";
    return "stable";
  }
  if (latest.status === "low") {
    if (latest.value > previous.value) return "improving_but_still_low";
    if (latest.value < previous.value) return "worsened";
    return "stable";
  }

  return "stable";
}

// Compares the latest lab report to the previous one (lab reports only).
function compareLatestToPrevious(reports = []) {
  const labs = labReportsAsc(reports);
  if (labs.length < 2) {
    return {
      latestReportDate: labs[0]?.reportDate ?? null,
      previousReportDate: null,
      changedMarkers: [],
    };
  }

  const latest = labs[labs.length - 1];
  const previous = labs[labs.length - 2];

  const previousByKey = new Map();
  for (const m of previous.measurements ?? []) {
    const key = String(m.name || "")
      .trim()
      .toLowerCase();
    if (key) previousByKey.set(key, m);
  }

  const changedMarkers = [];
  for (const m of latest.measurements ?? []) {
    const key = String(m.name || "")
      .trim()
      .toLowerCase();
    if (!key) continue;

    const prev = previousByKey.get(key);
    const latestValue = resolveValue(m);
    const prevValue = resolveValue(prev);
    if (prev == null || latestValue == null || prevValue == null) continue;

    const delta = Math.round((latestValue - prevValue) * 100) / 100;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

    changedMarkers.push({
      name: titleCase(m.name),
      latest: latestValue,
      previous: prevValue,
      delta,
      direction,
      status: m.status,
      unit: m.unit ?? "",
      referenceRange: m.referenceRange ?? "",
      interpretation: classifyChange(
        { value: prevValue, status: prev.status },
        { value: latestValue, status: m.status },
      ),
    });
  }

  return {
    latestReportDate: latest.reportDate ?? null,
    previousReportDate: previous.reportDate ?? null,
    changedMarkers,
  };
}

// Compact a report into the minimal structured shape safe to send to Gemini.
function compactLabReport(report) {
  if (!report) return null;
  return {
    reportDate: report.reportDate ?? null,
    documentType: report.documentType ?? "lab_report",
    measurements: (report.measurements ?? []).map((m) => ({
      name: m.name,
      value: resolveValue(m),
      unit: m.unit ?? "",
      status: m.status,
      referenceRange: m.referenceRange ?? "",
    })),
  };
}

// Assembles the structured-only context object. Report objects are compacted;
// full Mongoose documents and raw OCR text are never included.
function buildInsightsContext({ reports = [], user = null } = {}) {
  const labs = labReportsAsc(reports);
  const comparisons = compareLatestToPrevious(reports);

  return {
    profile: user?.profile ?? {},
    labReportCount: labs.length,
    latestReport: compactLabReport(labs[labs.length - 1] ?? null),
    previousReport: compactLabReport(labs[labs.length - 2] ?? null),
    metricSeries: buildMetricSeries(reports),
    comparisons,
    medications: aggregateMedications(reports),
    diagnoses: aggregateDiagnoses(reports),
    symptoms: aggregateSymptoms(reports),
    advice: aggregateAdvice(reports),
    timeline: buildTimeline(reports),
  };
}

function fmt(marker) {
  const unit = marker.unit ? ` ${marker.unit}` : "";
  return `${marker.name} ${marker.direction === "down" ? "decreased" : marker.direction === "up" ? "increased" : "held"} from ${marker.previous} to ${marker.latest}${unit}`;
}

// Deterministic insights derived purely from the structured context. Used both
// as the no-AI fallback and as the educational state when fewer than 2 labs
// exist.
function buildDeterministicInsights(context = {}) {
  const base = {
    summary: "",
    whatChanged: [],
    improvingSignals: [],
    needsAttention: [],
    riskFlags: [],
    doctorQuestions: [],
    followUpSuggestions: [],
    disclaimer: INSIGHTS_DISCLAIMER,
    generatedBy: "deterministic",
  };

  const labCount = context.labReportCount ?? 0;

  if (labCount === 0) {
    return {
      ...base,
      summary:
        "No lab reports are available yet. Upload a lab report to begin building your longitudinal health intelligence.",
    };
  }

  if (labCount === 1) {
    return {
      ...base,
      summary:
        "Only one lab report is available, so trend comparison is not possible yet. Upload another lab report to unlock what changed since your last report.",
      followUpSuggestions: [
        "Upload a follow-up lab report to enable trend tracking.",
      ],
    };
  }

  const markers = context.comparisons?.changedMarkers ?? [];

  const improving = [];
  const attention = [];
  const risks = [];

  for (const m of markers) {
    switch (m.interpretation) {
      case "improved":
        improving.push(fmt(m));
        break;
      case "resolved_to_normal":
        improving.push(`${m.name} returned to the normal range (now ${m.latest}${m.unit ? ` ${m.unit}` : ""})`);
        break;
      case "improving_but_still_high":
        improving.push(fmt(m));
        attention.push(`${m.name} is improving but still high (${m.latest}${m.unit ? ` ${m.unit}` : ""})`);
        break;
      case "improving_but_still_low":
        improving.push(fmt(m));
        attention.push(`${m.name} is improving but still low (${m.latest}${m.unit ? ` ${m.unit}` : ""})`);
        break;
      case "worsened":
        attention.push(`${fmt(m)} (worsening)`);
        risks.push(`${m.name} moved further from the normal range`);
        break;
      case "new_abnormal":
        attention.push(`${m.name} is newly outside the normal range (${m.latest}${m.unit ? ` ${m.unit}` : ""})`);
        risks.push(`${m.name} became abnormal since the previous report`);
        break;
      case "stable":
      default:
        if (m.status === "high" || m.status === "low") {
          attention.push(`${m.name} remains ${m.status} (${m.latest}${m.unit ? ` ${m.unit}` : ""})`);
        }
        break;
    }
  }

  const summaryParts = [];
  if (improving.length) {
    summaryParts.push(`Improvements observed in ${improving.length} marker${improving.length > 1 ? "s" : ""}`);
  }
  if (attention.length) {
    summaryParts.push(`${attention.length} marker${attention.length > 1 ? "s" : ""} may still need attention`);
  }
  const summary = summaryParts.length
    ? `Comparing your latest lab report with the previous one: ${summaryParts.join(", ")}. These trends are worth discussing with your doctor.`
    : "Your latest lab report shows no significant changes compared with the previous one. Continue routine monitoring as advised.";

  const doctorQuestions = [];
  const followUpSuggestions = [
    "Review these trends with your doctor.",
    "Continue following prescribed medication and lifestyle advice.",
  ];

  if (attention.some((a) => /hba1c/i.test(a)) || improving.some((a) => /hba1c/i.test(a))) {
    doctorQuestions.push("Should I continue monitoring HbA1c every 3 months?");
    followUpSuggestions.push("Track repeat HbA1c or fasting glucose as advised.");
  }
  if (attention.some((a) => /glucose/i.test(a)) || improving.some((a) => /glucose/i.test(a))) {
    doctorQuestions.push("Are my current glucose trends improving as expected?");
  }
  if (attention.some((a) => /cholesterol/i.test(a))) {
    doctorQuestions.push("Should cholesterol management be reviewed?");
  }
  if (!doctorQuestions.length) {
    doctorQuestions.push("Are there any markers I should keep monitoring?");
  }

  return {
    ...base,
    summary,
    whatChanged: markers.map((m) => fmt(m)),
    improvingSignals: improving,
    needsAttention: attention,
    riskFlags: risks,
    doctorQuestions,
    followUpSuggestions,
  };
}

module.exports = {
  INSIGHTS_DISCLAIMER,
  buildMetricSeries,
  compareLatestToPrevious,
  buildInsightsContext,
  buildDeterministicInsights,
};
