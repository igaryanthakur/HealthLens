const mongoose = require("mongoose");
const { computeVitalityScore } = require("../utils/clinical/vitalityScore");

const DOCUMENT_TYPES = [
  "lab_report",
  "prescription",
  "scan_report",
  "discharge_summary",
  "typed_note",
  "unknown",
];

const MeasurementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: String,
  status: { type: String, enum: ["low", "normal", "high", "unknown"], default: "normal" },
  referenceRange: String,
});

const MedicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: String,
    frequency: String,
    duration: String,
    route: String,
    confidence: Number,
    uncertain: { type: Boolean, default: false },
  },
  { _id: false },
);

const DiagnosisSchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    status: { type: String, enum: ["active", "resolved", "unknown"], default: "unknown" },
    confidence: Number,
    uncertain: { type: Boolean, default: false },
  },
  { _id: false },
);

const SymptomSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    confidence: Number,
    uncertain: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProvenanceSchema = new mongoose.Schema(
  {
    originalFilename: String,
    extractionMethod: String,
    confidence: Number,
    cloudinaryPublicId: String,
    cloudinaryResourceType: { type: String, enum: ["image", "raw"], default: "image" },
    mimeType: String,
    bytes: Number,
  },
  { _id: false },
);

const ReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportType: { type: String, default: "CBC" },
    documentType: { type: String, enum: DOCUMENT_TYPES, default: "lab_report" },
    reportDate: { type: Date, default: Date.now },

    measurements: [MeasurementSchema],

    medications: { type: [MedicationSchema], default: [] },
    diagnoses: { type: [DiagnosisSchema], default: [] },
    symptoms: { type: [SymptomSchema], default: [] },
    doctorAdvice: { type: [String], default: [] },
    testsAdvised: { type: [String], default: [] },
    provenance: ProvenanceSchema,

    aiInterpretation: {
      summary: { type: String },
      findings: [
        {
          parameter: String,
          status: String,
          explanation: String,
        },
      ],
      recommendations: [String],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

ReportSchema.virtual("vitalityScore").get(function () {
  return computeVitalityScore(this.measurements);
});

module.exports = mongoose.model("Report", ReportSchema);
