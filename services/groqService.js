const Groq = require("groq-sdk");
const {
  AI_TIMEOUT_MS,
  callWithSingleRetry,
  withTimeout,
  parseJsonResponse,
  normalizeLongitudinalInsights,
} = require("../utils/aiHelpers");

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const INTERPRET_SYSTEM_INSTRUCTION =
  "You are HealthLens AI, an empathetic medical assistant. Translate the provided deterministic medical report data into simple, patient-friendly language. Do NOT diagnose diseases or prescribe medications. Focus on explaining what the numbers mean, identifying anomalies, and offering general lifestyle recommendations based on the provided parameters. Respond with JSON only.";

const INTERPRET_JSON_SCHEMA = `{
  "summary": "string — 2-3 sentence overview",
  "findings": [{ "parameter": "string", "status": "Normal|High|Low", "explanation": "string" }],
  "recommendations": ["string"]
}`;

const ENTITY_SYSTEM_INSTRUCTION =
  "You are HealthLens AI's clinical document reader. You are given the extracted text of a PRINTED/TYPED medical document (a discharge summary, radiology/scan report, or typed clinical note). Transcribe the medications, diagnoses, symptoms, doctor's advice, and tests advised exactly as written. NEVER invent, infer, or 'correct' a drug or diagnosis to one you think is more likely. Do NOT extract numeric lab measurements/vitals (those are handled by a separate deterministic pipeline) - leave them out entirely. For every medication, diagnosis, and symptom, provide a confidence between 0 and 1 reflecting how clearly it was stated, and set uncertain=true whenever you are not confident. If a field is not present, omit it rather than guessing. Respond with JSON only.";

const ENTITY_JSON_SCHEMA = `{
  "medications": [{ "name": "string", "dosage": "string?", "frequency": "string?", "duration": "string?", "route": "string?", "confidence": "number?", "uncertain": "boolean?" }],
  "diagnoses": [{ "condition": "string", "status": "active|resolved|unknown?", "confidence": "number?", "uncertain": "boolean?" }],
  "symptoms": [{ "description": "string", "confidence": "number?", "uncertain": "boolean?" }],
  "doctorAdvice": ["string"],
  "testsAdvised": ["string"]
}`;

const LONGITUDINAL_SYSTEM_INSTRUCTION =
  "You are HealthLens AI, a medically safe personal health intelligence assistant. Use only the structured health history provided. Do not diagnose, prescribe, or invent facts. Explain trends using cautious language such as \"may indicate\", \"trend observed\", and \"worth discussing with your doctor\". Always include a safety disclaimer. Respond with JSON only.";

const LONGITUDINAL_JSON_SCHEMA = `{
  "summary": "string",
  "whatChanged": ["string"],
  "improvingSignals": ["string"],
  "needsAttention": ["string"],
  "riskFlags": ["string"],
  "doctorQuestions": ["string"],
  "followUpSuggestions": ["string"],
  "disclaimer": "string"
}`;

