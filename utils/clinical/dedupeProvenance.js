function scoreMeasurement(measurement) {
  let score = 0;
  if (measurement.reference_range) {
    score += 3;
  }
  if (measurement.unit) {
    score += 2;
  }
  if (measurement.status) {
    score += 1;
  }
  if ((measurement.sourceLine || "").length <= 120) {
    score += 1;
  }
  if (
    /(interpretation|remarks|recommended|reflects|reference ranges discussed|therapeutic goals)/i.test(
      measurement.sourceLine || ""
    )
  ) {
    score -= 3;
  }
  return score;
}

function dedupeMeasurements(measurements = []) {
  const bestByName = new Map();

  for (const measurement of measurements) {
    const key = (measurement.id || measurement.name || "").toLowerCase();
    const existing = bestByName.get(key);

    if (!existing) {
      bestByName.set(key, measurement);
      continue;
    }

    const newScore = scoreMeasurement(measurement);
    const oldScore = scoreMeasurement(existing);
    if (newScore > oldScore) {
      bestByName.set(key, measurement);
    }
  }

  return [...bestByName.values()].sort((a, b) => a.sourceIndex - b.sourceIndex);
}

module.exports = {
  dedupeMeasurements,
};
