const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const logger = require("../utils/logger");
const { protect } = require("../middleware/authMiddleware");
const {
  resolveSignedDownloadUrl,
  deleteReportFile,
  isCloudinaryEnabled,
  SIGNED_URL_TTL_SECONDS,
} = require("../services/cloudinaryService");

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

async function fileDownloadHandler(req, res, deps = {}) {
  const findById = deps.findById ?? ((id) => Report.findById(id));
  const getDownloadUrl = deps.resolveSignedDownloadUrl ?? resolveSignedDownloadUrl;
  const cloudinaryEnabled = deps.isCloudinaryEnabled ?? isCloudinaryEnabled;

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

    const publicId = report.provenance?.cloudinaryPublicId;
    if (!publicId) {
      return res.status(404).json({
        success: false,
        message: "No stored file for this report.",
      });
    }

    if (!cloudinaryEnabled()) {
      return res.status(503).json({
        success: false,
        message: "File storage is temporarily unavailable.",
      });
    }

    const filename =
      report.provenance?.originalFilename || `healthlens-report-${req.params.id}`;
    const downloadUrl = await getDownloadUrl(
      publicId,
      report.provenance?.cloudinaryResourceType,
      {
        attachmentFilename: filename,
        mimeType: report.provenance?.mimeType,
        originalFilename: report.provenance?.originalFilename,
        deliveryType: report.provenance?.cloudinaryDeliveryType,
      },
    );

    return res.json({
      success: true,
      downloadUrl,
      filename,
      mimeType: report.provenance?.mimeType || "application/octet-stream",
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    logger.error("Report file download failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to generate download link.",
    });
  }
}

async function deleteByIdHandler(req, res, deps = {}) {
  const findById = deps.findById ?? ((id) => Report.findById(id));
  const deleteById = deps.deleteById ?? ((id) => Report.findByIdAndDelete(id));
  const removeStoredFile = deps.deleteReportFile ?? deleteReportFile;
  const cloudinaryEnabled = deps.isCloudinaryEnabled ?? isCloudinaryEnabled;

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

    const publicId = report.provenance?.cloudinaryPublicId;
    if (publicId && cloudinaryEnabled()) {
      try {
        await removeStoredFile(publicId, report.provenance?.cloudinaryResourceType, {
          mimeType: report.provenance?.mimeType,
          originalFilename: report.provenance?.originalFilename,
          deliveryType: report.provenance?.cloudinaryDeliveryType,
        });
      } catch (storageError) {
        logger.warn("Cloudinary delete failed during report removal", {
          reportId: req.params.id,
          publicId,
          error: storageError.message,
        });
      }
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
router.get("/:id/file", protect, fileDownloadHandler);
router.delete("/:id", protect, deleteByIdHandler);
router.get("/:id", protect, getByIdHandler);

module.exports = router;
module.exports.historyHandler = historyHandler;
module.exports.getByIdHandler = getByIdHandler;
module.exports.fileDownloadHandler = fileDownloadHandler;
module.exports.deleteByIdHandler = deleteByIdHandler;
module.exports.isValidReportId = isValidReportId;
