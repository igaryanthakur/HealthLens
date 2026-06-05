const PLAUSIBLE_RANGES = {
  cbc_hemoglobin: { min: 3, max: 25 },
  cbc_rbc: { min: 1.0, max: 8 },
  diabetes_hba1c: { min: 2, max: 20 },
  diabetes_glucose: { min: 20, max: 700 },
  kidney_creatinine: { min: 0.1, max: 20 },
  vitamin_d: { min: 0, max: 200 },
};

function validateValue(paramId, normalizedValue) {
  if (normalizedValue == null || Number.isNaN(Number(normalizedValue))) {
    return {
      ok: false,
      reason: "non_numeric_value",
      validationError: true,
    };
  }

  const range = PLAUSIBLE_RANGES[paramId];
  if (!range) {
    return {
      ok: true,
      reason: null,
      validationError: false,
    };
  }

  const value = Number(normalizedValue);
  if (value < range.min || value > range.max) {
    return {
      ok: false,
      reason: `out_of_plausible_range_${range.min}_${range.max}`,
      validationError: true,
    };
  }

  return {
    ok: true,
    reason: null,
    validationError: false,
  };
}

module.exports = {
  PLAUSIBLE_RANGES,
  validateValue,
};
