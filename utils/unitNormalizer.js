const UNIT_MAP = {
  "mg/dl": "mg/dL",
  "mg %": "mg/dL",
  "g/dl": "g/dL",
  "mmol/l": "mmol/L",
  "%": "%",
  "ug/dl": "ug/dL",
  "ng/ml": "ng/mL",
  "pg/ml": "pg/mL",
  "u/l": "U/L",
  "iu/l": "U/L",
  "uiu/ml": "uIU/mL",
  "10^3/ul": "10^3/uL",
  "10^6/ul": "10^6/uL"
};

function normalizeUnit(unitString) {
  if (!unitString) {
    return null;
  }

  const normalizedKey = unitString
    .replace(/[μ]/g, "u")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return UNIT_MAP[normalizedKey] || null;
}

function isKnownUnit(unitString) {
  return normalizeUnit(unitString) !== null;
}

module.exports = {
  UNIT_MAP,
  normalizeUnit,
  isKnownUnit,
};
