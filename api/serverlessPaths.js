const fs = require("fs");
const path = require("path");

/**
 * Vercel file-tracing often drops native/WASM deps used only on upload.
 * stageServerlessDeps.js mirrors them under api/.deps/node_modules; prepend NODE_PATH.
 */
function registerServerlessModulePaths() {
  if (process.env.VERCEL !== "1") {
    return;
  }

  const depsNodeModules = path.join(__dirname, ".deps", "node_modules");
  if (!fs.existsSync(depsNodeModules)) {
    return;
  }

  const current = process.env.NODE_PATH || "";
  const parts = current.split(path.delimiter).filter(Boolean);
  if (!parts.includes(depsNodeModules)) {
    process.env.NODE_PATH = [depsNodeModules, ...parts].join(path.delimiter);
    require("module").Module._initPaths();
  }
}

registerServerlessModulePaths();