function getGroqClient(deps = {}) {
  if (!process.env.GROQ_API_KEY && !deps.groq) {
    throw new Error("GROQ_API_KEY is missing from the environment variables.");
  }
  return deps.groq ?? new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function extractCompletionContent(completion) {
  return completion?.choices?.[0]?.message?.content ?? "";
}

async function createGroqCompletion(
  { messages, jsonMode = false, temperature = 0.2, maxTokens = 2048, timeoutMs, label },
  deps = {},
) {
  const run = async () => {
    if (deps.createCompletion) {
      return deps.createCompletion({ messages, jsonMode, temperature, maxTokens });
    }

    const client = getGroqClient(deps);
    return client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
      top_p: 1,
      stream: false,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
  };

  const completion = await withTimeout(run(), timeoutMs, label);
  return extractCompletionContent(completion);
}

function buildChatSystemInstruction(userProfile, userHistory) {
  return `You are HealthLens AI, an empathetic and highly intelligent clinical assistant. You have access to the user's secure Health Vault.

Patient Profile: ${JSON.stringify(userProfile ?? {})}

Medical History (Chronological): ${JSON.stringify(userHistory ?? [])}

Answer the user's prompt using ONLY the provided data. If they ask something outside their data, politely inform them you can only discuss their uploaded records. Be concise, reassuring, and highly specific to their vitals. Do not provide medical diagnoses; advise consulting a doctor for critical issues.`;
}

async function extractEntitiesFromText(text, deps = {}) {
  try {
    const content = await callWithSingleRetry(
      () =>
        createGroqCompletion(
          {
            messages: [
              {
                role: "system",
                content: `${ENTITY_SYSTEM_INSTRUCTION}\n\nRequired JSON shape:\n${ENTITY_JSON_SCHEMA}`,
              },
              {
                role: "user",
                content: `Read this clinical document and extract its contents into the required JSON schema.\n\nDOCUMENT TEXT:\n${text || ""}`,
              },
            ],
            jsonMode: true,
            temperature: 0.2,
            maxTokens: 2048,
            timeoutMs: AI_TIMEOUT_MS.documentEntity,
            label: "Document entity extraction",
          },
          deps,
        ),
      "Document entity extraction",
    );

    const parsed = parseJsonResponse(content);
    return {
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      doctorAdvice: Array.isArray(parsed.doctorAdvice) ? parsed.doctorAdvice : [],
      testsAdvised: Array.isArray(parsed.testsAdvised) ? parsed.testsAdvised : [],
    };
  } catch (error) {
    console.error("HealthLens Groq Document Entity Error:", error.message);
    throw new Error("Failed to read clinical document.");
  }
}

async function generateInterpretation(aiPrompt, deps = {}) {
  try {
    const profilePrefix = deps.profileContext ? `${deps.profileContext}\n\n` : "";
    const userMessage = `${profilePrefix}Here is the structured medical data to interpret:\n\n${aiPrompt}`;

    const content = await callWithSingleRetry(
      () =>
        createGroqCompletion(
          {
            messages: [
              {
                role: "system",
                content: `${INTERPRET_SYSTEM_INSTRUCTION}\n\nRequired JSON shape:\n${INTERPRET_JSON_SCHEMA}`,
              },
              { role: "user", content: userMessage },
            ],
            jsonMode: true,
            temperature: 0.2,
            maxTokens: 2048,
            timeoutMs: AI_TIMEOUT_MS.interpretation,
            label: "AI interpretation",
          },
          deps,
        ),
      "AI interpretation",
    );

    return parseJsonResponse(content);
  } catch (error) {
    console.error("HealthLens Groq Interpretation Error:", error.message);
    throw new Error("Failed to generate AI interpretation.");
  }
}

async function generateLongitudinalInsights(context, deps = {}) {
  try {
    const userMessage = `Here is the patient's structured health history. Explain what changed across their lab reports using cautious, non-diagnostic language.\n\n${JSON.stringify(
      context ?? {},
    )}`;

    const content = await withTimeout(
      createGroqCompletion(
        {
          messages: [
            {
              role: "system",
              content: `${LONGITUDINAL_SYSTEM_INSTRUCTION}\n\nRequired JSON shape:\n${LONGITUDINAL_JSON_SCHEMA}`,
            },
            { role: "user", content: userMessage },
          ],
          jsonMode: true,
          temperature: 0.2,
          maxTokens: 1536,
          timeoutMs: AI_TIMEOUT_MS.longitudinalInsights,
          label: "Longitudinal insights",
        },
        deps,
      ),
      AI_TIMEOUT_MS.longitudinalInsights,
      "Longitudinal insights",
    );

    return normalizeLongitudinalInsights(parseJsonResponse(content));
  } catch (error) {
    console.error("HealthLens Groq Longitudinal Insights Error:", error.message);
    throw new Error("Failed to generate longitudinal insights.");
  }
}

async function generateChatResponse(userMessage, userProfile, userHistory, deps = {}) {
  try {
    const systemInstruction = buildChatSystemInstruction(userProfile, userHistory);

    const content = await callWithSingleRetry(
      () =>
        createGroqCompletion(
          {
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userMessage },
            ],
            jsonMode: false,
            temperature: 0.7,
            maxTokens: 1024,
            timeoutMs: AI_TIMEOUT_MS.chat,
            label: "AI chat",
          },
          deps,
        ),
      "AI chat",
    );

    return String(content).trim();
  } catch (error) {
    console.error("HealthLens Groq Chat Error:", error.message);
    throw new Error("Failed to generate chat response.");
  }
}

module.exports = {
  extractEntitiesFromText,
  generateInterpretation,
  generateLongitudinalInsights,
  generateChatResponse,
  buildChatSystemInstruction,
  getGroqClient,
  createGroqCompletion,
  GROQ_MODEL,
};
