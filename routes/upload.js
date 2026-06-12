const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadReportFile,
  isCloudinaryEnabled,
} = require("../services/cloudinaryService");
const { cleanupFile } = require("../utils/fileCleanup");
const logger = require("../utils/logger");

const router = express.Router();

async function handleUpload(req, res, next, deps = {}) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded. Use form-data with field name 'report'.",
    });
  }

  const uploadedFilePath = req.file.path;
  const documentTypeHint = req.body?.documentType;

  const extractMedicalReportText =
    deps.extractMedicalReportText ||
    require("../services/extractionService").extractMedicalReportText;
  const uploadReportFileFn = deps.uploadReportFile || uploadReportFile;
  const isCloudinaryEnabledFn = deps.isCloudinaryEnabled || isCloudinaryEnabled;
  const cleanupFileFn = deps.cleanupFile || cleanupFile;

  try {
    const cloudinaryEnabled = isCloudinaryEnabledFn();

    const extractionPromise = extractMedicalReportText(uploadedFilePath, {
      documentTypeHint,
    });

    const storagePromise = cloudinaryEnabled
      ? uploadReportFileFn(uploadedFilePath, {
          userId: req.user.id,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
        })
          .then((data) => ({ ok: true, data }))
          .catch((error) => ({ ok: false, error }))
      : Promise.resolve({ ok: true, data: null });

    const [extractionResult, storageResult] = await Promise.all([
      extractionPromise,
      storagePromise,
    ]);

    const {
      methodUsed,
      documentType,
      cleanedText,
      cleanedTextFull,
      cleanedTextClinical,
      structured,
    } = extractionResult;

    structured.provenance = {
      ...(structured.provenance || {}),
      originalFilename: req.file.originalname,
      extractionMethod: structured.provenance?.extractionMethod || methodUsed,
    };

    if (cloudinaryEnabled && !storageResult.ok) {
      logger.error("Cloudinary upload failed", {
        error: storageResult.error.message,
      });
      return res.status(503).json({
        success: false,
        message:
          "Report was extracted but file storage is temporarily unavailable. Please try uploading again.",
      });
    }

    if (storageResult.data) {
      structured.provenance = {
        ...structured.provenance,
        ...storageResult.data,
      };
    }

    logger.info("Extraction completed", {
      filename: req.file.originalname,
      extractionMethod: methodUsed,
      documentType,
      reportType: structured.reportType,
      fullTextLength: cleanedTextFull.length,
      clinicalTextLength: (cleanedTextClinical || "").length,
      measurementCount: (structured.measurements || []).length,
      medicationCount: (structured.medications || []).length,
      flagCount: (structured.flags || []).length,
    });
    if (cleanedTextClinical) {
      logger.info("Clinical extraction preview", {
        preview: cleanedTextClinical.slice(0, 250),
      });
    }

    return res.status(200).json({
      success: true,
      originalFilename: req.file.originalname,
      extractionMethod: methodUsed,
      cleanedText,
      cleanedTextFull,
      cleanedTextClinical,
      structured,
    });
  } catch (error) {
    logger.error("Upload extraction failed", {
      error: error.message,
      stack: error.stack,
    });

    const message = error.message || "";
    const isAiLaneFailure =
      message.includes("Failed to read prescription") ||
      message.includes("Failed to read clinical document");

    if (isAiLaneFailure) {
      return res.status(503).json({
        success: false,
        message:
          "AI extraction is temporarily unavailable for this document type. Please try again shortly or upload a lab report.",
      });
    }

    const isRuntimeDependencyFailure =
      /Cannot find module|ENOENT|sharp|tesseract|canvas|wasm|worker|pdf-parse|pdf\.worker/i.test(
        message
      );

    if (isRuntimeDependencyFailure) {
      return res.status(503).json({
        success: false,
        message:
          "Document processing is temporarily unavailable on this server. Please try again or use a smaller digital PDF.",
      });
    }

    return next(error);
  } finally {
    try {
      await cleanupFileFn(uploadedFilePath);
    } catch (cleanupError) {
      logger.warn("Temporary upload cleanup failed", {
        path: uploadedFilePath,
        error: cleanupError.message,
      });
    }
  }
}

router.post("/", protect, upload.single("report"), (req, res, next) =>
  handleUpload(req, res, next),
);

module.exports = router;
module.exports.handleUpload = handleUpload;
