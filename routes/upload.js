const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const { extractMedicalReportText } = require("../services/extractionService");
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
    const { methodUsed, documentType, cleanedText, cleanedTextFull, cleanedTextClinical, structured } =
      await extractMedicalReportText(uploadedFilePath, { documentTypeHint });

    structured.provenance = {
      ...(structured.provenance || {}),
      originalFilename: req.file.originalname,
      extractionMethod: structured.provenance?.extractionMethod || methodUsed,
    };

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
    logger.error("Upload extraction failed", { error: error.message });
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
