function computeClinicalFlags({ measurements = [] }) {
  const flags = [];
  const severity = {};

  const byId = new Map(measurements.map((item) => [item.id, item]));

  const hemoglobin = byId.get("cbc_hemoglobin");
  if (hemoglobin && hemoglobin.normalizedValue < 10) {
    flags.push("possible_anemia");
    severity.possible_anemia = "high";
  }

  const hba1c = byId.get("diabetes_hba1c");
  if (hba1c && hba1c.normalizedValue >= 6.5) {
    flags.push("diabetes_likely");
    severity.diabetes_likely = "high";
  }

  const egfr = byId.get("kidney_egfr");
  if (egfr && egfr.normalizedValue < 60) {
    flags.push("kidney_concern");
    severity.kidney_concern = "high";
  }

  return {
    flags,
    severity,
  };
}

module.exports = {
  computeClinicalFlags,
};
