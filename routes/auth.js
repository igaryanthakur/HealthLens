const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { formatUser } = require("../utils/formatUser");
const logger = require("../utils/logger");

const router = express.Router();

function generateToken(id) {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

async function registerHandler(req, res, deps = {}) {
  const findUserByEmail = deps.findUserByEmail ?? ((email) => User.findOne({ email }));
  const createUser = deps.createUser ?? ((data) => User.create(data));

  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await createUser({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      user: formatUser(user),
      token,
    });
  } catch (error) {
    logger.error("Registration failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
}

async function loginHandler(req, res, deps = {}) {
  const findUserByEmail = deps.findUserByEmail ?? ((email) => User.findOne({ email }));

  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      user: formatUser(user),
      token,
    });
  } catch (error) {
    logger.error("Login failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
}

router.post("/register", registerHandler);
router.post("/login", loginHandler);

module.exports = router;
module.exports.registerHandler = registerHandler;
module.exports.loginHandler = loginHandler;
