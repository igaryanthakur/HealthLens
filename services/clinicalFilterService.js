const { extractMetadata } = require("../utils/clinical/metadataPrepass");
const { removeBoilerplate } = require("../utils/clinical/boilerplateRemoval");
const {
  extractMeasurements,
  getDefinitionsForSection,
  getHighPriorityDefinitions,
} = require("../utils/clinical/parameterRegexMap");
const { parseReferenceRange } = require("../utils/clinical/referenceRangeParser");
const { applyStatusAndPriority } = require("../utils/clinical/statusPriorityEngine");
const { dedupeMeasurements } = require("../utils/clinical/dedupeProvenance");
const { resolveCanonical } = require("../utils/standardizeNames");
const { normalizeUnit } = require("../utils/unitNormalizer");
const { validateValue } = require("./validationSanityEngine");
const { classifyReport } = require("./reportClassifier");
const { attachTraceability, computeConfidence } = require("../utils/traceability");
const { computeClinicalFlags } = require("./clinicalFlags");
const { buildCleanedTextClinical } = require("../utils/clinicalFilter");

function normalizeReportDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const trimmed = dateValue.trim();
  const slashNumeric = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashNumeric) {
    const day = slashNumeric[1].padStart(2, "0");
    const month = slashNumeric[2].padStart(2, "0");
    const year = slashNumeric[3].length === 2 ? `20${slashNumeric[3]}` : slashNumeric[3];
    return `${year}-${month}-${day}`;
  }

  const slashMonthText = trimmed.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/);
  if (slashMonthText) {
    const monthMap = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const day = slashMonthText[1].padStart(2, "0");
    const month = monthMap[slashMonthText[2].toLowerCase()] || "01";
    const year = slashMonthText[3];
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

function rowsToCandidates(rows = [], baseIndex = 0) {
  return rows.map((row, idx) => {
    const currentIndex = baseIndex + idx;
    return {
      line: row.text,
      index: row.sourceLines?.[0] ?? currentIndex,
      sourceLines: row.sourceLines || [currentIndex],
      nextLine: rows[idx + 1]?.text || "",
      lookaheadLines: [rows[idx + 1]?.text || "", rows[idx + 2]?.text || "", rows[idx + 3]?.text || ""].filter(Boolean),
    };
  });
}

function filterClinicalData(cleanedTextFull, options = {}) {
  const { ocrPages = [], stitchedRows = [], sections = [] } = options;
  const patientInfo = extractMetadata(cleanedTextFull);
  patientInfo.reportDate = normalizeReportDate(patientInfo.reportDate);
  const reportClassification = classifyReport(cleanedTextFull);

  const baseRows =
    stitchedRows.length > 0
      ? stitchedRows
      : removeBoilerplate(cleanedTextFull).lines.map((line, idx) => ({
          text: line,
          sourceLines: [idx],
          sourcePage: null,
          confidence: null,
          method: "row_keep",
        }));

  const sectionBlocks =
    sections.length > 0
      ? sections
      : [
          {
            section: reportClassification.primaryReportType || "UNKNOWN",
            startLine: 0,
            endLine: baseRows.length - 1,
            rows: baseRows,
            pageStart: null,
            pageEnd: null,
          },
        ];

  const scopedMeasurements = [];
  for (const block of sectionBlocks) {
    const definitions = getDefinitionsForSection(block.section);
    if (!definitions.length) {
      continue;
    }
    const blockCandidates = rowsToCandidates(block.rows, block.startLine);
    const extracted = extractMeasurements(blockCandidates, { definitions });
    scopedMeasurements.push(
      ...extracted.map((item) => ({
        ...item,
        extractionScope: block.section,
      }))
    );
  }

  const foundNames = new Set(scopedMeasurements.map((m) => m.name.toLowerCase()));
  const fallbackDefinitions = getHighPriorityDefinitions(reportClassification.primaryReportType);
  const fallbackCandidates = rowsToCandidates(baseRows, 0);
  const fallbackRaw = extractMeasurements(fallbackCandidates, {
    definitions: fallbackDefinitions,
  }).filter(
    (item) => !foundNames.has(item.name.toLowerCase())
  );

  const rawMeasurements = [...scopedMeasurements, ...fallbackRaw.map((item) => ({ ...item, extractionScope: "FALLBACK" }))];

  const measurementsWithRanges = rawMeasurements.map((measurement, index) => {
    const parsedRange = parseReferenceRange(measurement.reference_range || "");
    const canonical = resolveCanonical(measurement.name);
    const normalizedUnit = normalizeUnit(measurement.rawUnit || measurement.unit);
    const normalizedValue = Number(measurement.value);
    const validation = validateValue(canonical.canonicalId, normalizedValue);
    const traceable = attachTraceability(
      {
        ...measurement,
        id: canonical.canonicalId,
        name: canonical.canonicalName || measurement.name.toLowerCase(),
        category: canonical.category || measurement.category,
        priority: canonical.priority || measurement.priority,
        normalizedValue,
        normalizedUnit,
      },
      ocrPages
    );

    const confidence = computeConfidence({
      wordConfidences: traceable._wordConfidences || [],
      matchType: measurement.method || "regex_exact",
      sanityOk: validation.ok,
      confidenceSource: traceable.confidenceSource || "text_only",
    });

    return {
      ...traceable,
      id: canonical.canonicalId,
      name: canonical.canonicalName || measurement.name.toLowerCase(),
      category: canonical.category || measurement.category,
      priority: canonical.priority || measurement.priority,
      rawValue: measurement.rawValue || String(measurement.value),
      normalizedValue,
      rawUnit: measurement.rawUnit || measurement.unit || null,
      unit: normalizedUnit || measurement.unit || null,
      normalizedUnit,
      reference_range: parsedRange.text || measurement.reference_range || null,
      referenceRangeParsed: parsedRange.parsed,
      confidence,
      validation,
      sourceLineText: measurement.sourceLine,
      sourceLine: traceable.sourceLine ?? measurement.sourceIndex ?? null,
      sourceLines: measurement.sourceLines || [measurement.sourceIndex],
      method: measurement.method || "regex_exact",
      confidenceSource: traceable.confidenceSource || "text_only",
      _order: index,
    };
  });

  const statusApplied = measurementsWithRanges.map(applyStatusAndPriority);
  const deduped = dedupeMeasurements(statusApplied);
  const flagsOutput = computeClinicalFlags({
    measurements: deduped,
    patient_info: patientInfo,
  });

  const statusUnknownCount = deduped.filter((item) => item.status == null).length;
  const notes =
    statusUnknownCount > 0
      ? `${statusUnknownCount} measurement(s) could not be assigned status due to missing range/threshold.`
      : null;

  const cleanedTextClinical = buildCleanedTextClinical(patientInfo, deduped);

  return {
    cleanedTextClinical,
    structured: {
      patient_info: patientInfo,
      reportType: reportClassification.primaryReportType,
      reportTypes: reportClassification.reportTypes,
      sections: sectionBlocks.map((block) => ({
        section: block.section,
        startLine: block.startLine,
        endLine: block.endLine,
        rowCount: block.rows.length,
      })),
      measurements: deduped.map(({ reference_range, _wordConfidences, _order, ...rest }) => ({
        ...rest,
        referenceRange: reference_range,
      })),
      flags: flagsOutput.flags,
      severity: flagsOutput.severity,
      notes,
    },
  };
}

module.exports = {
  filterClinicalData,
};
