const THRESHOLD_RULES = {
  HbA1c: [
    { max: 5.6, status: "normal" },
    { min: 5.7, max: 6.4, status: "high" },
    { min: 6.5, status: "critical" },
  ],
  "Vitamin D": [
    { max: 19.9, status: "low" },
    { min: 20, max: 29.9, status: "high" },
    { min: 30, max: 100, status: "normal" },
    { min: 100.1, status: "critical" },
  ],
  eGFR: [
    { min: 90, status: "normal" },
    { min: 60, max: 89.9, status: "high" },
    { min: 30, max: 59.9, status: "critical" },
    { max: 29.9, status: "critical" },
  ],
};

function statusFromRange(value, parsedRange) {
  if (!parsedRange) {
    return null;
  }

  if (parsedRange.type === "between") {
    if (value < parsedRange.low) {
      return "low";
    }
    if (value > parsedRange.high) {
      return "high";
    }
    return "normal";
  }

  if (parsedRange.type === "lte") {
    return value <= parsedRange.value ? "normal" : "high";
  }

  if (parsedRange.type === "lt") {
    return value < parsedRange.value ? "normal" : "high";
  }

  if (parsedRange.type === "gte") {
    return value >= parsedRange.value ? "normal" : "low";
  }

  if (parsedRange.type === "gt") {
    return value > parsedRange.value ? "normal" : "low";
  }

  return null;
}

function statusFromThreshold(name, value) {
  const rules = THRESHOLD_RULES[name];
  if (!rules) {
    return null;
  }

  for (const rule of rules) {
    const minOk = rule.min === undefined || value >= rule.min;
    const maxOk = rule.max === undefined || value <= rule.max;
    if (minOk && maxOk) {
      return rule.status;
    }
  }

  return null;
}

function applyStatusAndPriority(measurement) {
  const value = Number(measurement.value);
  const statusFromRef = statusFromRange(value, measurement.referenceRangeParsed);
  const statusFromKnownRules = statusFromThreshold(measurement.name, value);

  return {
    ...measurement,
    status: statusFromRef || statusFromKnownRules || null,
    priority: measurement.priority || "Medium",
  };
}

module.exports = {
  applyStatusAndPriority,
};
