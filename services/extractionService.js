const path = require("path");
const { cleanupTextFull } = require("../utils/textCleanup");
const { extractTextFromPdf } = require("./pdfService");
const { extractTextFromImage } = require("./ocrService");
const { filterClinicalData } = require("./clinicalFilterService");
const { stitchRows } = require("../utils/rowStitcher");
const { extractSections } = require("./sectionExtractor");
const { classifyDocumentType } = require("./reportClassifier");

async function extractMedicalReportText(filePath) {
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
  const { documentType } = classifyDocumentType(cleanedTextFull);

  // Routing seam: documentType decides which extraction lane runs. Stage 2
  // plugs the prescription Vision lane in here. For now every document type
  // flows through the deterministic lab pipeline (no behavior change).
  let cleanedTextClinical;
  let structured;
  switch (documentType) {
    // case "prescription": (Stage 2) structured = await extractPrescription(...)
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
