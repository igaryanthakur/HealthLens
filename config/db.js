const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/healthlens";

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  logger.info("MongoDB connected", { database: mongoose.connection.name });
}

module.exports = connectDB;
