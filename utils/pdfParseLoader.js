const fs = require("fs");
const path = require("path");
const { ensureCanvasPolyfill } = require("./canvasPolyfill");

let PDFParseClass = null;

function resolvePdfParseEntry() {
  const packageRoot = path.join(__dirname, "..", "node_modules", "pdf-parse");
  const workerPath = path.join(
    packageRoot,
    "dist",
    "pdf-parse",
    "cjs",
    "pdf.worker.mjs"
  );

  if (fs.existsSync(workerPath)) {
    return packageRoot;
  }

  return "pdf-parse";
}

function getPDFParse() {
  if (PDFParseClass) {
    return PDFParseClass;
  }

  ensureCanvasPolyfill();
  PDFParseClass = require(resolvePdfParseEntry()).PDFParse;
  return PDFParseClass;
}

module.exports = { getPDFParse, resolvePdfParseEntry };
