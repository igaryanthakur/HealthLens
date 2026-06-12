const REPORT_TYPE_RULES = {
  CBC: ["hemoglobin", "rbc", "wbc", "platelet", "mcv", "mch", "mchc", "rdw"],
  Diabetes: ["hba1c", "glucose", "random glucose", "fasting glucose"],
  LIPID: ["lipid profile", "cholesterol", "hdl", "ldl", "triglycerides", "vldl"],
  KIDNEY: ["creatinine", "urea", "egfr", "uric acid"],
  LIVER: ["bilirubin", "ast", "alt", "alp", "ggt", "albumin"],
  THYROID: ["tsh", "t3", "t4", "thyroxine", "tri-iodothyronine"],
};

function classifyReport(text = "") {
  const lower = text.toLowerCase();
  const scores = [];

  for (const [type, tokens] of Object.entries(REPORT_TYPE_RULES)) {
    let score = 0;
    for (const token of tokens) {
      if (lower.includes(token)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores.push({ type, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  return {
    primaryReportType: scores[0]?.type || null,
    reportTypes: scores,
  };
}

// Flattened union of all lab-panel tokens, used to detect the broad
// "lab_report" document type (distinct from the lab-panel sub-type above).
const LAB_TOKENS = Array.from(
  new Set(Object.values(REPORT_TYPE_RULES).flat()),
);

// Keyword rule sets for the orthogonal documentType dimension. Phrases are
// matched as substrings; short/ambiguous tokens use word boundaries to avoid
// false positives inside unrelated words.
const DOCUMENT_TYPE_RULES = {
  prescription: [
    "rx",
    "tab",
    "tablet",
    "cap",
    "capsule",
    "sig",
    "bd",
    "od",
    "tds",
    "twice daily",
    "after food",
    "before food",
    "refill",
  ],
  scan_report: [
    "x-ray",
    "ultrasound",
    "usg",
    "ct scan",
    "mri",
    "impression",
    "radiologist",
  ],
  discharge_summary: [
    "discharge summary",
    "date of admission",
    "date of discharge",
    "hospital course",
    "discharge medication",
  ],
  lab_report: LAB_TOKENS,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenMatches(lowerText, token) {
  // Multi-word phrases: plain substring match.
  if (token.includes(" ") || token.includes("-")) {
    return lowerText.includes(token);
  }
  // Single tokens: require word boundaries so "od" does not match "good", etc.
  const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`);
  return pattern.test(lowerText);
}

/**
 * Classifies the broad document type that drives pipeline routing.
 * Orthogonal to classifyReport (which returns the lab-panel sub-type).
 *
 * @param {string} text - Cleaned full document text.
 * @returns {{ documentType: string, scores: Array<{type: string, score: number}> }}
 */
function classifyDocumentType(text = "") {
  const lower = text.toLowerCase();
  const scores = [];

  for (const [type, tokens] of Object.entries(DOCUMENT_TYPE_RULES)) {
    let score = 0;
    for (const token of tokens) {
      if (tokenMatches(lower, token)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores.push({ type, score });
    }
  }

  // Highest score wins; ties break toward lab_report when lab tokens are
  // present (lab panels are the most common and best-supported input).
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.type === "lab_report") return -1;
    if (b.type === "lab_report") return 1;
    return 0;
  });

  if (scores.length > 0) {
    return {
      documentType: scores[0].type,
      scores,
    };
  }

  // Auto fallback: any lab-panel rubric → lab_report; otherwise treat as prescription
  // (handwritten scripts often fail keyword rules after OCR).
  const hasLabToken = LAB_TOKENS.some((token) => tokenMatches(lower, token));
  if (hasLabToken) {
    return { documentType: "lab_report", scores: [] };
  }

  if (text.trim()) {
    return { documentType: "prescription", scores: [] };
  }

  return { documentType: "unknown", scores: [] };
}

module.exports = {
  classifyReport,
  classifyDocumentType,
};
