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

module.exports = {
  classifyReport,
};
