// Client mirror of the backend canonical map's name -> clinical panel mapping
// (utils/canonicalMap.json). Persisted measurements carry only a name, so the
// dashboard resolves their category here to group the Full Report Breakdown.

const CATEGORY_BY_NAME = {
  // CBC
  hemoglobin: 'CBC',
  hb: 'CBC',
  haemoglobin: 'CBC',
  rbc: 'CBC',
  'red blood cell': 'CBC',
  'red blood cell count': 'CBC',
  wbc: 'CBC',
  tlc: 'CBC',
  'total leucocyte count': 'CBC',
  'total white blood cell count': 'CBC',
  platelets: 'CBC',
  platelet: 'CBC',
  'platelet count': 'CBC',
  pcv: 'CBC',
  hematocrit: 'CBC',
  mcv: 'CBC',
  mch: 'CBC',
  mchc: 'CBC',
  rdw: 'CBC',
  anc: 'CBC',
  'absolute neutrophil count': 'CBC',
  // Diabetes
  hba1c: 'Diabetes',
  'hb a1c': 'Diabetes',
  'glycosylated hemoglobin': 'Diabetes',
  glucose: 'Diabetes',
  'random glucose': 'Diabetes',
  'fasting glucose': 'Diabetes',
  'glucose random': 'Diabetes',
  // Lipid
  'total cholesterol': 'Lipid',
  'cholesterol total': 'Lipid',
  triglycerides: 'Lipid',
  tg: 'Lipid',
  hdl: 'Lipid',
  ldl: 'Lipid',
  vldl: 'Lipid',
  // Kidney
  creatinine: 'Kidney',
  urea: 'Kidney',
  'blood urea': 'Kidney',
  bun: 'Kidney',
  egfr: 'Kidney',
  gfr: 'Kidney',
  'uric acid': 'Kidney',
  // Liver
  'bilirubin total': 'Liver',
  'serum bilirubin total': 'Liver',
  bilirubin: 'Liver',
  ast: 'Liver',
  'aspartate aminotransferase': 'Liver',
  sgot: 'Liver',
  alt: 'Liver',
  'alanine aminotransferase': 'Liver',
  sgpt: 'Liver',
  alp: 'Liver',
  'alkaline phosphatase': 'Liver',
  ggt: 'Liver',
  'gamma glutamyl transferase': 'Liver',
  albumin: 'Liver',
  'total protein': 'Liver',
  'serum total protein': 'Liver',
  // Iron
  'serum iron': 'Iron',
  'iron studies': 'Iron',
  tibc: 'Iron',
  uibc: 'Iron',
  'transferrin saturation': 'Iron',
  // Vitamins
  'vitamin d': 'Vitamins',
  '25-oh vitamin d': 'Vitamins',
  '25 oh vitamin d': 'Vitamins',
  'vitamin b12': 'Vitamins',
  b12: 'Vitamins',
  'vit b12': 'Vitamins',
  // Thyroid
  tsh: 'Thyroid',
  'thyroid stimulating hormone': 'Thyroid',
  t3: 'Thyroid',
  'tri-iodothyronine': 'Thyroid',
  t4: 'Thyroid',
  thyroxine: 'Thyroid',
}

export function resolveCategory(name) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return CATEGORY_BY_NAME[key] || 'General Vitals'
}
