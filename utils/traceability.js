function mergeBBoxes(boxes = []) {
  if (boxes.length === 0) {
    return null;
  }

  const xMin = Math.min(...boxes.map((b) => b.x0));
  const yMin = Math.min(...boxes.map((b) => b.y0));
  const xMax = Math.max(...boxes.map((b) => b.x1));
  const yMax = Math.max(...boxes.map((b) => b.y1));

  return {
    x: xMin,
    y: yMin,
    w: xMax - xMin,
    h: yMax - yMin,
  };
}

function findWordsForToken(words = [], token = "") {
  if (!token) {
    return [];
  }

  const tokenNorm = token.toLowerCase();
  return words.filter((word) => (word.text || "").toLowerCase().includes(tokenNorm));
}

function computeConfidence({ wordConfidences = [], matchType = "regex_exact", sanityOk = true, confidenceSource = "ocr" }) {
  const avgWordConfidence =
    wordConfidences.length > 0
      ? wordConfidences.reduce((sum, c) => sum + c, 0) / wordConfidences.length
      : confidenceSource === "text_only"
        ? 85
        : 60;

  const base = avgWordConfidence / 100;
  let matchWeight = 0;
  if (matchType === "regex_exact") {
    matchWeight = 0.15;
  } else if (matchType === "regex_fuzzy") {
    matchWeight = 0.05;
  } else if (matchType === "ai_inferred") {
    matchWeight = -0.1;
  }

  let score = Math.min(1, Math.max(0, base * 0.8 + matchWeight));
  if (!sanityOk) {
    score *= 0.6;
  }

  return Math.round(score * 100) / 100;
}

function attachTraceability(measurement, ocrPages = []) {
  if (!measurement || !measurement.rawValue) {
    return measurement;
  }

  const allWords = ocrPages.flatMap((page) =>
    (page.words || []).map((word) => ({ ...word, pageIndex: page.pageIndex }))
  );
  const tokenWords = findWordsForToken(allWords, String(measurement.rawValue));

  if (tokenWords.length === 0) {
    return {
      ...measurement,
      sourcePage: ocrPages[0] ? ocrPages[0].pageIndex + 1 : null,
      sourceBBox: null,
      sourceLine: measurement.sourceIndex ?? null,
      confidenceSource: ocrPages.length > 0 ? "ocr" : "text_only",
    };
  }

  const merged = mergeBBoxes(tokenWords.map((word) => word.bbox).filter(Boolean));
  const pageIndex = tokenWords[0].pageIndex;
  const approxLine = merged ? Math.floor(merged.y / 20) : null;

  return {
    ...measurement,
    sourcePage: pageIndex + 1,
    sourceBBox: merged,
    sourceLine: approxLine,
    confidenceSource: "ocr",
    _wordConfidences: tokenWords.map((word) => Number(word.confidence || 0)),
  };
}

module.exports = {
  mergeBBoxes,
  findWordsForToken,
  computeConfidence,
  attachTraceability,
};
