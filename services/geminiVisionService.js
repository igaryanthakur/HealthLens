const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const {
  AI_TIMEOUT_MS,
  callWithSingleRetry,
  withTimeout,
  parseJsonResponse,
} = require("../utils/aiHelpers");

const PRESCRIPTION_SYSTEM_INSTRUCTION =
  "You are HealthLens AI's prescription reader. Read the supplied prescription image (often handwritten) and return ONLY the structured data requested. Transcribe medications, diagnoses, doctor's advice, and tests advised exactly as written. NEVER invent or 'correct' a drug to one you think is more likely. For every medication and diagnosis, provide a confidence between 0 and 1 reflecting how legible it was, and set uncertain=true whenever you are not confident. If a field is illegible, omit it rather than guessing.";

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

    const parsed = parseJsonResponse(result.response.text());
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

module.exports = {
  extractPrescriptionFromImage,
  getPrescriptionModel,
};
