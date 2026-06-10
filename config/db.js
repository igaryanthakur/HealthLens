const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/healthlens";

const globalForMongoose = globalThis;
const cached = globalForMongoose.__healthlensMongoose || {
  conn: null,
  promise: null,
};

globalForMongoose.__healthlensMongoose = cached;

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      logger.info("MongoDB connected", { database: mongooseInstance.connection.name });
      return mongooseInstance.connection;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
