const express = require("express");
const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { generateChatResponse } = require("../services/aiService");

const router = express.Router();

function serializeReportsForChat(reports) {
  return reports.map((report) => {
    const doc = typeof report.toJSON === "function" ? report.toJSON() : report;
    return {
      reportType: doc.reportType,
      reportDate: doc.reportDate,
      measurements: doc.measurements,
      aiInterpretation: doc.aiInterpretation,
      vitalityScore: doc.vitalityScore,
    };
  });
}

async function chatHandler(req, res, deps = {}) {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request body must include a non-empty message string.",
      });
    }

    const findUserById = deps.findUserById ?? ((id) => User.findById(id));
    const findReports =
      deps.findReports ??
      ((userId) => Report.find({ userId }).sort({ reportDate: 1 }));

    const genChat = deps.generateChatResponse ?? generateChatResponse;

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const reports = await findReports(req.user.id);
    const userProfile = user.profile ?? {};
    const userHistory = serializeReportsForChat(reports);

    const reply = await genChat(message.trim(), userProfile, userHistory);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

router.post("/", protect, chatHandler);

module.exports = router;
module.exports.chatHandler = chatHandler;
module.exports.serializeReportsForChat = serializeReportsForChat;
