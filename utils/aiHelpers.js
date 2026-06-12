const AI_TIMEOUT_MS = {
  interpretation: 20_000,
  chat: 15_000,
  prescriptionVision: 30_000,
  documentEntity: 20_000,
  // Short timeout + no retry: this card is "better wording" over an already
  // strong deterministic brief, so it must never make the dashboard wait.
  longitudinalInsights: 8_000,
};

const LONGITUDINAL_DISCLAIMER =
  "HealthLens AI provides informational insights based on uploaded records. It does not diagnose, prescribe treatment, or replace professional medical advice.";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function isRetryableAiError(error) {
  const status = error?.status ?? error?.statusCode;
  if (status != null && RETRYABLE_STATUSES.has(Number(status))) {
    return true;
  }
  const message = String(error?.message || "");
  return message.includes("timed out after");
}

async function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callWithSingleRetry(fn, label) {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryableAiError(error)) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    return fn();
  }
}

function cleanJsonResponse(text = "") {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

function parseJsonResponse(text) {
  return JSON.parse(cleanJsonResponse(text));
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

function normalizeLongitudinalInsights(parsed) {
  const summary =
    typeof parsed?.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : "";

  return {
    summary,
    whatChanged: asStringArray(parsed?.whatChanged),
    improvingSignals: asStringArray(parsed?.improvingSignals),
    needsAttention: asStringArray(parsed?.needsAttention),
    riskFlags: asStringArray(parsed?.riskFlags),
    doctorQuestions: asStringArray(parsed?.doctorQuestions),
    followUpSuggestions: asStringArray(parsed?.followUpSuggestions),
    disclaimer:
      typeof parsed?.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : LONGITUDINAL_DISCLAIMER,
    generatedBy: "ai",
  };
}

module.exports = {
  AI_TIMEOUT_MS,
  LONGITUDINAL_DISCLAIMER,
  isRetryableAiError,
  withTimeout,
  callWithSingleRetry,
  cleanJsonResponse,
  parseJsonResponse,
  asStringArray,
  normalizeLongitudinalInsights,
};
