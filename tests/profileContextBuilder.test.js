const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateAge,
  calculateBmi,
  buildProfileContext,
} = require("../utils/profileContextBuilder");

test("calculateAge returns whole years from date of birth", () => {
  const referenceDate = new Date("2026-06-07T00:00:00.000Z");
  const age = calculateAge(new Date("1990-01-15T00:00:00.000Z"), referenceDate);
  assert.equal(age, "36");
});

test("calculateAge returns Unknown for missing date", () => {
  assert.equal(calculateAge(null), "Unknown");
});

test("calculateBmi returns rounded BMI string", () => {
  assert.equal(calculateBmi(170, 70), "24.2");
});

test("calculateBmi returns Unknown when inputs missing", () => {
  assert.equal(calculateBmi(null, 70), "Unknown");
});

test("buildProfileContext formats full profile string", () => {
  const context = buildProfileContext({
    profile: {
      dateOfBirth: new Date("1985-05-20T00:00:00.000Z"),
      gender: "Female",
      heightCm: 165,
      weightKg: 60,
      chronicConditions: ["Hypertension", "Asthma"],
      lifestyle: {
        smokingStatus: "Never",
        alcoholConsumption: "Occasional",
      },
    },
  });

  assert.match(context, /You are HealthLens AI, a clinical analysis assistant/);
  assert.match(context, /Gender: Female/);
  assert.match(context, /BMI: 22\.0/);
  assert.match(context, /Chronic Conditions: Hypertension, Asthma/);
  assert.match(context, /Lifestyle: Smoking: Never, Alcohol: Occasional/);
});

test("buildProfileContext uses fallbacks for missing profile", () => {
  const context = buildProfileContext({ profile: {} });

  assert.match(context, /Age: Unknown/);
  assert.match(context, /Gender: Unknown/);
  assert.match(context, /BMI: Unknown/);
  assert.match(context, /Chronic Conditions: None/);
  assert.match(context, /Smoking: Unknown, Alcohol: Unknown/);
});
