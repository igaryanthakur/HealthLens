const fs = require("fs");
const path = require("path");
const { ensureCanvasPolyfill } = require("./canvasPolyfill");

let PDFParseClass = null;

function hasCompletePdfParsePackage(packageRoot) {
  if (!packageRoot || packageRoot === "pdf-parse") {
    return false;
  }

  const workerPath = path.join(
    packageRoot,
    "dist",
    "pdf-parse",
    "cjs",
    "pdf.worker.mjs"
  );
  const indexPath = path.join(packageRoot, "dist", "pdf-parse", "cjs", "index.cjs");

  return fs.existsSync(workerPath) && fs.existsSync(indexPath);
}

function resolvePdfParseEntry() {
  const candidates = [
    path.join(__dirname, "..", "api", ".deps", "node_modules", "pdf-parse"),
    path.join(__dirname, "..", "node_modules", "pdf-parse"),
  ];

  for (const candidate of candidates) {
    if (hasCompletePdfParsePackage(candidate)) {
      return candidate;
    }
  }

  return "pdf-parse";
}

function getPDFParse() {
  if (PDFParseClass) {
    return PDFParseClass;
  }

  ensureCanvasPolyfill();
  const entry = resolvePdfParseEntry();
  PDFParseClass = require(entry).PDFParse;
  return PDFParseClass;
}

module.exports = { getPDFParse, resolvePdfParseEntry };
