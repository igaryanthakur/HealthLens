const PAGE_NUMBER_PATTERNS = [
  /^page\s+\d+(\s+of\s+\d+)?$/i,
  /^--\s*\d+\s*of\s*\d+\s*--$/i,
  /^\d+\s*\/\s*\d+$/,
  /^-\s*\d+\s*-$/,
  /^\d+$/,
];

const GLOBAL_REMOVE_PATTERNS = [
  /\bBooking\s*ID\b/i,
  /\bOrder\s*Id\b/i,
  /\bBarcode\b/i,
  /\bSIN\s*No\b/i,
  /\bSample\s*Collected\s*On\b/i,
  /\bSample\s*Received\s*On\b/i,
  /\bReport\s*Generated\s*On\b/i,
  /\bMachine\s*:/i,
  /\bDepartment\s*:/i,
  /\bMethod\s*:/i,
  /\bFrequency\s+of\s+Quality\s+Control\b/i,
  /\bLaboratory\s+Equipment\b/i,
  /\bSmart\s+Report\b/i,
  /\bAdvisory\b/i,
  /\bEnd\s+Of\s+Report\b/i,
];

const MARKETING_SUBSTRINGS = [
  "india’s",
  "india's",
  "health analysis",
  "a i b a s e d",
  "trusted health test",
  "home service",
];

const MEASUREMENT_TOKEN_PATTERN =
  /([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl|g\/dl|u\/l|%|fL|pg\/ml|ng\/ml|uiu\/ml|10\^3\/ul|10\^6\/ul|mmol\/l)?/gi;

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function isPageNumberLine(line) {
  const normalized = normalizeLine(line);
  return PAGE_NUMBER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isNoisyLine(line) {
  const normalized = normalizeLine(line);

  if (!normalized) {
    return true;
  }

  if (/^[^a-zA-Z0-9]{3,}$/.test(normalized)) {
    return true;
  }

  const nonAlphaNumCount = (normalized.match(/[^a-zA-Z0-9\s:/().,%+\-]/g) || []).length;
  const ratio = nonAlphaNumCount / normalized.length;

  return ratio > 0.45;
}

function shouldRemoveByPattern(line) {
  return GLOBAL_REMOVE_PATTERNS.some((pattern) => pattern.test(line));
}

function shouldRemoveByMarketingText(line) {
  const lower = line.toLowerCase();
  return MARKETING_SUBSTRINGS.some((term) => lower.includes(term));
}

function measurementTokenCount(line) {
  const matches = line.match(MEASUREMENT_TOKEN_PATTERN);
  return matches ? matches.length : 0;
}

function shouldDropLongNarrative(line) {
  if (line.length <= 200) {
    return false;
  }

  return measurementTokenCount(line) < 2;
}

function removeRepeatedHeaderFooterLines(lines) {
  const counts = new Map();

  for (const line of lines) {
    const key = line.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return lines.filter((line) => {
    const key = line.toLowerCase();
    const frequency = counts.get(key) || 0;
    const looksInformative = /[:\d]/.test(line);
    const isLikelyHeaderFooter = frequency >= 3 && line.length <= 100;
    return !(isLikelyHeaderFooter && !looksInformative);
  });
}

function removeBoilerplate(rawText = "") {
  const normalizedInput = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");

  const normalizedLines = normalizedInput.split("\n").map(normalizeLine);
  const filtered = normalizedLines
    .filter((line) => line.length > 0)
    .filter((line) => !isPageNumberLine(line))
    .filter((line) => !isNoisyLine(line))
    .filter((line) => !shouldRemoveByPattern(line))
    .filter((line) => !shouldRemoveByMarketingText(line))
    .filter((line) => !shouldDropLongNarrative(line));

  const withoutHeadersFooters = removeRepeatedHeaderFooterLines(filtered);
  const dedupedConsecutive = withoutHeadersFooters.filter((line, index, arr) => {
    if (index === 0) {
      return true;
    }

    return line !== arr[index - 1];
  });

  return {
    lines: dedupedConsecutive,
    text: dedupedConsecutive.join("\n").trim(),
  };
}

module.exports = {
  normalizeLine,
  removeBoilerplate,
};
