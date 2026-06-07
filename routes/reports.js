const express = require("express");
const Report = require("../models/Report");
const logger = require("../utils/logger");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

async function historyHandler(req, res, deps = {}) {
  const findReports =
    deps.findReports ??
    (() => Report.find({ userId: req.user.id }).sort({ reportDate: 1 }));

  try {
    const reports = await findReports();
    return res.json({ success: true, reports });
  } catch (error) {
    logger.error("Report history fetch failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report history.",
    });
  }
}

router.get("/history", protect, historyHandler);

module.exports = router;
module.exports.historyHandler = historyHandler;
