const { normalizeUnit } = require("../unitNormalizer");

const RANGE_HINT_PATTERN =
  /([0-9]+(?:\.[0-9]+)?\s*(?:-|–|to)\s*[0-9]+(?:\.[0-9]+)?|(?:<=|>=|<|>)\s*[0-9]+(?:\.[0-9]+)?)/i;

const PARAMETER_DEFINITIONS = [
  {
    name: "Hemoglobin",
    category: "CBC",
    priority: "High",
    regex:
      /\b(?:Haemoglobin|Hemoglobin|HB)\b(?:[^\d\n]{0,24})?([0-9]+(?:\.[0-9]+)?)\s*(g\/dL|g\/dl)?/i,
  },
  {
    name: "RBC",
    category: "CBC",
    priority: "Medium",
    regex:
      /\b(?:Red\s*Blood\s*Cell|RBC)\b.*?([0-9]+(?:\.[0-9]+)?)(?:\s*(10\^6\/[μu]l))?/i,
  },
  {
    name: "WBC",
    category: "CBC",
    priority: "Medium",
    regex:
      /\b(?:Total\s*Leucocyte\s*Count|TLC|WBC)\b.*?([0-9]+(?:\.[0-9]+)?)(?:\s*(10\^3\/[μu]L|10\^3\/uL))?/i,
  },
  {
    name: "Platelets",
    category: "CBC",
    priority: "High",
    regex:
      /Platelet(?:s)?\s*(?:Count)?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(10\^3\/μl|10\^3\/uL|\/μl|\/uL)?/i,
  },
  {
    name: "PCV",
    category: "CBC",
    priority: "Medium",
    regex: /\b(?:Hematocrit|PCV)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(%)?/i,
  },
  {
    name: "MCV",
    category: "CBC",
    priority: "Low",
    regex: /\b(MCV)\b.*?([0-9]+(?:\.[0-9]+)?)(?:\s*(fL))?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "MCH",
    category: "CBC",
    priority: "Low",
    regex: /\b(MCH)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "MCHC",
    category: "CBC",
    priority: "Low",
    regex: /\b(MCHC)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "RDW",
    category: "CBC",
    priority: "Low",
    regex: /\b(RDW)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "ANC",
    category: "CBC",
    priority: "High",
    regex: /\b(?:Absolute\s+Neutrophil\s+Count|ANC)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
  },
  {
    name: "HbA1c",
    category: "Diabetes",
    priority: "Critical",
    regex: /\b(?:HbA1c|Hba1c)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(%)?/i,
  },
  {
    name: "Glucose",
    category: "Diabetes",
    priority: "Critical",
    regex:
      /\b(?:Glucose(?:,\s*Random)?|Random\s+Glucose|Fasting\s+Glucose)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)/i,
  },
  {
    name: "Total Cholesterol",
    category: "Lipid",
    priority: "High",
    regex:
      /\b(?:Total\s+Cholesterol|Cholesterol\s+Total)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
  },
  {
    name: "Triglycerides",
    category: "Lipid",
    priority: "High",
    regex: /\b(?:Triglycerides|TG)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
  },
  {
    name: "HDL",
    category: "Lipid",
    priority: "Medium",
    regex: /\b(HDL)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "LDL",
    category: "Lipid",
    priority: "Medium",
    regex: /\b(LDL)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "VLDL",
    category: "Lipid",
    priority: "Low",
    regex: /\b(VLDL)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "Creatinine",
    category: "Kidney",
    priority: "Critical",
    regex: /\b(Creatinine)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "Urea",
    category: "Kidney",
    priority: "High",
    regex: /\b(?:Urea|Blood Urea|BUN)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
  },
  {
    name: "eGFR",
    category: "Kidney",
    priority: "Critical",
    regex: /\b(?:eGFR|GFR)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
  },
  {
    name: "Uric Acid",
    category: "Kidney",
    priority: "Medium",
    regex: /\b(Uric Acid)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "Bilirubin Total",
    category: "Liver",
    priority: "High",
    regex:
      /\b(?:Serum\s+)?Bilirubin,?\s*\(Total\)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i,
  },
  {
    name: "AST",
    category: "Liver",
    priority: "High",
    regex:
      /\b(?:AST|Aspartate Aminotransferase)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(U\/L)?/i,
  },
  {
    name: "ALT",
    category: "Liver",
    priority: "High",
    regex:
      /\b(?:ALT|Alanine Aminotransferase)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(U\/L)?/i,
  },
  {
    name: "ALP",
    category: "Liver",
    priority: "Medium",
    regex:
      /\b(?:ALP|Alkaline Phosphatase)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(U\/L)?/i,
  },
  {
    name: "GGT",
    category: "Liver",
    priority: "Medium",
    regex:
      /\b(?:GGT|Gamma Glutamyl Transferase)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(U\/L)?/i,
  },
  {
    name: "Albumin",
    category: "Liver",
    priority: "Medium",
    regex: /\b(?:Serum\s+)?Albumin\b.*?([0-9]+(?:\.[0-9]+)?)\s*(g\/dl)?/i,
  },
  {
    name: "Total Protein",
    category: "Liver",
    priority: "Medium",
    regex: /\b(?:Serum\s+)?Total Protein\b.*?([0-9]+(?:\.[0-9]+)?)\s*(g\/dl)?/i,
  },
  {
    name: "Serum Iron",
    category: "Iron",
    priority: "High",
    regex: /\b(?:Serum\s+Iron|Iron studies)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
  },
  {
    name: "TIBC",
    category: "Iron",
    priority: "High",
    regex: /\b(TIBC)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "UIBC",
    category: "Iron",
    priority: "Medium",
    regex: /\b(UIBC)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "Transferrin Saturation",
    category: "Iron",
    priority: "Medium",
    regex: /\b(Transferrin\s+Saturation)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "Vitamin D",
    category: "Vitamins",
    priority: "Critical",
    regex:
      /\b(?:Vitamin\s*D(?:\s*\(25\s*-\s*OH\s*Vitamin\s*D\))?|25[- ]OH\s*Vitamin\s*D)\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(ng\/ml)/i,
  },
  {
    name: "Vitamin B12",
    category: "Vitamins",
    priority: "High",
    regex: /\b(Vitamin\s*B12)\b.*?([0-9]+(?:\.[0-9]+)?)\s*(pg\/ml)?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "TSH",
    category: "Thyroid",
    priority: "High",
    regex:
      /\b(TSH|Thyroid Stimulating Hormone)\b.*?([0-9]+(?:\.[0-9]+)?)(?:\s*(μIU\/mL|uIU\/mL))?/i,
    valueGroup: 2,
    unitGroup: 3,
  },
  {
    name: "T3",
    category: "Thyroid",
    priority: "Medium",
    regex: /\b(Tri-Iodothyronine|T3)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
  {
    name: "T4",
    category: "Thyroid",
    priority: "Medium",
    regex: /\b(Thyroxine|T4)\b.*?([0-9]+(?:\.[0-9]+)?)/i,
    valueGroup: 2,
  },
];

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

