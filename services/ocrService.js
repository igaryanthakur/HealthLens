const sharp = require("sharp");
const Tesseract = require("tesseract.js");

const OCR_LANGUAGE = process.env.OCR_LANGUAGE || "eng";

async function preprocessImage(input) {
  return sharp(input)
    .rotate()
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

async function runOcr(imageBuffer) {
  const result = await Tesseract.recognize(imageBuffer, OCR_LANGUAGE);
  return {
    text: result.data?.text || "",
    words: (result.data?.words || []).map((word) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox
        ? {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          }
        : null,
    })),
  };
}

async function extractTextFromImage(imagePath, options = {}) {
  const preprocessedBuffer = await preprocessImage(imagePath);
  const ocrResult = await runOcr(preprocessedBuffer);
  return {
    rawText: ocrResult.text,
    ocrPages: [
      {
        pageIndex: options.pageIndex || 0,
        words: ocrResult.words,
      },
    ],
  };
}

async function extractTextFromImageBuffer(imageBuffer, options = {}) {
  const preprocessedBuffer = await preprocessImage(imageBuffer);
  const ocrResult = await runOcr(preprocessedBuffer);
  return {
    rawText: ocrResult.text,
    ocrPages: [
      {
        pageIndex: options.pageIndex || 0,
        words: ocrResult.words,
      },
    ],
  };
}

module.exports = {
  extractTextFromImage,
  extractTextFromImageBuffer,
};
