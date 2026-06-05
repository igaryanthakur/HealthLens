const HEADER_MAP = {
  CBC: ["complete blood count", "cbc", "hemogram"],
  LIVER: ["liver function", "liver function test", "lft"],
  LIPID: ["lipid profile", "cholesterol profile", "lipid"],
  KIDNEY: ["kidney function", "renal function", "rft"],
  IRON: ["iron study", "iron studies", "iron profile"],
  THYROID: ["thyroid profile", "thyroid function", "tsh", "t3", "t4"],
  VITAMINS: ["vitamin d", "vitamin b12"],
  DIABETES: ["hba1c", "glucose", "diabetes profile"],
};

function normalizeHeader(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a, b) {
  const tokensA = new Set(normalizeHeader(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeHeader(b).split(" ").filter(Boolean));
  if (!tokensA.size || !tokensB.size) {
    return 0;
  }
  let common = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) {
      common += 1;
    }
  }
  return common / Math.max(tokensA.size, tokensB.size);
}

function detectHeaderSection(line = "") {
  const normalized = normalizeHeader(line);
  if (!normalized) {
    return null;
  }

  const wordCount = normalized.split(" ").length;
  if (wordCount > 6) {
    return null;
  }

  let best = null;
  let bestScore = 0;
  for (const [section, labels] of Object.entries(HEADER_MAP)) {
    for (const label of labels) {
      if (normalized.includes(label)) {
        return section;
      }
      const score = tokenOverlap(normalized, label);
      if (score >= 0.6 && score > bestScore) {
        best = section;
        bestScore = score;
      }
    }
  }

  return best;
}

function isMeasurementLike(line = "") {
  return /\d/.test(line) && /(mg\/dl|g\/dl|u\/l|%|fL|pg\/ml|ng\/ml|uiu\/ml|10\^3\/ul|10\^6\/ul|\d+\.\d+)/i.test(line);
}

function extractSections(stitchedRows = []) {
  const blocks = [];
  let i = 0;

  while (i < stitchedRows.length) {
    const row = stitchedRows[i];
    const section = detectHeaderSection(row.text);
    if (!section) {
      i += 1;
      continue;
    }

    const start = i;
    let end = i;
    let nonMeasurementGap = 0;
    let j = i + 1;

    while (j < stitchedRows.length) {
      const maybeHeader = detectHeaderSection(stitchedRows[j].text);
      if (maybeHeader) {
        break;
      }

      if (isMeasurementLike(stitchedRows[j].text)) {
        nonMeasurementGap = 0;
      } else {
        nonMeasurementGap += 1;
      }

      if (nonMeasurementGap >= 4) {
        break;
      }
      end = j;
      j += 1;
    }

    const rows = stitchedRows.slice(start, end + 1);
    blocks.push({
      section,
      startLine: start,
      endLine: end,
      rows,
      pageStart: null,
      pageEnd: null,
    });

    i = Math.max(j, i + 1);
  }

  if (blocks.length === 0 && stitchedRows.length > 0) {
    blocks.push({
      section: "UNKNOWN",
      startLine: 0,
      endLine: stitchedRows.length - 1,
      rows: stitchedRows,
      pageStart: null,
      pageEnd: null,
    });
  }

  return blocks;
}

module.exports = {
  extractSections,
};
