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

router.post("/", protect, upload.single("report"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded. Use form-data with field name 'report'.",
    });
  }

  const uploadedFilePath = req.file.path;
  const documentTypeHint = req.body?.documentType;

  try {
    const { extractMedicalReportText } = require("../services/extractionService");
    const { methodUsed, documentType, cleanedText, cleanedTextFull, cleanedTextClinical, structured } =
      await extractMedicalReportText(uploadedFilePath, { documentTypeHint });

    structured.provenance = {
      ...(structured.provenance || {}),
      originalFilename: req.file.originalname,
      extractionMethod: structured.provenance?.extractionMethod || methodUsed,
    };

    if (isCloudinaryEnabled()) {
      try {
        const fileStorage = await uploadReportFile(uploadedFilePath, {
          userId: req.user.id,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
        });

        structured.provenance = {
          ...structured.provenance,
          ...fileStorage,
        };
      } catch (storageError) {
        logger.error("Cloudinary upload failed", { error: storageError.message });
        return res.status(503).json({
          success: false,
          message:
            "Report was extracted but file storage is temporarily unavailable. Please try uploading again.",
        });
      }
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
      /Cannot find module|ENOENT|sharp|tesseract|canvas|wasm|worker/i.test(message);

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
      await cleanupFile(uploadedFilePath);
    } catch (cleanupError) {
      logger.warn("Temporary upload cleanup failed", {
        path: uploadedFilePath,
        error: cleanupError.message,
      });
    }
  }
});

module.exports = router;
