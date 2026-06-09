const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");
const { extractTextFromImageBuffer } = require("./ocrService");

const PDF_MIN_TEXT_LENGTH = Number(process.env.PDF_MIN_TEXT_LENGTH || 100);

function hasEnoughExtractedText(text = "") {
  return text.replace(/\s+/g, "").length >= PDF_MIN_TEXT_LENGTH;
}

async function extractDigitalPdfText(filePath) {
  const pdfBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function renderPdfPagesToImages(filePath) {
  const pdfBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const screenshotResult = await parser.getScreenshot({
      scale: 1.8,
      imageDataUrl: false,
      imageBuffer: true,
    });

    const pageImages = [];

    for (const page of screenshotResult.pages || []) {
      if (page.data) {
        pageImages.push({
          pageIndex: (page.pageNumber || 1) - 1,
          imageBuffer: page.data,
        });
      }
    }

    return pageImages;
  } finally {
    await parser.destroy();
  }
}

async function extractTextFromScannedPdf(filePath) {
  const pageImages = await renderPdfPagesToImages(filePath);
  const pageTexts = [];
  const ocrPages = [];

  for (const pageImage of pageImages) {
    const ocrResult = await extractTextFromImageBuffer(pageImage.imageBuffer, {
      pageIndex: pageImage.pageIndex,
    });
    pageTexts.push(ocrResult.rawText);
    ocrPages.push(...ocrResult.ocrPages);
  }

  return {
    rawText: pageTexts.join("\n"),
    ocrPages,
  };
}

async function extractTextFromPdf(filePath) {
  const directText = await extractDigitalPdfText(filePath);

  if (hasEnoughExtractedText(directText)) {
    return {
      methodUsed: "pdf-parse",
      rawText: directText,
      ocrPages: [],
    };
  }

  const ocrResult = await extractTextFromScannedPdf(filePath);

  return {
    methodUsed: "pdf-ocr-fallback",
    rawText: ocrResult.rawText,
    ocrPages: ocrResult.ocrPages,
  };
}

module.exports = {
  extractTextFromPdf,
  renderPdfPagesToImages,
};
