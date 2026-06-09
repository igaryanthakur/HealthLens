// Unified health-timeline data model (Stage 3 / I8).
//
// Derives a normalized chronological event stream from the user's reports,
// computed-on-read (no persisted events collection). One event per report,
// typed by documentType. Powers the calendar, the dashboard timeline, and
// future timeline PDF exports.

const TYPE_BY_DOCUMENT = {
  lab_report: "test",
  scan_report: "scan",
  prescription: "prescription",
  discharge_summary: "consultation",
  typed_note: "note",
  unknown: "document",
};

const TITLE_BY_TYPE = {
  test: "Lab test",
  scan: "Scan",
  prescription: "Prescription",
  consultation: "Consultation",
  note: "Clinical note",
  document: "Document",
};

function toTime(date) {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function reportId(report) {
  const id = report && (report._id ?? report.id);
  return id != null ? String(id) : undefined;
}

function eventType(documentType) {
  return TYPE_BY_DOCUMENT[documentType] || "document";
}

function len(value) {
  return Array.isArray(value) ? value.length : 0;
}

function buildSummary(report, counts) {
  const summary = report.aiInterpretation && report.aiInterpretation.summary;
  if (summary && String(summary).trim()) {
    return String(summary).trim();
  }

  const parts = [];
  if (counts.measurements) parts.push(`${counts.measurements} measurements`);
  if (counts.medications) parts.push(`${counts.medications} medications`);
  if (counts.diagnoses) parts.push(`${counts.diagnoses} diagnoses`);
  if (counts.symptoms) parts.push(`${counts.symptoms} symptoms`);
  if (counts.advice) parts.push(`${counts.advice} advice items`);

  return parts.length ? parts.join(", ") : "No structured data recorded.";
}

// buildTimeline(reports, { order }) -> normalized event array.
// order: "desc" (default, most recent first) or "asc".
function buildTimeline(reports, options = {}) {
  const list = Array.isArray(reports) ? reports : [];
  const order = options.order === "asc" ? "asc" : "desc";

  const events = list.map((report) => {
    const type = eventType(report.documentType);
    const counts = {
      measurements: len(report.measurements),
      medications: len(report.medications),
      diagnoses: len(report.diagnoses),
      symptoms: len(report.symptoms),
      advice: len(report.doctorAdvice) + len(report.testsAdvised),
    };

    const event = {
      id: reportId(report),
      type,
      date: report.reportDate || report.createdAt || null,
      documentType: report.documentType || "unknown",
      reportType: report.reportType,
      title: TITLE_BY_TYPE[type] || "Document",
      summary: buildSummary(report, counts),
      counts,
    };

    if (typeof report.vitalityScore === "number") {
      event.vitalityScore = report.vitalityScore;
    }

    return event;
  });

  events.sort((a, b) =>
    order === "asc" ? toTime(a.date) - toTime(b.date) : toTime(b.date) - toTime(a.date),
  );

  return events;
}

module.exports = {
  buildTimeline,
  eventType,
  TYPE_BY_DOCUMENT,
};
