const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { saveDocumentHandler } = require("./prescription");

const router = express.Router();

// Generalized reviewed-document save endpoint. Accepts any entity-bearing
// documentType (prescription, scan_report, discharge_summary, typed_note,
// unknown) plus symptoms. Deterministic summary, no Gemini call on save.
router.post("/", protect, saveDocumentHandler);

module.exports = router;
