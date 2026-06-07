const mongoose = require("mongoose");

const MeasurementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: String,
  status: { type: String, enum: ["low", "normal", "high", "unknown"], default: "normal" },
  referenceRange: String,
});

const ReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportType: { type: String, default: "CBC" },
    reportDate: { type: Date, default: Date.now },

    measurements: [MeasurementSchema],

    aiInterpretation: {
      summary: { type: String, required: true },
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
  let score = 100;
  for (const m of this.measurements || []) {
    if (m.status === "low" || m.status === "high") {
      score -= 5;
    }
  }
  return score;
});

module.exports = mongoose.model("Report", ReportSchema);
