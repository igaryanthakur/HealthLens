const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const SMOKING_STATUS_OPTIONS = ["Never", "Former", "Current"];
const ALCOHOL_CONSUMPTION_OPTIONS = ["None", "Occasional", "Regular"];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    dateOfBirth: Date,
    gender: { type: String, enum: GENDER_OPTIONS },
    bloodGroup: { type: String, enum: BLOOD_GROUP_OPTIONS },
    heightCm: Number,
    weightKg: Number,
    chronicConditions: [String],
    lifestyle: {
      smokingStatus: { type: String, enum: SMOKING_STATUS_OPTIONS },
      alcoholConsumption: { type: String, enum: ALCOHOL_CONSUMPTION_OPTIONS },
    },
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
module.exports.GENDER_OPTIONS = GENDER_OPTIONS;
module.exports.BLOOD_GROUP_OPTIONS = BLOOD_GROUP_OPTIONS;
module.exports.SMOKING_STATUS_OPTIONS = SMOKING_STATUS_OPTIONS;
module.exports.ALCOHOL_CONSUMPTION_OPTIONS = ALCOHOL_CONSUMPTION_OPTIONS;
