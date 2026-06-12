const test = require("node:test");
const assert = require("node:assert/strict");
const { extractMedicalReportText } = require("../services/extractionService");

const stubStructured = {
  documentType: "prescription",
  reportType: "PRESCRIPTION",
  measurements: [],
  medications: [],
  diagnoses: [],
  doctorAdvice: [],
  testsAdvised: [],
  provenance: { extractionMethod: "gemini-vision" },
};

test("prescription hint skips OCR and routes directly to vision lane", async () => {
  let pdfCalled = false;
  let imageCalled = false;
  let prescriptionArgs = null;

  const result = await extractMedicalReportText("/tmp/rx.png", {
    documentTypeHint: "prescription",
    deps: {
      extractTextFromPdf: async () => {
        pdfCalled = true;
        return { methodUsed: "pdf-parse", rawText: "", ocrPages: [] };
      },
      extractTextFromImage: async () => {
        imageCalled = true;
        return { rawText: "", ocrPages: [] };
      },
      extractPrescription: async (filePath, extension, deps) => {
        prescriptionArgs = { filePath, extension, deps };
        return { ...stubStructured };
      },
    },
  });

  assert.equal(pdfCalled, false);
  assert.equal(imageCalled, false);
  assert.equal(result.methodUsed, "skipped-ocr-forced-vision");
  assert.equal(result.documentType, "prescription");
  assert.equal(result.cleanedTextFull, "");
  assert.equal(prescriptionArgs.deps.textHint, undefined);
  assert.equal(prescriptionArgs.deps.sourceImageBuffer, undefined);
});

test("auto hint still runs OCR before classification", async () => {
  let imageCalled = false;

  await extractMedicalReportText("/tmp/lab.png", {
    documentTypeHint: "auto",
    deps: {
      extractTextFromImage: async () => {
        imageCalled = true;
        return {
          rawText: "Hemoglobin (HB) : 8.6 g/dL 12-15",
          ocrPages: [],
        };
      },
      filterClinicalData: () => ({
        cleanedTextClinical: "Hemoglobin 8.6",
        structured: {
          reportType: "CBC",
          measurements: [{ id: "cbc_hemoglobin" }],
          medications: [],
          diagnoses: [],
          flags: [],
        },
      }),
    },
  });

  assert.equal(imageCalled, true);
});

test("auto prescription path passes reused PDF page buffer to vision lane", async () => {
  const reusedBuffer = Buffer.from("page-zero");
  let prescriptionArgs = null;

  await extractMedicalReportText("/tmp/rx.pdf", {
    documentTypeHint: "auto",
    deps: {
      extractTextFromPdf: async () => ({
        methodUsed: "pdf-ocr-fallback",
        rawText: "Tab Metformin BD",
        ocrPages: [],
        renderedPageBuffers: [reusedBuffer],
      }),
      extractPrescription: async (filePath, extension, deps) => {
        prescriptionArgs = deps;
        return { ...stubStructured };
      },
    },
  });

  assert.equal(prescriptionArgs.sourceImageBuffer, reusedBuffer);
  assert.ok(prescriptionArgs.textHint.includes("Metformin"));
});
