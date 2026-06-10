const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "client", "dist");
const dest = path.join(__dirname, "..", "public");

if (!fs.existsSync(src)) {
  console.error("ERROR: client/dist does not exist. Did the Vite build succeed?");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

const files = fs.readdirSync(dest);
console.log(`✓ Copied ${files.length} files/dirs to public/:`, files);

if (!files.includes("index.html")) {
  console.error("ERROR: index.html missing from public/!");
  process.exit(1);
}