const DEFINITIONS_WITH_SECTION = PARAMETER_DEFINITIONS.map((definition) => ({
  ...definition,
  section: SECTION_BY_CATEGORY[definition.category] || "UNKNOWN",
}));

function definitionHintRegex(name) {
  const aliases = {
    Hemoglobin: /(haemoglobin|hemoglobin|hb)/i,
    RBC: /(rbc|red blood cell)/i,
    WBC: /(wbc|tlc|total leucocyte count)/i,
    Platelets: /(platelet)/i,
    PCV: /(pcv|hematocrit)/i,
    ANC: /(anc|absolute neutrophil count)/i,
    HbA1c: /(hba1c)/i,
    Glucose: /(glucose)/i,
    "Total Cholesterol": /(total cholesterol|cholesterol total)/i,
    Triglycerides: /(triglycerides|tg)/i,
    Creatinine: /(creatinine)/i,
    Urea: /(urea|bun)/i,
    eGFR: /(egfr|gfr)/i,
    "Uric Acid": /(uric acid)/i,
    "Bilirubin Total": /(bilirubin)/i,
    AST: /(ast|aspartate)/i,
    ALT: /(alt|alanine)/i,
    ALP: /(alp|alkaline phosphatase)/i,
    GGT: /(ggt|gamma glutamyl)/i,
    Albumin: /(albumin)/i,
    "Total Protein": /(total protein)/i,
    "Serum Iron": /(serum iron|iron studies)/i,
    TIBC: /(tibc)/i,
    UIBC: /(uibc)/i,
    "Transferrin Saturation": /(transferrin saturation)/i,
    "Vitamin D": /(vitamin d|25-? ?oh vitamin d)/i,
    "Vitamin B12": /(vitamin b12)/i,
    TSH: /(tsh|thyroid stimulating hormone)/i,
    T3: /(t3|tri-iodothyronine)/i,
    T4: /(t4|thyroxine)/i,
  };

  return aliases[name] || new RegExp(name, "i");
}

