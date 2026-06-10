const fs = require("fs");
const os = require("os");
const path = require("path");

function resolveTesseractWorkerPath() {
  const candidates = [
    path.join(
      __dirname,
      "..",
      "api",
      ".deps",
      "node_modules",
      "tesseract.js",
      "src",
      "worker-script",
      "node",
      "index.js"
    ),
    path.join(
      __dirname,
      "..",
      "node_modules",
      "tesseract.js",
      "src",
      "worker-script",
      "node",
      "index.js"
    ),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getTesseractWorkerOptions() {
  const options = {
    cachePath: path.join(os.tmpdir(), "healthlens-tesseract"),
  };

  const workerPath = resolveTesseractWorkerPath();
  if (workerPath) {
    options.workerPath = workerPath;
  }

  return options;
}

module.exports = { getTesseractWorkerOptions };
