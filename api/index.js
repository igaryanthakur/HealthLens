require("./serverlessPaths");

require("dotenv").config();

const express = require("express");
const buildApp = require("../createApp");
const connectDB = require("../config/db");
const logger = require("../utils/logger");

const app = express();

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

buildApp(app);

module.exports = app;
