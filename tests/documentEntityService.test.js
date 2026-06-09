const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractDocumentEntities,
  REPORT_TYPE_BY_DOCUMENT,
} = require("../services/documentEntityService");

function fakeExtractor(payload) {
  return async () => payload;
}

test("maps each entity documentType to its reportType label", async () => {
  const cases = {
    scan_report: "SCAN_REPORT",
    discharge_summary: "DISCHARGE_SUMMARY",
    typed_note: "TYPED_NOTE",
    unknown: "DOCUMENT",
  };

  for (const [documentType, reportType] of Object.entries(cases)) {
    const structured = await extractDocumentEntities("some text", documentType, {
      extractEntities: fakeExtractor({
        medications: [],
        diagnoses: [],
        symptoms: [],
        doctorAdvice: [],
        testsAdvised: [],
      }),
    });

    assert.equal(structured.documentType, documentType);
    assert.equal(structured.reportType, reportType);
    assert.equal(structured.reportType, REPORT_TYPE_BY_DOCUMENT[documentType]);
    assert.deepEqual(structured.measurements, []);
    assert.equal(structured.provenance.extractionMethod, "gemini-text");
  }
});

test("annotates medications via the drug dictionary", async () => {
  const structured = await extractDocumentEntities("text", "discharge_summary", {
    extractEntities: fakeExtractor({
      medications: [{ name: "Metformin" }, { name: "Zubrolax" }],
      diagnoses: [],
      symptoms: [],
      doctorAdvice: [],
      testsAdvised: [],
    }),
  });

  assert.equal(structured.medications[0].dictionaryMatched, true);
  assert.equal(structured.medications[1].uncertain, true);
});

test("passes symptoms through", async () => {
  const structured = await extractDocumentEntities("text", "typed_note", {
    extractEntities: fakeExtractor({
      medications: [],
      diagnoses: [],
      symptoms: [{ description: "Headache" }],
      doctorAdvice: ["Rest"],
      testsAdvised: [],
    }),
  });

  assert.equal(structured.symptoms[0].description, "Headache");
  assert.deepEqual(structured.doctorAdvice, ["Rest"]);
});