function extractReferenceText(contextText) {
  const match = contextText.match(RANGE_HINT_PATTERN);
  return match ? match[0] : null;
}

function extractMeasurements(candidates = [], options = {}) {
  const definitions = options.definitions || DEFINITIONS_WITH_SECTION;
  const measurements = [];
  const genericValuePattern =
    /([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl|g\/dL|g\/dl|U\/L|u\/l|%|fL|pg\/ml|ng\/ml|μIU\/mL|uIU\/mL)/i;

  for (const candidate of candidates) {
    for (const definition of definitions) {
      if (definition.name === "Hemoglobin" && /\bhba1c\b/i.test(candidate.line)) {
        continue;
      }
      if (
        definition.name === "Vitamin D" &&
        /reference ranges discussed/i.test(candidate.line)
      ) {
        continue;
      }

      const directMatch = candidate.line.match(definition.regex);
      let match = directMatch;
      let sourceLine = candidate.line;
      let usedFallbackMatch = false;

      if (!match) {
        const hintRegex = definitionHintRegex(definition.name);
        const hasHint = hintRegex.test(candidate.line);
        if (hasHint && candidate.line.length <= 140) {
          const fallbackPattern =
            definition.name === "Glucose"
              ? /([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)/i
              : definition.name === "Vitamin D"
                ? /([0-9]+(?:\.[0-9]+)?)\s*(ng\/ml)/i
                : genericValuePattern;

          const lookaheadLines = candidate.lookaheadLines || [];
          for (const lookaheadLine of lookaheadLines) {
            const nextValueMatch = lookaheadLine.match(fallbackPattern);
            if (nextValueMatch) {
              match = nextValueMatch;
              sourceLine = `${candidate.line} ${lookaheadLine}`.trim();
              usedFallbackMatch = true;
              break;
            }
          }
        }
      }

      if (!match) {
        continue;
      }

      const valueGroup = usedFallbackMatch ? 1 : definition.valueGroup || 1;
      const unitGroup = usedFallbackMatch ? 2 : definition.unitGroup || 2;
      const value = Number(match[valueGroup]);

      if (Number.isNaN(value)) {
        continue;
      }

      measurements.push({
        category: definition.category,
        section: definition.section,
        name: definition.name,
        rawValue: String(match[valueGroup]),
        value,
        rawUnit: match[unitGroup] || null,
        unit: normalizeUnit(match[unitGroup]) || match[unitGroup] || null,
        normalizedUnit: normalizeUnit(match[unitGroup]) || null,
        reference_range: extractReferenceText(
          `${candidate.line} ${candidate.nextLine || ""}`,
        ),
        sourceLine,
        sourceLines: candidate.sourceLines || [candidate.index],
        sourceIndex: candidate.index,
        priority: definition.priority,
        method: usedFallbackMatch ? "regex_fuzzy" : "regex_exact",
      });
    }
  }

  return measurements;
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
