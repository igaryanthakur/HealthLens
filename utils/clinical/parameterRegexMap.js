const { normalizeUnit } = require("../unitNormalizer");
const { canonicalMap } = require("../standardizeNames");

const RANGE_HINT_PATTERN =
  /([0-9]+(?:\.[0-9]+)?\s*(?:-|–|to)\s*[0-9]+(?:\.[0-9]+)?|(?:<=|>=|<|>)\s*[0-9]+(?:\.[0-9]+)?)/i;

const RANGE_STRIP_PATTERN =
  /(?:[\d.]+\s*[-–]\s*[\d.]+|[<>≤≥]\s*[\d.]+|up to\s*[\d.]+)/gi;

const VALUE_PATTERN = /(?<![a-zA-Z])(\d{1,5}(?:\.\d{1,3})?)(?![a-zA-Z])/;

const UNIT_PATTERN =
  /(mg\/dl|g\/dL|g\/dl|U\/L|u\/l|10\^6\/[μu]l|10\^3\/[μu]L|Lakh\/cumm|%|fL|pg\/ml|ng\/ml|μIU\/mL|uIU\/mL)/i;

const SECTION_BY_CATEGORY = {
  CBC: "CBC",
  Diabetes: "DIABETES",
  Lipid: "LIPID",
  Kidney: "KIDNEY",
  Liver: "LIVER",
  Iron: "IRON",
  Vitamins: "VITAMINS",
  Thyroid: "THYROID",
};

function buildDefinitions() {
  return Object.entries(canonicalMap).map(([name, entry]) => ({
    id: entry.id,
    name,
    category: entry.category,
    priority: entry.priority,
    section: SECTION_BY_CATEGORY[entry.category] || "UNKNOWN",
    aliases: [name, ...(entry.aliases || [])],
  }));
}

const DEFINITIONS_WITH_SECTION = buildDefinitions();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLongestMatchingAliasLength(lineText, def) {
  const sorted = [...def.aliases].sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const normalizedAlias = alias.toLowerCase();
    if (normalizedAlias.length <= 3) {
      if (new RegExp(`\\b${escapeRegex(normalizedAlias)}\\b`, "i").test(lineText)) {
        return normalizedAlias.length;
      }
    } else if (lineText.includes(normalizedAlias)) {
      return normalizedAlias.length;
    }
  }
  return 0;
}

function shouldSkipLine(def, lineText) {
  if (def.id === "cbc_hemoglobin" && /\bhba1c\b/.test(lineText)) {
    return true;
  }
  if (
    def.id === "cbc_rbc" &&
    (/\brdw\b/.test(lineText) || /distribution width/.test(lineText))
  ) {
    return true;
  }
  if (
    def.id === "liver_bilirubin_total" &&
    /\b(direct|indirect|conjugated|unconjugated)\b/.test(lineText)
  ) {
    return true;
  }
  if (def.id === "vitamin_d" && /reference ranges discussed/.test(lineText)) {
    return true;
  }
  return false;
}

function extractReferenceText(contextText) {
  const match = contextText.match(RANGE_HINT_PATTERN);
  return match ? match[0] : null;
}

function maskLabels(text, aliases = []) {
  let masked = text;
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (!alias) {
      continue;
    }
    masked = masked.replace(new RegExp(escapeRegex(alias), "gi"), " [LABEL] ");
  }
  return masked;
}

function extractMeasurements(candidates = [], options = {}) {
  const definitions = options.definitions || DEFINITIONS_WITH_SECTION;
  const results = [];

  for (const candidate of candidates) {
    const lineText = candidate.line.toLowerCase();

    let bestDef = null;
    let bestAliasLen = 0;

    for (const def of definitions) {
      if (shouldSkipLine(def, lineText)) {
        continue;
      }
      const aliasLen = getLongestMatchingAliasLength(lineText, def);
      if (aliasLen > bestAliasLen) {
        bestAliasLen = aliasLen;
        bestDef = def;
      }
    }

    if (!bestDef) {
      continue;
    }

    const reference_range = extractReferenceText(
      `${candidate.line} ${candidate.nextLine || ""}`,
    );

    const textWithoutRange = lineText.replace(RANGE_STRIP_PATTERN, " [REF] ");
    const safeText = maskLabels(textWithoutRange, bestDef.aliases);
    const valueMatch = safeText.match(VALUE_PATTERN);
    if (!valueMatch) {
      continue;
    }

    const value = Number(valueMatch[1]);
    if (Number.isNaN(value)) {
      continue;
    }

    const unitMatch = candidate.line.match(UNIT_PATTERN);

    results.push({
      category: bestDef.category,
      section: bestDef.section,
      name: bestDef.name,
      rawValue: valueMatch[1],
      value,
      rawUnit: unitMatch?.[1] || null,
      unit: normalizeUnit(unitMatch?.[1]) || unitMatch?.[1] || null,
      normalizedUnit: normalizeUnit(unitMatch?.[1]) || null,
      reference_range,
      sourceLine: candidate.line,
      sourceLines: candidate.sourceLines || [candidate.index],
      sourceIndex: candidate.index,
      priority: bestDef.priority,
      method: "generalized_stripper",
    });
  }

  return results;
}

function getDefinitionsForSection(section) {
  const normalized = (section || "UNKNOWN").toUpperCase();
  return DEFINITIONS_WITH_SECTION.filter((item) => item.section === normalized);
}

function getHighPriorityDefinitions(reportType) {
  const normalizedType = (reportType || "UNKNOWN").toUpperCase();
  const criticalDefs = DEFINITIONS_WITH_SECTION.filter((item) =>
    ["critical", "high"].includes(item.priority.toLowerCase()),
  );
  if (normalizedType === "UNKNOWN") {
    return criticalDefs;
  }

  const prioritized = criticalDefs.filter(
    (item) => item.section === normalizedType,
  );
  const remaining = criticalDefs.filter(
    (item) => item.section !== normalizedType,
  );
  return [...prioritized, ...remaining];
}

module.exports = {
  extractMeasurements,
  getDefinitionsForSection,
  getHighPriorityDefinitions,
  PARAMETER_DEFINITIONS: DEFINITIONS_WITH_SECTION,
};
