const PARAMETER_KEYWORDS = [
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
];

function isHeaderLike(line = "") {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }
  const words = trimmed.split(/\s+/);
  const hasParameterKeyword = PARAMETER_KEYWORDS.some((token) =>
    trimmed.toLowerCase().includes(token),
  );
  return words.length <= 6 && !/\d/.test(trimmed) && !hasParameterKeyword;
}

function isParameterNameLine(line = "") {
  const lower = line.toLowerCase();
  if (/\d/.test(lower)) {
    return false;
  }
  return (
    PARAMETER_KEYWORDS.some((token) => lower.includes(token)) || /[:(]$/.test(lower)
  );
}

function isValueLine(line = "") {
  return /(^|\s)\d+(?:\.\d+)?\s*(mg\/dl|g\/dl|u\/l|%|fL|pg\/ml|ng\/ml|uiu\/ml|10\^3\/ul|10\^6\/ul)?/i.test(
    line,
  );
}

function isReferenceRangeLine(line = "") {
  return (
    /\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?/.test(line) ||
    /(?:<=|>=|<|>)\s*\d+(?:\.\d+)?/.test(line)
  );
}

function averageWordConfidence(words = []) {
  if (!words.length) {
    return null;
  }
  const values = words
    .map((w) => Number(w.confidence || 0))
    .filter((v) => !Number.isNaN(v));
  if (!values.length) {
    return null;
  }
  return (
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
  );
}

function stitchRows(lines = [], wordsMeta = [], options = {}) {
  const maxLookahead = options.maxLookahead || 3;
  const stitched = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = (lines[i] || "").trim();
    if (!current) {
      continue;
    }

    if (isHeaderLike(current)) {
      stitched.push({
        text: current,
        sourceLines: [i],
        sourcePage: null,
        confidence: averageWordConfidence(wordsMeta),
        method: "row_stitch",
      });
      continue;
    }

    if (isParameterNameLine(current) && i + 1 < lines.length) {
      let mergedText = current;
      const sourceLines = [i];
      let lookahead = i + 1;
      let mergedAny = false;

      while (lookahead < lines.length && sourceLines.length <= maxLookahead) {
        const next = (lines[lookahead] || "").trim();
        if (!next || isHeaderLike(next)) {
          break;
        }
        if (isValueLine(next) || isReferenceRangeLine(next)) {
          mergedText = `${mergedText} ${next}`.trim();
          sourceLines.push(lookahead);
          mergedAny = true;
          lookahead += 1;
          continue;
        }
        break;
      }

      stitched.push({
        text: mergedText,
        sourceLines,
        sourcePage: null,
        confidence: averageWordConfidence(wordsMeta),
        method: mergedAny ? "row_stitch" : "row_keep",
      });

      if (mergedAny) {
        i = sourceLines[sourceLines.length - 1];
      }
      continue;
    }

    stitched.push({
      text: current,
      sourceLines: [i],
      sourcePage: null,
      confidence: averageWordConfidence(wordsMeta),
      method: "row_keep",
    });
  }

  return stitched;
}

module.exports = {
  stitchRows,
};
