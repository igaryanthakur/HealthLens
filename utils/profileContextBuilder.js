function calculateAge(dateOfBirth, referenceDate = new Date()) {
  if (!dateOfBirth) return "Unknown";

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "Unknown";

  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "Unknown";
}

function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return "Unknown";
  }

  const bmi = weightKg / (heightCm / 100) ** 2;
  return bmi.toFixed(1);
}

function buildProfileContext(user) {
  const profile = user?.profile ?? {};
  const lifestyle = profile.lifestyle ?? {};

  const age = calculateAge(profile.dateOfBirth);
  const gender = profile.gender || "Unknown";
  const bmi = calculateBmi(profile.heightCm, profile.weightKg);
  const conditions =
    Array.isArray(profile.chronicConditions) && profile.chronicConditions.length > 0
      ? profile.chronicConditions.join(", ")
      : "None";
  const smoking = lifestyle.smokingStatus || "Unknown";
  const alcohol = lifestyle.alcoholConsumption || "Unknown";

  return `You are HealthLens AI, a clinical analysis assistant. You are analyzing a medical report for a patient with the following profile: Age: ${age}, Gender: ${gender}, BMI: ${bmi}, Chronic Conditions: ${conditions}, Lifestyle: Smoking: ${smoking}, Alcohol: ${alcohol}. Tailor your summary, biomarker analysis, and recommendations specifically to this patient's baseline context.`;
}

module.exports = {
  calculateAge,
  calculateBmi,
  buildProfileContext,
};
