const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeBBoxes, computeConfidence } = require("../utils/traceability");

test("merges bboxes correctly", () => {
  const merged = mergeBBoxes([
    { x0: 10, y0: 20, x1: 30, y1: 40 },
    { x0: 25, y0: 15, x1: 50, y1: 45 },
  ]);
  assert.deepEqual(merged, { x: 10, y: 15, w: 40, h: 30 });
});

test("confidence scoring clamps and penalizes", () => {
  const high = computeConfidence({
    wordConfidences: [95, 90],
    matchType: "regex_exact",
    sanityOk: true,
    confidenceSource: "ocr",
  });
  const penalized = computeConfidence({
    wordConfidences: [95, 90],
    matchType: "regex_exact",
    sanityOk: false,
    confidenceSource: "ocr",
  });

  assert.ok(high <= 1 && high >= 0);
  assert.ok(penalized < high);
});
