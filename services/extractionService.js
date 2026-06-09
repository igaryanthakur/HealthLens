const path = require("path");
const { cleanupTextFull } = require("../utils/textCleanup");
const { extractTextFromPdf } = require("./pdfService");
const { extractTextFromImage } = require("./ocrService");
const { filterClinicalData } = require("./clinicalFilterService");
const { stitchRows } = require("../utils/rowStitcher");
const { extractSections } = require("./sectionExtractor");
const { classifyDocumentType } = require("./reportClassifier");
const { extractPrescription } = require("./prescriptionService");

const DOCUMENT_TYPE_HINTS = new Set([
  "lab_report",
  "prescription",
  "scan_report",
  "discharge_summary",
  "typed_note",
]);

async function extractMedicalReportText(filePath, opts = {}) {
  const extension = path.extname(filePath).toLowerCase();
  let methodUsed = "unknown";
  let rawText = "";
  let ocrPages = [];

  if (extension === ".pdf") {
    const result = await extractTextFromPdf(filePath);
    methodUsed = result.methodUsed;
    rawText = result.rawText;
    ocrPages = result.ocrPages || [];
  } else if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    methodUsed = "image-ocr";
    const result = await extractTextFromImage(filePath);
    rawText = result.rawText;
    ocrPages = result.ocrPages || [];
  } else {
    throw new Error("Unsupported file type for extraction.");
  }

  const cleanedTextFull = cleanupTextFull(rawText);
  const fullLines = cleanedTextFull
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allWords = ocrPages.flatMap((page) => page.words || []);
  const stitchedRows = stitchRows(fullLines, allWords);
  const sections = extractSections(stitchedRows);

  // An explicit user-supplied hint (from the upload UI selector) overrides the
  // deterministic classifier, which is unreliable on handwriting.
  const hint = opts.documentTypeHint;
  const documentType =
    hint && hint !== "auto" && DOCUMENT_TYPE_HINTS.has(hint)
      ? hint
      : classifyDocumentType(cleanedTextFull).documentType;

  // Routing seam: documentType decides which extraction lane runs. Prescriptions
  // go through the Gemini Vision lane; everything else flows through the
  // deterministic lab pipeline.
  let cleanedTextClinical = "";
  let structured;
  switch (documentType) {
    case "prescription": {
      structured = await extractPrescription(filePath, extension, {
        textHint: cleanedTextFull,
      });
      break;
    }
    case "lab_report":
    default: {
      ({ cleanedTextClinical, structured } = filterClinicalData(cleanedTextFull, {
        ocrPages,
        stitchedRows,
        sections,
      }));
      break;
    }
  }

  structured.documentType = documentType;

  return {
    methodUsed,
    documentType,
    cleanedText: cleanedTextFull,
    cleanedTextFull,
    cleanedTextClinical,
    structured,
  };
}

module.exports = {
  extractMedicalReportText,
};
