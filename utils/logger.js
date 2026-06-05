function format(level, message, meta) {
  const ts = new Date().toISOString();
  const redact = String(process.env.PHI_REDACT || "true").toLowerCase() === "true";
  let safeMeta = meta;

  if (redact && meta && typeof meta === "object") {
    safeMeta = { ...meta };
    if (safeMeta.preview && typeof safeMeta.preview === "string") {
      safeMeta.preview = `${safeMeta.preview.slice(0, 120)}...`;
    }
    if (safeMeta.cleanedTextFull) {
      safeMeta.cleanedTextFull = "[REDACTED]";
    }
    if (safeMeta.cleanedTextClinical && typeof safeMeta.cleanedTextClinical === "string") {
      safeMeta.cleanedTextClinical = `${safeMeta.cleanedTextClinical.slice(0, 120)}...`;
    }
  }

  const suffix = safeMeta ? ` ${JSON.stringify(safeMeta)}` : "";
  return `[${ts}] [${level}] ${message}${suffix}`;
}

const logger = {
  info(message, meta) {
    console.log(format("INFO", message, meta));
  },
  warn(message, meta) {
    console.warn(format("WARN", message, meta));
  },
  error(message, meta) {
    console.error(format("ERROR", message, meta));
  },
};

module.exports = logger;
