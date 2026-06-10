const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const logger = require("../utils/logger");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function isValidReportId(id) {
  return mongoose.isValidObjectId(id);
}

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

async function getByIdHandler(req, res, deps = {}) {
  const findById = deps.findById ?? ((id) => Report.findById(id));

  if (!isValidReportId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid report id.",
    });
  }

  try {
    const report = await findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    return res.json({ success: true, report });
  } catch (error) {
    logger.error("Report fetch by id failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report.",
    });
  }
}

async function deleteByIdHandler(req, res, deps = {}) {
  const findById = deps.findById ?? ((id) => Report.findById(id));
  const deleteById = deps.deleteById ?? ((id) => Report.findByIdAndDelete(id));

  if (!isValidReportId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid report id.",
    });
  }

  try {
    const report = await findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    await deleteById(req.params.id);

    return res.json({
      success: true,
      reportId: req.params.id,
    });
  } catch (error) {
    logger.error("Report delete failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to delete report.",
    });
  }
}

router.get("/history", protect, historyHandler);
router.delete("/:id", protect, deleteByIdHandler);
router.get("/:id", protect, getByIdHandler);

module.exports = router;
module.exports.historyHandler = historyHandler;
module.exports.getByIdHandler = getByIdHandler;
module.exports.deleteByIdHandler = deleteByIdHandler;
module.exports.isValidReportId = isValidReportId;
