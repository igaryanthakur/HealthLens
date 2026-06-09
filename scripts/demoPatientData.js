// Demo patient narrative: Priya Sharma — prediabetic baseline → worsening labs →
// Metformin prescription → improving follow-up (Jan–Jun 2026).
//
// Measurement names MUST stay identical across lab reports for Trend Analytics
// (client/src/lib/trends.js keys by lowercased name).

const DEMO_USER = {
  name: "Priya Sharma",
  email: "demo@healthlens.ai",
  password: "DemoHealth2026!",
  profile: {
    dateOfBirth: new Date("1990-05-15"),
    gender: "Female",
    bloodGroup: "B+",
    heightCm: 162,
    weightKg: 68,
    chronicConditions: ["Prediabetes"],
    lifestyle: {
      smokingStatus: "Never",
      alcoholConsumption: "Occasional",
    },
  },
};

const LAB_MEASUREMENT_NAMES = [
  "HbA1c",
  "Fasting Glucose",
  "Hemoglobin",
  "Total Cholesterol",
];

function labMeasurements(rows) {
  return rows.map(([name, value, unit, status, referenceRange]) => ({
    name,
    value,
    unit,
    status,
    referenceRange,
  }));
}

const DEMO_REPORTS = [
  // Report 1 — Baseline lab (stable)
  {
    reportType: "GENERAL",
    documentType: "lab_report",
    reportDate: new Date("2026-01-15"),
    measurements: labMeasurements([
      ["HbA1c", 5.4, "%", "normal", "4.0–5.6"],
      ["Fasting Glucose", 95, "mg/dL", "normal", "70–100"],
      ["Hemoglobin", 13.5, "g/dL", "normal", "12.0–16.0"],
      ["Total Cholesterol", 190, "mg/dL", "normal", "<200"],
    ]),
    medications: [],
    diagnoses: [],
    symptoms: [],
    doctorAdvice: [],
    testsAdvised: [],
    aiInterpretation: {
      summary:
        "Baseline metabolic panel is within normal limits. No immediate concerns identified.",
      findings: [],
      recommendations: [
        "Continue annual screening given prediabetes history.",
        "Maintain balanced diet and regular physical activity.",
      ],
    },
    provenance: {
      originalFilename: "demo-baseline-jan-2026.pdf",
      extractionMethod: "seed_script",
      confidence: 1,
    },
  },

  // Report 2 — Worsening follow-up (attention)
  {
    reportType: "GENERAL",
    documentType: "lab_report",
    reportDate: new Date("2026-03-20"),
    measurements: labMeasurements([
      ["HbA1c", 6.8, "%", "high", "4.0–5.6"],
      ["Fasting Glucose", 128, "mg/dL", "high", "70–100"],
      ["Hemoglobin", 12.6, "g/dL", "low", "12.0–16.0"],
      ["Total Cholesterol", 222, "mg/dL", "high", "<200"],
    ]),
    medications: [],
    diagnoses: [],
    symptoms: [],
    doctorAdvice: [],
    testsAdvised: [],
    aiInterpretation: {
      summary:
        "Follow-up labs show elevated HbA1c and fasting glucose compared with your January baseline.",
      findings: [
        {
          parameter: "HbA1c",
          status: "high",
          explanation: "Glycemic control appears worse than prior report.",
        },
        {
          parameter: "Fasting Glucose",
          status: "high",
          explanation: "Fasting sugar is above the usual reference range.",
        },
      ],
      recommendations: [
        "Discuss these trends with your physician.",
        "Consider dietary review and repeat testing in 3 months.",
      ],
    },
    provenance: {
      originalFilename: "demo-followup-mar-2026.pdf",
      extractionMethod: "seed_script",
      confidence: 1,
    },
  },

  // Report 3 — Prescription (entity document)
  {
    reportType: "PRESCRIPTION",
    documentType: "prescription",
    reportDate: new Date("2026-03-22"),
    measurements: [],
    medications: [
      {
        name: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration: "3 months",
        route: "oral",
        confidence: 0.95,
        uncertain: false,
      },
    ],
    diagnoses: [
      {
        condition: "Type 2 Diabetes",
        status: "active",
        confidence: 0.9,
        uncertain: false,
      },
    ],
    symptoms: [
      {
        description: "Increased thirst",
        confidence: 0.7,
        uncertain: false,
      },
    ],
    doctorAdvice: [
      "Reduce refined sugar intake",
      "Walk 30 minutes daily",
      "Monitor fasting glucose weekly",
    ],
    testsAdvised: ["Repeat HbA1c in 3 months"],
    aiInterpretation: {
      summary:
        "Prescription recorded: Metformin started for Type 2 Diabetes with lifestyle advice.",
      findings: [],
      recommendations: ["Take medications only as prescribed by your doctor."],
    },
    provenance: {
      originalFilename: "demo-prescription-mar-2026.pdf",
      extractionMethod: "seed_script",
      confidence: 1,
    },
  },

  // Report 4 — Improvement lab (delta story; default on dashboard load)
  {
    reportType: "GENERAL",
    documentType: "lab_report",
    reportDate: new Date("2026-06-05"),
    measurements: labMeasurements([
      ["HbA1c", 6.2, "%", "high", "4.0–5.6"],
      ["Fasting Glucose", 110, "mg/dL", "high", "70–100"],
      ["Hemoglobin", 13.1, "g/dL", "normal", "12.0–16.0"],
      ["Total Cholesterol", 205, "mg/dL", "high", "<200"],
    ]),
    medications: [],
    diagnoses: [],
    symptoms: [],
    doctorAdvice: [],
    testsAdvised: [],
    aiInterpretation: {
      summary:
        "Repeat labs show improvement in HbA1c and fasting glucose since March, though some markers remain above target.",
      findings: [
        {
          parameter: "HbA1c",
          status: "high",
          explanation: "Improved from 6.8% but still above optimal range.",
        },
      ],
      recommendations: [
        "Continue prescribed treatment and lifestyle changes.",
        "Follow up with your doctor on remaining elevated markers.",
      ],
    },
    provenance: {
      originalFilename: "demo-improvement-jun-2026.pdf",
      extractionMethod: "seed_script",
      confidence: 1,
    },
  },
];

module.exports = {
  DEMO_USER,
  DEMO_REPORTS,
  LAB_MEASUREMENT_NAMES,
};
