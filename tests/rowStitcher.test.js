const test = require("node:test");
const assert = require("node:assert/strict");
const { stitchRows } = require("../utils/rowStitcher");

test("stitches parameter name with next value and range lines", () => {
  const lines = ["Haemoglobin (HB)", "8.6 g/dL", "12.0-15.0", "Random note"];
  const stitched = stitchRows(lines, []);
  assert.equal(stitched[0].text, "Haemoglobin (HB) 8.6 g/dL 12.0-15.0");
  assert.deepEqual(stitched[0].sourceLines, [0, 1, 2]);
});

test("does not stitch header-like lines", () => {
  const lines = ["Lipid Profile", "Total Cholesterol", "173.8 mg/dL"];
  const stitched = stitchRows(lines, []);
  assert.equal(stitched[0].text, "Lipid Profile");
});
