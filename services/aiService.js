const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

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

const LONGITUDINAL_SYSTEM_INSTRUCTION =
  "You are HealthLens AI, a medically safe personal health intelligence assistant. Use only the structured health history provided. Do not diagnose, prescribe, or invent facts. Explain trends using cautious language such as \"may indicate\", \"trend observed\", and \"worth discussing with your doctor\". Always include a safety disclaimer.";

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

/**
 * Initializes and returns the Gemini model with strict JSON formatting rules.
 */
const getAiModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction:
      "You are HealthLens AI, an empathetic medical assistant. Translate the provided deterministic medical report data into simple, patient-friendly language. Do NOT diagnose diseases or prescribe medications. Focus on explaining what the numbers mean, identifying anomalies, and offering general lifestyle recommendations based on the provided parameters.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              "A brief, 2-3 sentence overview of the patient's overall health based on the report.",
          },
          findings: {
            type: SchemaType.ARRAY,
            description:
              "A list of notable parameters, prioritizing abnormal (high/low) values.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                parameter: {
                  type: SchemaType.STRING,
                  description: "Name of the test/parameter (e.g., Hemoglobin)",
                },
                status: {
                  type: SchemaType.STRING,
                  description: "Normal, High, or Low",
                },
                explanation: {
                  type: SchemaType.STRING,
                  description:
                    "A one-sentence, jargon-free explanation of what this parameter does and what the value means.",
                },
              },
              required: ["parameter", "status", "explanation"],
            },
          },
          recommendations: {
            type: SchemaType.ARRAY,
            description:
              "Actionable, general lifestyle or dietary tips based on the findings.",
            items: {
              type: SchemaType.STRING,
            },
          },
        },
        required: ["summary", "findings", "recommendations"],
      },
    },
  });
};

/**
 * Calls Gemini API with the deterministic context string to generate insights.
 * @param {string} aiPrompt - The MEDICAL REPORT CONTEXT text.
 * @returns {Promise<Object>} Formatted JSON payload containing summary, findings, and recommendations.
 */
async function generateInterpretation(aiPrompt, deps = {}) {
  try {
    const model = deps.getModel ? deps.getModel() : getAiModel();

    const profilePrefix = deps.profileContext ? `${deps.profileContext}\n\n` : "";
    const userMessage = `${profilePrefix}Here is the structured medical data to interpret:\n\n${aiPrompt}`;

    const result = await callWithSingleRetry(
      () =>
        withTimeout(
          model.generateContent({
            contents: [
              {
                role: "user",
                parts: [{ text: userMessage }],
              },
            ],
          }),
          AI_TIMEOUT_MS.interpretation,
          "AI interpretation",
        ),
      "AI interpretation",
    );

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("HealthLens AI Generation Error:", error.message);
    throw new Error("Failed to generate AI interpretation.");
  }
}

const PRESCRIPTION_SYSTEM_INSTRUCTION =
  "You are HealthLens AI's prescription reader. Read the supplied prescription image (often handwritten) and return ONLY the structured data requested. Transcribe medications, diagnoses, doctor's advice, and tests advised exactly as written. NEVER invent or 'correct' a drug to one you think is more likely. For every medication and diagnosis, provide a confidence between 0 and 1 reflecting how legible it was, and set uncertain=true whenever you are not confident. If a field is illegible, omit it rather than guessing.";

/**
 * Builds the multimodal Gemini model used to read prescription images.
 * Separated from getAiModel so the lab interpretation schema stays untouched.
 */
const getPrescriptionModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: process.env.GEMINI_VISION_MODEL || "gemini-flash-latest",
    systemInstruction: PRESCRIPTION_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          medications: {
            type: SchemaType.ARRAY,
            description: "Each prescribed medication as written.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING, description: "Drug/brand name" },
                dosage: { type: SchemaType.STRING, description: "Strength, e.g. 500 mg" },
                frequency: {
                  type: SchemaType.STRING,
                  description: "How often, e.g. twice daily / BD / OD",
                },
                duration: { type: SchemaType.STRING, description: "How long, e.g. 5 days" },
                route: { type: SchemaType.STRING, description: "Oral, topical, etc." },
                confidence: {
                  type: SchemaType.NUMBER,
                  description: "Legibility confidence 0-1",
                },
                uncertain: {
                  type: SchemaType.BOOLEAN,
                  description: "True when the reading is not confident",
                },
              },
              required: ["name"],
            },
          },
          diagnoses: {
            type: SchemaType.ARRAY,
            description: "Conditions or diagnoses noted on the prescription.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                condition: { type: SchemaType.STRING },
                status: {
                  type: SchemaType.STRING,
                  description: "active, resolved, or unknown",
                },
                confidence: { type: SchemaType.NUMBER, description: "0-1" },
                uncertain: { type: SchemaType.BOOLEAN },
              },
              required: ["condition"],
            },
          },
          doctorAdvice: {
            type: SchemaType.ARRAY,
            description: "Free-text advice/instructions from the doctor.",
            items: { type: SchemaType.STRING },
          },
          testsAdvised: {
            type: SchemaType.ARRAY,
            description: "Lab tests or scans the doctor advised.",
            items: { type: SchemaType.STRING },
          },
        },
        required: ["medications", "diagnoses", "doctorAdvice", "testsAdvised"],
      },
    },
  });
};

/**
 * Sends a prescription image directly to Gemini Vision and returns the
 * structured entities. Numbers are NEVER extracted here; this lane only
 * handles free-form prescription content.
 *
 * @param {string} imageBase64 - Base64-encoded image bytes (no data: prefix).
 * @param {string} mimeType - e.g. "image/png".
 * @param {Object} deps - { getModel?, textHint? } for testing/hints.
 * @returns {Promise<{medications:Array,diagnoses:Array,doctorAdvice:string[],testsAdvised:string[]}>}
 */
