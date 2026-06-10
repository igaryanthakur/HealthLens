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

function validateAccountInput(body) {
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return "Invalid email address.";
    }
  }

  if (body.name === undefined && body.email === undefined) {
    return "Provide at least one field to update (name or email).";
  }

  return null;
}

function validatePasswordInput(body) {
  if (!body?.currentPassword || !body?.newPassword) {
    return "Current password and new password are required.";
  }

  if (String(body.newPassword).length < 8) {
    return "New password must be at least 8 characters.";
  }

  if (body.newPassword === body.currentPassword) {
    return "New password must be different from the current password.";
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

async function updateAccountHandler(req, res, deps = {}) {
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));
  const findUserByEmail =
    deps.findUserByEmail ?? ((email) => User.findOne({ email }));

  try {
    const validationError = validateAccountInput(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (req.body.name !== undefined) {
      user.name = String(req.body.name).trim();
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (email !== user.email) {
        const existing = await findUserByEmail(email);
        if (existing && existing._id.toString() !== user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: "Email is already in use.",
          });
        }
        user.email = email;
      }
    }

    await user.save();

    return res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    logger.error("Account update failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to update account.",
    });
  }
}

async function changePasswordHandler(req, res, deps = {}) {
  const findUserById = deps.findUserById ?? ((id) => User.findById(id));

  try {
    const validationError = validatePasswordInput(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const matches = await user.matchPassword(req.body.currentPassword);
    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    logger.error("Password change failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
}

router.get("/me", protect, meHandler);
router.put("/profile", protect, updateProfileHandler);
router.put("/account", protect, updateAccountHandler);
router.put("/password", protect, changePasswordHandler);

module.exports = router;
module.exports.meHandler = meHandler;
module.exports.updateProfileHandler = updateProfileHandler;
module.exports.updateAccountHandler = updateAccountHandler;
module.exports.changePasswordHandler = changePasswordHandler;
module.exports.validateProfileInput = validateProfileInput;
module.exports.validateAccountInput = validateAccountInput;
module.exports.validatePasswordInput = validatePasswordInput;
