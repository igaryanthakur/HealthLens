const express = require("express");
const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { generateChatResponse } = require("../services/groqService");
const { buildBoundedChatHistory } = require("../utils/chatContextBuilder");

const router = express.Router();

const MAX_CHAT_MESSAGE_LENGTH = 1500;

async function chatHandler(req, res, deps = {}) {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request body must include a non-empty message string.",
      });
    }

    if (message.trim().length > MAX_CHAT_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 1500 characters.",
      });
    }

    const findUserById = deps.findUserById ?? ((id) => User.findById(id));
    const findReports =
      deps.findReports ??
      ((userId) =>
        Report.find({ userId }).sort({ reportDate: -1 }).limit(10));

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
    const userHistory = buildBoundedChatHistory(reports);

    const reply = await genChat(message.trim(), userProfile, userHistory);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat Route Error:", error);
    return res.status(503).json({
      success: false,
      message:
        "AI assistant is temporarily unavailable. Your health records are still saved safely.",
    });
  }
}

router.post("/", protect, chatHandler);

module.exports = router;
module.exports.chatHandler = chatHandler;
module.exports.MAX_CHAT_MESSAGE_LENGTH = MAX_CHAT_MESSAGE_LENGTH;
