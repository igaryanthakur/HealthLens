let loaded = false;

/**
 * pdf-parse v2 expects browser canvas APIs. Load @napi-rs/canvas first on serverless.
 */
function ensureCanvasPolyfill() {
  if (loaded) {
    return;
  }

  const canvas = require("@napi-rs/canvas");

  if (!global.DOMMatrix && canvas.DOMMatrix) {
    global.DOMMatrix = canvas.DOMMatrix;
  }
  if (!global.ImageData && canvas.ImageData) {
    global.ImageData = canvas.ImageData;
  }
  if (!global.Path2D && canvas.Path2D) {
    global.Path2D = canvas.Path2D;
  }

  loaded = true;
}

module.exports = { ensureCanvasPolyfill };
