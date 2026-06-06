const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

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

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `Here is the structured medical data to interpret:\n\n${aiPrompt}` },
          ],
        },
      ],
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("HealthLens AI Generation Error:", error.message);
    throw new Error("Failed to generate AI interpretation.");
  }
}

module.exports = {
  generateInterpretation,
};
