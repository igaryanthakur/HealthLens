const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function userOrIpKey(req) {
  if (req.user?.id) {
    return req.user.id.toString();
  }
  return ipKeyGenerator(req.ip);
}

const DEFAULTS = {
  standard: {
    windowMs: FIFTEEN_MINUTES,
    max: 300,
    message: {
      success: false,
      error: "Too many requests. Please wait and try again.",
    },
  },
  auth: {
    windowMs: FIFTEEN_MINUTES,
    max: 20,
    message: {
      success: false,
      error: "Too many authentication attempts. Please wait and try again.",
    },
  },
  upload: {
    windowMs: FIFTEEN_MINUTES,
    max: 20,
    message: {
      success: false,
      error: "Too many uploads. Please wait before uploading another document.",
    },
  },
  interpret: {
    windowMs: FIFTEEN_MINUTES,
    max: 8,
    message: {
      success: false,
      error: "AI interpretation limit reached. Please wait and try again.",
    },
  },
  chat: {
    windowMs: FIFTEEN_MINUTES,
    max: 25,
    message: {
      success: false,
      error: "AI chat limit reached. Please wait before sending more messages.",
    },
  },
};

function buildLimiter(config) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    message: config.message,
  });
}

/**
 * Factory for route-specific rate limiters. Pass overrides for tests, e.g.
 * createRateLimiters({ chat: { windowMs: 60_000, max: 3 } })
 */
function createRateLimiters(overrides = {}) {
  const configs = {
    standard: { ...DEFAULTS.standard, ...overrides.standard },
    auth: { ...DEFAULTS.auth, ...overrides.auth },
    upload: { ...DEFAULTS.upload, ...overrides.upload },
    interpret: { ...DEFAULTS.interpret, ...overrides.interpret },
    chat: { ...DEFAULTS.chat, ...overrides.chat },
  };

  return {
    standardApiLimiter: buildLimiter(configs.standard),
    authLimiter: buildLimiter(configs.auth),
    uploadLimiter: buildLimiter(configs.upload),
    aiInterpretLimiter: buildLimiter(configs.interpret),
    chatLimiter: buildLimiter(configs.chat),
  };
}

const {
  standardApiLimiter,
  authLimiter,
  uploadLimiter,
  aiInterpretLimiter,
  chatLimiter,
} = createRateLimiters();

module.exports = {
  createRateLimiters,
  standardApiLimiter,
  authLimiter,
  uploadLimiter,
  aiInterpretLimiter,
  chatLimiter,
};
