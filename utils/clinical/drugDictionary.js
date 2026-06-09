/**
 * Lightweight drug-name validation dictionary (I6).
 *
 * Purpose: flag (never block) extracted medication names that do not resemble
 * any known drug, so the review UI can highlight likely OCR/Vision errors.
 * This is intentionally a curated subset of common Indian-brand + generic
 * names, not an exhaustive pharmacopoeia. Coverage gaps -> uncertain, not error.
 */

// Curated set of common generic + Indian-brand drug names (lowercase).
const KNOWN_DRUGS = [
  // Analgesics / antipyretics / NSAIDs
  "paracetamol",
  "acetaminophen",
  "dolo",
  "crocin",
  "calpol",
  "ibuprofen",
  "brufen",
  "diclofenac",
  "voveran",
  "aceclofenac",
  "nimesulide",
  "naproxen",
  "aspirin",
  "ecosprin",
  "tramadol",
  "ketorolac",
  // Antibiotics
  "amoxicillin",
  "amoxycillin",
  "augmentin",
  "clavulanate",
  "azithromycin",
  "azithral",
  "azee",
  "ciprofloxacin",
  "cifran",
  "levofloxacin",
  "ofloxacin",
  "doxycycline",
  "cefixime",
  "taxim",
  "cefuroxime",
  "cephalexin",
  "metronidazole",
  "metrogyl",
  "flagyl",
  "clindamycin",
  "norfloxacin",
  "amikacin",
  "gentamicin",
  // Gastro / PPIs / antacids
  "omeprazole",
  "omez",
  "pantoprazole",
  "pan",
  "pantop",
  "rabeprazole",
  "esomeprazole",
  "nexium",
  "ranitidine",
  "rantac",
  "famotidine",
  "domperidone",
  "ondansetron",
  "emeset",
  "digene",
  "gelusil",
  "sucralfate",
  "lactulose",
  // Diabetes
  "metformin",
  "glycomet",
  "glimepiride",
  "amaryl",
  "gliclazide",
  "glipizide",
  "sitagliptin",
  "vildagliptin",
  "insulin",
  "voglibose",
  "pioglitazone",
  // Cardiovascular / BP
  "amlodipine",
  "amlong",
  "telmisartan",
  "telma",
  "losartan",
  "losar",
  "ramipril",
  "enalapril",
  "lisinopril",
  "atenolol",
  "metoprolol",
  "metolar",
  "bisoprolol",
  "nebivolol",
  "clopidogrel",
  "clopilet",
  "atorvastatin",
  "atorva",
  "rosuvastatin",
  "rosuvas",
  "hydrochlorothiazide",
  "furosemide",
  "lasix",
  "torsemide",
  "nitroglycerin",
  // Respiratory / allergy
  "cetirizine",
  "cetzine",
  "levocetirizine",
  "levocet",
  "montelukast",
  "montair",
  "fexofenadine",
  "allegra",
  "salbutamol",
  "asthalin",
  "levosalbutamol",
  "budesonide",
  "deriphyllin",
  "ambroxol",
  "bromhexine",
  "chlorpheniramine",
  "loratadine",
  // Vitamins / supplements
  "vitamin",
  "becosules",
  "neurobion",
  "shelcal",
  "calcium",
  "cholecalciferol",
  "folvite",
  "folic",
  "ferrous",
  "orofer",
  "methylcobalamin",
  "zincovit",
  "limcee",
  // CNS / psychiatry / misc
  "alprazolam",
  "clonazepam",
  "diazepam",
  "escitalopram",
  "sertraline",
  "amitriptyline",
  "gabapentin",
  "pregabalin",
  "levothyroxine",
  "thyronorm",
  "eltroxin",
  "prednisolone",
  "wysolone",
  "dexamethasone",
  "hydroxychloroquine",
  "hcqs",
  // Dermatology (topicals / acne / antifungals)
  "tretinoin",
  "tretin",
  "isotretinoin",
  "adapalene",
  "adaferin",
  "benzoyl",
  "benzac",
  "deriva",
  "acnemoist",
  "clindamycin",
  "azelaic",
  "minoxidil",
  "finasteride",
  "ketoconazole",
  "terbinafine",
  "mupirocin",
  "fusidic",
  "betamethasone",
  "clobetasol",
  "mometasone",
  "tacrolimus",
  "permethrin",
  "ivermectin",
  "salicylic",
  "calcipotriol",
];

// Below this similarity a "did you mean" suggestion is noise, so we suppress it.
const SUGGESTION_THRESHOLD = 0.6;

const KNOWN_SET = new Set(KNOWN_DRUGS);

function normalize(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Classic Levenshtein edit distance.
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j += 1) prev[j] = curr[j];
  }
  return prev[n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Validates a single extracted drug name against the known list.
 *
 * @param {string} name - The extracted medication name (may include strength).
 * @returns {{ matched: boolean, suggestion: string|null, score: number }}
 *   matched: exact/near-exact hit; suggestion: best known name when not matched;
 *   score: similarity (0-1) to the closest known drug.
 */
function validateDrugName(name) {
  const normalized = normalize(name);
  if (!normalized) {
    return { matched: false, suggestion: null, score: 0 };
  }

  // The first word usually carries the brand/generic; strength/units trail it.
  const firstToken = normalize(String(name).split(/\s+/)[0]);

  if (KNOWN_SET.has(normalized) || KNOWN_SET.has(firstToken)) {
    return { matched: true, suggestion: null, score: 1 };
  }

  let best = null;
  let bestScore = 0;
  for (const known of KNOWN_DRUGS) {
    const score = Math.max(
      similarity(normalized, known),
      firstToken ? similarity(firstToken, known) : 0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = known;
    }
  }

  // 0.8+ treated as a confident fuzzy match (handles minor OCR slips).
  const matched = bestScore >= 0.8;
  // Only offer a suggestion when it is plausibly the same drug; otherwise the
  // closest entry is just noise (e.g. an unlisted derm brand vs. "domperidone").
  const suggestion = matched || bestScore < SUGGESTION_THRESHOLD ? null : best;
  return {
    matched,
    suggestion,
    score: Number(bestScore.toFixed(2)),
  };
}

module.exports = {
  validateDrugName,
  KNOWN_DRUGS,
};