async function extractPrescriptionFromImage(imageBase64, mimeType, deps = {}) {
  try {
    const model = deps.getModel ? deps.getModel() : getPrescriptionModel();

    const hint = deps.textHint
      ? `\n\nRough OCR text (may be inaccurate, use only as a hint):\n${deps.textHint}`
      : "";

    const result = await callWithSingleRetry(
      () =>
        withTimeout(
          model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Read this prescription and extract its contents into the required JSON schema.${hint}`,
                  },
                  { inlineData: { data: imageBase64, mimeType } },
                ],
              },
            ],
          }),
          AI_TIMEOUT_MS.prescriptionVision,
          "Prescription vision",
        ),
      "Prescription vision",
    );

    const parsed = JSON.parse(result.response.text());
    return {
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
      doctorAdvice: Array.isArray(parsed.doctorAdvice) ? parsed.doctorAdvice : [],
      testsAdvised: Array.isArray(parsed.testsAdvised) ? parsed.testsAdvised : [],
    };
  } catch (error) {
    console.error("HealthLens AI Prescription Vision Error:", error.message);
    throw new Error("Failed to read prescription image.");
  }
}

const ENTITY_SYSTEM_INSTRUCTION =
  "You are HealthLens AI's clinical document reader. You are given the extracted text of a PRINTED/TYPED medical document (a discharge summary, radiology/scan report, or typed clinical note). Transcribe the medications, diagnoses, symptoms, doctor's advice, and tests advised exactly as written. NEVER invent, infer, or 'correct' a drug or diagnosis to one you think is more likely. Do NOT extract numeric lab measurements/vitals (those are handled by a separate deterministic pipeline) - leave them out entirely. For every medication, diagnosis, and symptom, provide a confidence between 0 and 1 reflecting how clearly it was stated, and set uncertain=true whenever you are not confident. If a field is not present, omit it rather than guessing.";

/**
 * Builds the Gemini text model used to read printed clinical documents.
 * Separate from getAiModel/getPrescriptionModel so each schema stays isolated.
 */
const getEntityModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: process.env.GEMINI_TEXT_MODEL || "gemini-flash-latest",
    systemInstruction: ENTITY_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          medications: {
            type: SchemaType.ARRAY,
            description: "Each medication mentioned in the document, as written.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING, description: "Drug/brand name" },
                dosage: { type: SchemaType.STRING, description: "Strength, e.g. 500 mg" },
                frequency: {
                  type: SchemaType.STRING,
                  description: "How often, e.g. twice daily / BD / OD",
                },
                duration: { type: SchemaType.STRING, description: "How long, e.g. 5 days" },
                route: { type: SchemaType.STRING, description: "Oral, topical, etc." },
                confidence: {
                  type: SchemaType.NUMBER,
                  description: "Clarity confidence 0-1",
                },
                uncertain: {
                  type: SchemaType.BOOLEAN,
                  description: "True when the reading is not confident",
                },
              },
              required: ["name"],
            },
          },
          diagnoses: {
            type: SchemaType.ARRAY,
            description: "Conditions or diagnoses noted in the document.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                condition: { type: SchemaType.STRING },
                status: {
                  type: SchemaType.STRING,
                  description: "active, resolved, or unknown",
                },
                confidence: { type: SchemaType.NUMBER, description: "0-1" },
                uncertain: { type: SchemaType.BOOLEAN },
              },
              required: ["condition"],
            },
          },
          symptoms: {
            type: SchemaType.ARRAY,
            description: "Symptoms or complaints described in the document.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER, description: "0-1" },
                uncertain: { type: SchemaType.BOOLEAN },
              },
              required: ["description"],
            },
          },
          doctorAdvice: {
            type: SchemaType.ARRAY,
            description: "Free-text advice/instructions from the doctor.",
            items: { type: SchemaType.STRING },
          },
          testsAdvised: {
            type: SchemaType.ARRAY,
            description: "Lab tests or scans the doctor advised.",
            items: { type: SchemaType.STRING },
          },
        },
        required: [
          "medications",
          "diagnoses",
          "symptoms",
          "doctorAdvice",
          "testsAdvised",
        ],
      },
    },
  });
};

/**
 * Sends the cleaned text of a printed clinical document to Gemini and returns
 * the structured entities. Numbers are NEVER extracted here; this lane only
 * handles free-form clinical content (meds/diagnoses/symptoms/advice/tests).
 *
 * @param {string} text - Cleaned full document text.
 * @param {Object} deps - { getModel? } for testing.
 * @returns {Promise<{medications:Array,diagnoses:Array,symptoms:Array,doctorAdvice:string[],testsAdvised:string[]}>}
 */
async function extractEntitiesFromText(text, deps = {}) {
  try {
    const model = deps.getModel ? deps.getModel() : getEntityModel();

    const result = await callWithSingleRetry(
      () =>
        withTimeout(
          model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Read this clinical document and extract its contents into the required JSON schema.\n\nDOCUMENT TEXT:\n${text || ""}`,
                  },
                ],
              },
            ],
          }),
          AI_TIMEOUT_MS.documentEntity,
          "Document entity extraction",
        ),
      "Document entity extraction",
    );

    const parsed = JSON.parse(result.response.text());
    return {
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      doctorAdvice: Array.isArray(parsed.doctorAdvice) ? parsed.doctorAdvice : [],
      testsAdvised: Array.isArray(parsed.testsAdvised) ? parsed.testsAdvised : [],
    };
  } catch (error) {
    console.error("HealthLens AI Document Entity Error:", error.message);
    throw new Error("Failed to read clinical document.");
  }
}

/**
 * Builds the Gemini model used to reword deterministic longitudinal facts into
 * a patient-friendly, medically safe health intelligence brief. Strict JSON
 * schema keeps the response shape stable for the dashboard card.
 */
const getLongitudinalModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const stringList = {
    type: SchemaType.ARRAY,
    items: { type: SchemaType.STRING },
  };

  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: LONGITUDINAL_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              "A 2-4 sentence plain-language overview of what changed across the patient's lab history.",
          },
          whatChanged: stringList,
          improvingSignals: stringList,
          needsAttention: stringList,
          riskFlags: stringList,
          doctorQuestions: stringList,
          followUpSuggestions: stringList,
          disclaimer: { type: SchemaType.STRING },
        },
        required: [
          "summary",
          "whatChanged",
          "improvingSignals",
          "needsAttention",
          "riskFlags",
          "doctorQuestions",
          "followUpSuggestions",
          "disclaimer",
        ],
      },
    },
  });
};

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

// Coerces a parsed Gemini payload into the canonical insights shape: every list
// is an array, the disclaimer is always present, and generatedBy is tagged.
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

/**
 * Rewords the deterministic longitudinal context into a patient-friendly brief.
 * Numbers/deltas are computed deterministically upstream; Gemini only explains.
 * Throws a clean error on failure (including malformed JSON) so the route can
 * fall back to deterministic insights.
 *
 * @param {Object} context - Structured-only insights context (no raw OCR text).
 * @param {Object} deps - { getModel? } for testing.
 * @returns {Promise<Object>} Normalized insights with generatedBy="ai".
 */
async function generateLongitudinalInsights(context, deps = {}) {
  try {
    const model = deps.getModel ? deps.getModel() : getLongitudinalModel();

    const userMessage = `Here is the patient's structured health history. Explain what changed across their lab reports using cautious, non-diagnostic language.\n\n${JSON.stringify(
      context ?? {},
    )}`;

    // Single attempt only (no callWithSingleRetry): a retried timeout could
    // block the dashboard for ~40s; the route falls back to deterministic fast.
    const result = await withTimeout(
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
      AI_TIMEOUT_MS.longitudinalInsights,
      "Longitudinal insights",
    );

    const parsed = JSON.parse(result.response.text());
    return normalizeLongitudinalInsights(parsed);
  } catch (error) {
    console.error("HealthLens AI Longitudinal Insights Error:", error.message);
    throw new Error("Failed to generate longitudinal insights.");
  }
}

function buildChatSystemInstruction(userProfile, userHistory) {
  return `You are HealthLens AI, an empathetic and highly intelligent clinical assistant. You have access to the user's secure Health Vault.

Patient Profile: ${JSON.stringify(userProfile ?? {})}

Medical History (Chronological): ${JSON.stringify(userHistory ?? [])}

Answer the user's prompt using ONLY the provided data. If they ask something outside their data, politely inform them you can only discuss their uploaded records. Be concise, reassuring, and highly specific to their vitals. Do not provide medical diagnoses; advise consulting a doctor for critical issues.`;
}

function createChatModel(systemInstruction) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction,
  });
}

/**
 * Generates a conversational plain-text reply for the chat assistant.
 * @param {string} userMessage - The patient's chat message.
 * @param {Object} userProfile - Nested profile subdocument from User.
 * @param {Array} userHistory - Chronological report documents from Health Vault.
 * @returns {Promise<string>}
 */
async function generateChatResponse(userMessage, userProfile, userHistory, deps = {}) {
  try {
    const systemInstruction = buildChatSystemInstruction(userProfile, userHistory);
    const model = deps.getModel
      ? deps.getModel(systemInstruction)
      : createChatModel(systemInstruction);

    const result = await callWithSingleRetry(
      () =>
        withTimeout(
          model.generateContent(userMessage),
          AI_TIMEOUT_MS.chat,
          "AI chat",
        ),
      "AI chat",
    );

    return result.response.text().trim();
  } catch (error) {
    console.error("HealthLens AI Chat Error:", error.message);
    throw new Error("Failed to generate chat response.");
  }
}

module.exports = {
  generateInterpretation,
  extractPrescriptionFromImage,
  extractEntitiesFromText,
  generateLongitudinalInsights,
  generateChatResponse,
  buildChatSystemInstruction,
  createChatModel,
  isRetryableAiError,
  callWithSingleRetry,
  withTimeout,
};
