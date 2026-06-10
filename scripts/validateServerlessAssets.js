const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/** Files Vercel file-tracing often drops; listed in vercel.json includeFiles. */
const REQUIRED_ASSETS = [
  "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
  "node_modules/tesseract.js/src/worker-script/node/index.js",
  "node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm",
  "node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js",
  "node_modules/tesseract.js-core/tesseract-core-simd-lstm.js",
];

const LINUX_NATIVE_PACKAGES = [
  "node_modules/@napi-rs/canvas-linux-x64-gnu",
  "node_modules/@img/sharp-linux-x64",
];

function check(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return relativePath;
  }
  return null;
}

function main() {
  const missing = REQUIRED_ASSETS.map(check).filter(Boolean);

  if (process.platform === "linux") {
    for (const pkg of LINUX_NATIVE_PACKAGES) {
      if (check(pkg)) {
        missing.push(pkg);
      }
    }
  }

  if (missing.length > 0) {
    console.error("validateServerlessAssets: missing runtime files:");
    for (const file of missing) {
      console.error(`  - ${file}`);
    }
    if (process.env.VERCEL === "1") {
      process.exit(1);
    }
    console.warn("validateServerlessAssets: skipped on non-Linux local build");
    return;
  }

  console.log("✓ Serverless runtime assets present for includeFiles bundle");
}

main();
