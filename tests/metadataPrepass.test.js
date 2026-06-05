const test = require("node:test");
const assert = require("node:assert/strict");
const { extractMetadata } = require("../utils/clinical/metadataPrepass");

test("extracts customer since date with slashed month abbreviation", () => {
  const meta = extractMetadata("Customer Since: 25/Apr/2026\nVitamin B12 515");

  assert.equal(meta.reportDate, "25/Apr/2026");
});

test("extracts keyword-prefixed date in DD/MMM/YYYY format", () => {
  const meta = extractMetadata("Report Generated On: 25/Apr/2026\nHaemoglobin 10.0");

  assert.equal(meta.reportDate, "25/Apr/2026");
  assert.deepEqual(Object.keys(meta), ["reportDate"]);
});

test("extracts leading-line slashed date fallback", () => {
  const meta = extractMetadata("19/05/2026 PATIENT'S NAME\nCOMPLETE BLOOD COUNT");

  assert.equal(meta.reportDate, "19/05/2026");
});

test("returns null reportDate when no date found", () => {
  const meta = extractMetadata("Haemoglobin 10.0 g/dl");

  assert.equal(meta.reportDate, null);
});
