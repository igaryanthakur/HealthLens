require("dotenv").config();

const express = require("express");
const buildApp = require("./createApp");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

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

const PORT = Number(process.env.PORT || 5000);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
