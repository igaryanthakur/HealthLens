const express = require("express");
const multer = require("multer");
const uploadRouter = require("./routes/upload");
const interpretRouter = require("./routes/interpret");
const reportsRoute = require("./routes/reports");
const authRoutes = require("./routes/auth");
const logger = require("./utils/logger");
const {
  standardApiLimiter,
  authLimiter,
  uploadLimiter,
  aiInterpretLimiter,
  chatLimiter,
} = require("./middleware/rateLimiters");

function buildApp(app = express()) {
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      status: "ok",
      service: "healthlens-ai-extraction-backend",
    });
  });

  app.use("/api", standardApiLimiter);
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/upload", uploadLimiter, uploadRouter);
  app.use("/api/interpret", aiInterpretLimiter, interpretRouter);
  app.use("/api/prescriptions", require("./routes/prescription"));
  app.use("/api/documents", require("./routes/document"));
  app.use("/api/reports", reportsRoute);
  app.use("/api/repository", require("./routes/repository"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/chat", chatLimiter, require("./routes/chat"));

  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      const maxSizeMB = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
      return res.status(400).json({
        success: false,
        message: `File too large. Max allowed size is ${maxSizeMB} MB.`,
      });
    }

    if (err.message && err.message.includes("Unsupported file type")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    logger.error("Unhandled server error", { error: err.message });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  });

  return app;
}

module.exports = buildApp;
