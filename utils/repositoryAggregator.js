// Cross-report aggregation for the Personal Health Repository (Stage 3 / I7).
//
// Pure, dependency-light functions over an array of report objects (Mongoose
// documents or plain objects). Each rollup returns the "both" shape: a deduped
// group plus the per-occurrence detail backing it. Numbers/vitals are never
// rolled up here (that lives in the lab measurements lane).

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toTime(date) {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function reportId(report) {
  const id = report && (report._id ?? report.id);
  return id != null ? String(id) : undefined;
}

function reportDate(report) {
  return (report && report.reportDate) || (report && report.createdAt) || null;
}

// Generic grouping helper. `extractItems` returns an array of
// { key, display, occurrence } for a single report; occurrences are collected
// per key, then sorted chronologically and summarized.
function groupAcrossReports(reports, extractItems, summarize) {
  const list = Array.isArray(reports) ? reports : [];
  const groups = new Map();

  for (const report of list) {
    const items = extractItems(report) || [];
    for (const item of items) {
      if (!item || !item.key) {
        continue;
      }
      if (!groups.has(item.key)) {
        groups.set(item.key, { display: item.display, occurrences: [] });
      }
      const group = groups.get(item.key);
      // Prefer the most recently seen display label.
      group.display = item.display || group.display;
      group.occurrences.push(item.occurrence);
    }
  }

  const result = [];
  for (const group of groups.values()) {
    const occurrences = group.occurrences
      .slice()
      .sort((a, b) => toTime(a.reportDate) - toTime(b.reportDate));
    result.push(summarize(group.display, occurrences));
  }

  // Most recently active groups first.
  result.sort((a, b) => toTime(b.lastSeen) - toTime(a.lastSeen));
  return result;
}

function aggregateMedications(reports) {
  return groupAcrossReports(
    reports,
    (report) =>
      (report.medications || [])
        .filter((m) => m && m.name)
        .map((m) => ({
          key: normalizeKey(m.name),
          display: String(m.name).trim(),
          occurrence: {
            reportId: reportId(report),
            reportDate: reportDate(report),
            documentType: report.documentType,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            route: m.route,
            confidence: m.confidence,
            uncertain: Boolean(m.uncertain),
          },
        })),
    (display, occurrences) => {
      const latest = occurrences[occurrences.length - 1] || {};
      return {
        name: display,
        count: occurrences.length,
        firstSeen: occurrences[0] ? occurrences[0].reportDate : null,
        lastSeen: latest.reportDate || null,
        latest: {
          dosage: latest.dosage,
          frequency: latest.frequency,
          duration: latest.duration,
          route: latest.route,
        },
        uncertain: occurrences.some((o) => o.uncertain),
        occurrences,
      };
    },
  );
}

function aggregateDiagnoses(reports) {
  return groupAcrossReports(
    reports,
    (report) =>
      (report.diagnoses || [])
        .filter((d) => d && d.condition)
        .map((d) => ({
          key: normalizeKey(d.condition),
          display: String(d.condition).trim(),
          occurrence: {
            reportId: reportId(report),
            reportDate: reportDate(report),
            documentType: report.documentType,
            status: d.status || "unknown",
            confidence: d.confidence,
            uncertain: Boolean(d.uncertain),
          },
        })),
    (display, occurrences) => {
      const latest = occurrences[occurrences.length - 1] || {};
      return {
        condition: display,
        count: occurrences.length,
        firstSeen: occurrences[0] ? occurrences[0].reportDate : null,
        lastSeen: latest.reportDate || null,
        latestStatus: latest.status || "unknown",
        uncertain: occurrences.some((o) => o.uncertain),
        occurrences,
      };
    },
  );
}

function aggregateSymptoms(reports) {
  return groupAcrossReports(
    reports,
    (report) =>
      (report.symptoms || [])
        .filter((s) => s && s.description)
        .map((s) => ({
          key: normalizeKey(s.description),
          display: String(s.description).trim(),
          occurrence: {
            reportId: reportId(report),
            reportDate: reportDate(report),
            documentType: report.documentType,
            confidence: s.confidence,
            uncertain: Boolean(s.uncertain),
          },
        })),
    (display, occurrences) => {
      const latest = occurrences[occurrences.length - 1] || {};
      return {
        description: display,
        count: occurrences.length,
        firstSeen: occurrences[0] ? occurrences[0].reportDate : null,
        lastSeen: latest.reportDate || null,
        uncertain: occurrences.some((o) => o.uncertain),
        occurrences,
      };
    },
  );
}

// Rolls up both doctorAdvice[] and testsAdvised[] (plain string lists). The
// `kind` field distinguishes advice from a recommended test within each group.
function aggregateAdvice(reports) {
  return groupAcrossReports(
    reports,
    (report) => {
      const items = [];
      for (const advice of report.doctorAdvice || []) {
        if (typeof advice === "string" && advice.trim()) {
          items.push({
            key: `advice:${normalizeKey(advice)}`,
            display: advice.trim(),
            occurrence: {
              reportId: reportId(report),
              reportDate: reportDate(report),
              documentType: report.documentType,
              kind: "advice",
            },
          });
        }
      }
      for (const testAdvised of report.testsAdvised || []) {
        if (typeof testAdvised === "string" && testAdvised.trim()) {
          items.push({
            key: `test:${normalizeKey(testAdvised)}`,
            display: testAdvised.trim(),
            occurrence: {
              reportId: reportId(report),
              reportDate: reportDate(report),
              documentType: report.documentType,
              kind: "test",
            },
          });
        }
      }
      return items;
    },
    (display, occurrences) => {
      const latest = occurrences[occurrences.length - 1] || {};
      return {
        text: display,
        kind: latest.kind || "advice",
        count: occurrences.length,
        firstSeen: occurrences[0] ? occurrences[0].reportDate : null,
        lastSeen: latest.reportDate || null,
        occurrences,
      };
    },
  );
}

module.exports = {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
  normalizeKey,
};
