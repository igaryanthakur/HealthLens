const test = require("node:test");
const assert = require("node:assert/strict");
const { extractSections } = require("../services/sectionExtractor");

test("extracts CBC and LIPID sections from stitched rows", () => {
  const rows = [
    { text: "Complete Blood Count", sourceLines: [0] },
    { text: "Haemoglobin (HB) 8.6 g/dL 12.0-15.0", sourceLines: [1] },
    { text: "MCV 82 fL 80-100", sourceLines: [2] },
    { text: "Lipid Profile", sourceLines: [3] },
    { text: "Total Cholesterol 173.8 mg/dL <200", sourceLines: [4] },
  ];

  const sections = extractSections(rows);
  assert.equal(sections.length >= 2, true);
  assert.equal(sections[0].section, "CBC");
  assert.equal(sections[1].section, "LIPID");
});
