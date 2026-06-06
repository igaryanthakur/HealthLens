const express = require("express");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");
const { generateInterpretation } = require("../services/aiService");

const router = express.Router();

async function interpretHandler(req, res, deps = {}) {
  try {
    const structured = req.body?.structured;
    const genInterpret = deps.generateInterpretation ?? generateInterpretation;

    if (!structured || !Array.isArray(structured.measurements)) {
      return res.status(400).json({
        success: false,
        message: "Request body must include structured.measurements array.",
      });
    }

    const aiPrompt = generateClinicalSummaryPrompt(structured);
    const interpretation = await genInterpret(aiPrompt);

    return res.status(200).json({
      success: true,
      aiPrompt,
      data: interpretation,
    });
  } catch (error) {
    console.error("Interpretation Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

router.post("/", interpretHandler);

module.exports = router;
module.exports.interpretHandler = interpretHandler;
