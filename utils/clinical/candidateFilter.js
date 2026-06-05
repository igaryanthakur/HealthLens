const METADATA_LINE_PATTERN =
  /\b(Patient\s+Name|Age\/Gender|Sample\s+Collection\s+Date|Report\s+Generated\s+On|Laboratory|Lab)\b/i;
const REFERENCE_HINT_PATTERN =
  /\b(range|normal|reference|ref\.?|between|up to|upto|less than|greater than)\b/i;
const UNIT_PATTERN =
  /\b(mg\/dl|g\/dl|u\/l|iu\/l|pg\/ml|ng\/ml|uiu\/ml|mmol\/l|10\^3\/ul|10\^6\/ul|%)\b/i;
const PARAMETER_HINT_PATTERN =
  /\b(hemoglobin|haemoglobin|hb|rbc|wbc|tlc|platelet|pcv|hematocrit|mcv|mch|mchc|rdw|anc|hba1c|glucose|cholesterol|triglycerides|hdl|ldl|vldl|creatinine|urea|bun|egfr|gfr|uric acid|bilirubin|ast|alt|alp|ggt|albumin|protein|serum iron|tibc|uibc|transferrin|vitamin d|vitamin b12|tsh|t3|t4|thyroxine|tri-iodothyronine)\b/i;
const NARRATIVE_HINT_PATTERN =
  /\b(interpretation|remarks|recommended|advised|used for|reflects|individuals|association|reference ranges discussed|therapeutic goals|in these)\b/i;

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function firstKeywordIndex(line) {
  const lower = normalizeLine(line).toLowerCase();
  const keywords = [
    "hemoglobin",
    "haemoglobin",
    "hb",
    "rbc",
    "wbc",
    "tlc",
    "platelet",
    "pcv",
    "hematocrit",
    "mcv",
    "mch",
    "mchc",
    "rdw",
    "anc",
    "hba1c",
    "glucose",
    "cholesterol",
    "triglycerides",
    "hdl",
    "ldl",
    "vldl",
    "creatinine",
    "urea",
    "bun",
    "egfr",
    "gfr",
    "uric acid",
    "bilirubin",
    "ast",
    "alt",
    "alp",
    "ggt",
    "albumin",
    "protein",
    "serum iron",
    "tibc",
    "uibc",
    "transferrin",
    "vitamin d",
    "vitamin b12",
    "tsh",
    "t3",
    "t4",
    "thyroxine",
    "tri-iodothyronine",
  ];

  let bestIndex = -1;
  for (const keyword of keywords) {
    const index = lower.indexOf(keyword);
    if (index >= 0 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  return bestIndex;
}

function lineHasMeasurementSignal(line) {
  const normalized = normalizeLine(line);

  if (!normalized) {
    return false;
  }

  if (METADATA_LINE_PATTERN.test(normalized)) {
    return true;
  }

  const looksNarrative =
    normalized.length > 120 && NARRATIVE_HINT_PATTERN.test(normalized);
  if (looksNarrative) {
    return false;
  }

  const keywordIndex = firstKeywordIndex(normalized);
  const hasNumber = /\d/.test(normalized);
  const hasUnit = UNIT_PATTERN.test(normalized);
  const hasRefHint = REFERENCE_HINT_PATTERN.test(normalized);
  const isShortLabel =
    keywordIndex >= 0 &&
    keywordIndex <= 24 &&
    normalized.length <= 60 &&
    !hasNumber;
  const isRowLike =
    keywordIndex >= 0 &&
    keywordIndex <= 28 &&
    (hasNumber ||
      hasUnit ||
      hasRefHint ||
      /[:\-]/.test(normalized.slice(keywordIndex)));

  if (normalized.length > 160 && !isRowLike) {
    return false;
  }

  return isShortLabel || isRowLike;
}

function filterClinicalCandidates(lines = []) {
  const candidates = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const nextLine = lines[i + 1] || "";
    const keepCurrent =
      METADATA_LINE_PATTERN.test(line) || lineHasMeasurementSignal(line);

    if (keepCurrent) {
      candidates.push({
        line,
        index: i,
        nextLine,
        lookaheadLines: [
          lines[i + 1] || "",
          lines[i + 2] || "",
          lines[i + 3] || "",
        ].filter(Boolean),
      });
    }
  }

  return {
    candidates,
    lines: candidates.map((item) => item.line),
  };
}

module.exports = {
  filterClinicalCandidates,
};
