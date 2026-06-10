const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DEST = path.join(ROOT, "api", ".deps", "node_modules");

const SHARED_PACKAGES = [
  "@napi-rs/canvas",
  "@img/colour",
  "sharp",
  "pdf-parse",
  "tesseract.js",
  "tesseract.js-core",
  "wasm-feature-detect",
  "regenerator-runtime",
  "zlibjs",
];

const PLATFORM_NATIVES = {
  "win32-x64": ["@napi-rs/canvas-win32-x64-msvc", "@img/sharp-win32-x64"],
  "linux-x64": ["@napi-rs/canvas-linux-x64-gnu", "@img/sharp-linux-x64"],
  "linux-arm64": ["@napi-rs/canvas-linux-arm64-gnu", "@img/sharp-linux-arm64"],
  "darwin-x64": ["@napi-rs/canvas-darwin-x64", "@img/sharp-darwin-x64"],
  "darwin-arm64": ["@napi-rs/canvas-darwin-arm64", "@img/sharp-darwin-arm64"],
};

function copyPackage(packageName) {
  const src = path.join(ROOT, "node_modules", packageName);
  const dest = path.join(DEST, packageName);

  if (!fs.existsSync(src)) {
    console.warn(`stageServerlessDeps: skip missing ${packageName}`);
    return false;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

function main() {
  fs.rmSync(path.join(ROOT, "api", ".deps"), { recursive: true, force: true });
  fs.mkdirSync(DEST, { recursive: true });

  const platformKey = `${process.platform}-${process.arch}`;
  const nativePackages = PLATFORM_NATIVES[platformKey] || [];
  const copied = [];

  for (const packageName of [...SHARED_PACKAGES, ...nativePackages]) {
    if (copyPackage(packageName)) {
      copied.push(packageName);
    }
  }

  if (copied.length === 0) {
    console.error("stageServerlessDeps: nothing copied — run npm install at repo root first");
    process.exit(1);
  }

  const pdfWorker = path.join(
    DEST,
    "pdf-parse",
    "dist",
    "pdf-parse",
    "cjs",
    "pdf.worker.mjs"
  );
  if (!fs.existsSync(pdfWorker)) {
    console.error("stageServerlessDeps: pdf.worker.mjs missing after staging pdf-parse");
    process.exit(1);
  }

  console.log(
    `✓ Staged ${copied.length} serverless packages for ${platformKey}:`,
    copied.join(", ")
  );
}

main();
