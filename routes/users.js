const express = require("express");
const User = require("../models/User");
const {
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  SMOKING_STATUS_OPTIONS,
  ALCOHOL_CONSUMPTION_OPTIONS,
} = require("../models/User");
const { formatUser } = require("../utils/formatUser");
const { protect } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

const PROFILE_FIELDS = [
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "heightCm",
  "weightKg",
  "chronicConditions",
  "lifestyle",
];

function validateProfileInput(body) {
  if (body.gender !== undefined && !GENDER_OPTIONS.includes(body.gender)) {
    return "Invalid gender value.";
  }

  if (body.bloodGroup !== undefined && !BLOOD_GROUP_OPTIONS.includes(body.bloodGroup)) {
    return "Invalid blood group value.";
  }

  if (body.heightCm !== undefined && (typeof body.heightCm !== "number" || body.heightCm <= 0)) {
    return "heightCm must be a positive number.";
  }

  if (body.weightKg !== undefined && (typeof body.weightKg !== "number" || body.weightKg <= 0)) {
    return "weightKg must be a positive number.";
  }

  if (body.chronicConditions !== undefined && !Array.isArray(body.chronicConditions)) {
    return "chronicConditions must be an array of strings.";
  }

  if (body.lifestyle !== undefined) {
    if (typeof body.lifestyle !== "object" || body.lifestyle === null) {
      return "lifestyle must be an object.";
    }

    if (
      body.lifestyle.smokingStatus !== undefined &&
      !SMOKING_STATUS_OPTIONS.includes(body.lifestyle.smokingStatus)
    ) {
      return "Invalid smokingStatus value.";
    }

    if (
      body.lifestyle.alcoholConsumption !== undefined &&
      !ALCOHOL_CONSUMPTION_OPTIONS.includes(body.lifestyle.alcoholConsumption)
    ) {
      return "Invalid alcoholConsumption value.";
    }
  }

  if (body.dateOfBirth !== undefined) {
    const parsed = new Date(body.dateOfBirth);
    if (Number.isNaN(parsed.getTime())) {
      return "Invalid dateOfBirth value.";
    }
  }

  return null;
}

async function meHandler(req, res, deps = {}) {
  const findUserById =
    deps.findUserById ?? ((id) => User.findById(id).select("-password"));

  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    logger.error("Fetch current user failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
    });
  }
}

async function updateProfileHandler(req, res, deps = {}) {
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));

  try {
    const validationError = validateProfileInput(req.body ?? {});
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.profile) {
      user.profile = {};
    }

    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        if (field === "lifestyle" && typeof req.body.lifestyle === "object") {
          user.profile.lifestyle = {
            ...(user.profile.lifestyle?.toObject?.() ?? user.profile.lifestyle ?? {}),
            ...req.body.lifestyle,
          };
        } else if (field === "dateOfBirth") {
          user.profile.dateOfBirth = new Date(req.body.dateOfBirth);
        } else {
          user.profile[field] = req.body[field];
        }
      }
    }

    await user.save();

    return res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    logger.error("Profile update failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
}

router.get("/me", protect, meHandler);
router.put("/profile", protect, updateProfileHandler);

module.exports = router;
module.exports.meHandler = meHandler;
module.exports.updateProfileHandler = updateProfileHandler;
module.exports.validateProfileInput = validateProfileInput;
