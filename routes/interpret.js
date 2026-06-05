const express = require("express");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");

const router = express.Router();

function interpretHandler(req, res) {
  const structured = req.body?.structured;

  if (!structured || !Array.isArray(structured.measurements)) {
    return res.status(400).json({
      success: false,
      message: "Request body must include structured.measurements array.",
    });
  }

  const aiPrompt = generateClinicalSummaryPrompt(structured);

  return res.status(200).json({
    success: true,
    aiPrompt,
  });
}

router.post("/", interpretHandler);

module.exports = router;
module.exports.interpretHandler = interpretHandler;
