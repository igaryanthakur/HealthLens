const path = require("path");
const { cleanupTextFull } = require("../utils/textCleanup");
const { extractTextFromPdf } = require("./pdfService");
const { extractTextFromImage } = require("./ocrService");
const { filterClinicalData } = require("./clinicalFilterService");
const { stitchRows } = require("../utils/rowStitcher");
const { extractSections } = require("./sectionExtractor");
const { classifyDocumentType } = require("./reportClassifier");
const { extractPrescription } = require("./prescriptionService");
const { extractDocumentEntities } = require("./documentEntityService");

const DOCUMENT_TYPE_HINTS = new Set([
  "lab_report",
  "prescription",
  "scan_report",
  "discharge_summary",
  "typed_note",
]);

async function extractMedicalReportText(filePath, opts = {}) {
  const extension = path.extname(filePath).toLowerCase();
  const deps = opts.deps || {};
  const extractTextFromPdfFn = deps.extractTextFromPdf || extractTextFromPdf;
  const extractTextFromImageFn = deps.extractTextFromImage || extractTextFromImage;
  const extractPrescriptionFn = deps.extractPrescription || extractPrescription;
  const extractDocumentEntitiesFn = deps.extractDocumentEntities || extractDocumentEntities;
  const filterClinicalDataFn = deps.filterClinicalData || filterClinicalData;

  const hint = opts.documentTypeHint;
  const isForcedPrescription = hint === "prescription";

  let methodUsed = "unknown";
  let rawText = "";
  let ocrPages = [];
  let renderedPageBuffers = [];

  if (isForcedPrescription) {
    methodUsed = "skipped-ocr-forced-vision";
    rawText = "";
    ocrPages = [];
    renderedPageBuffers = [];
  } else if (extension === ".pdf") {
    const result = await extractTextFromPdfFn(filePath);
    methodUsed = result.methodUsed;
    rawText = result.rawText;
    ocrPages = result.ocrPages || [];
    renderedPageBuffers = result.renderedPageBuffers || [];
  } else if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    methodUsed = "image-ocr";
    const result = await extractTextFromImageFn(filePath);
    rawText = result.rawText;
    ocrPages = result.ocrPages || [];
    renderedPageBuffers = [];
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
  const documentType =
    hint && hint !== "auto" && DOCUMENT_TYPE_HINTS.has(hint)
      ? hint
      : classifyDocumentType(cleanedTextFull).documentType;

  // Routing seam: documentType decides which extraction lane runs.
  //   - prescription                              -> Gemini Vision lane
  //   - scan/discharge/typed_note/unknown          -> text entity lane (catch-all)
  //   - lab_report (and default)                   -> deterministic lab pipeline
  let cleanedTextClinical = "";
  let structured;
  switch (documentType) {
    case "prescription": {
      structured = await extractPrescriptionFn(filePath, extension, {
        textHint: cleanedTextFull || undefined,
        sourceImageBuffer: renderedPageBuffers[0] ?? undefined,
      });
      break;
    }
    case "scan_report":
    case "discharge_summary":
    case "typed_note":
    case "unknown": {
      structured = await extractDocumentEntitiesFn(cleanedTextFull, documentType);
      break;
    }
    case "lab_report":
    default: {
      ({ cleanedTextClinical, structured } = filterClinicalDataFn(cleanedTextFull, {
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
