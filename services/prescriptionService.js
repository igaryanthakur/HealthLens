const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { extractPrescriptionFromImage } = require("./geminiVisionService");
const { renderPdfPagesToImages } = require("./pdfService");
const { validateDrugName } = require("../utils/clinical/drugDictionary");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

/**
 * Gentle preprocessing tuned for Vision (NOT the lab OCR pipeline).
 * We deliberately avoid grayscale/sharpen/threshold: Gemini reads color
 * handwriting better than a binarized image. We only auto-rotate (EXIF/deskew)
 * and upscale small images so faint strokes survive.
 */
async function preprocessForVision(input) {
  const image = sharp(input).rotate();
  const metadata = await image.metadata().catch(() => ({}));

  if (metadata.width && metadata.width < 1000) {
    image.resize({ width: 1600, withoutEnlargement: false });
  }

  return image.png().toBuffer();
}

async function loadPrescriptionImageBuffer(filePath, extension, deps = {}) {
  if (deps.sourceImageBuffer) {
    return deps.sourceImageBuffer;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return fs.readFile(filePath);
  }

  if (extension === ".pdf") {
    // TODO: Handle multi-page PDF prescriptions in the future. For Stage 2a we
    // only read page 0, which covers the common single-sheet script.
    const pages = await renderPdfPagesToImages(filePath);
    if (!pages.length || !pages[0].imageBuffer) {
      throw new Error("Could not render the prescription PDF to an image.");
    }
    return pages[0].imageBuffer;
  }

  throw new Error("Unsupported file type for prescription extraction.");
}

/**
 * Marks each medication uncertain when the drug dictionary cannot confirm the
 * name, attaching a suggestion. The model's own uncertainty is preserved (OR'd).
 */
function annotateMedications(medications = []) {
  return medications.map((med) => {
    const { matched, suggestion, score } = validateDrugName(med.name || "");
    return {
      ...med,
      uncertain: Boolean(med.uncertain) || !matched,
      dictionaryMatched: matched,
      suggestion: matched ? null : suggestion,
      dictionaryScore: score,
    };
  });
}

/**
 * Reads a prescription file and returns a `structured`-shaped object that the
 * upload route can return and the review UI can edit. No numeric extraction.
 *
 * @param {string} filePath - Path to the uploaded prescription file.
 * @param {string} extension - Lowercased file extension (e.g. ".png").
 * @param {Object} deps - { textHint, extractVision, preprocess } for hints/tests.
 * @returns {Promise<Object>} structured prescription payload.
 */
async function extractPrescription(filePath, extension, deps = {}) {
  const ext = (extension || path.extname(filePath)).toLowerCase();
  const preprocess = deps.preprocess ?? preprocessForVision;
  const extractVision = deps.extractVision ?? extractPrescriptionFromImage;

  const sourceBuffer = await loadPrescriptionImageBuffer(filePath, ext, deps);
  const visionBuffer = await preprocess(sourceBuffer);
  const imageBase64 = visionBuffer.toString("base64");

  const extracted = await extractVision(imageBase64, "image/png", {
    textHint: deps.textHint,
  });

  return {
    documentType: "prescription",
    reportType: "PRESCRIPTION",
    measurements: [],
    medications: annotateMedications(extracted.medications),
    diagnoses: extracted.diagnoses || [],
    doctorAdvice: extracted.doctorAdvice || [],
    testsAdvised: extracted.testsAdvised || [],
    provenance: {
      extractionMethod: "gemini-vision",
    },
  };
}

module.exports = {
  extractPrescription,
  annotateMedications,
  preprocessForVision,
  loadPrescriptionImageBuffer,
};
