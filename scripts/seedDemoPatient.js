require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Report = require("../models/Report");
const { DEMO_USER, DEMO_REPORTS } = require("./demoPatientData");

async function seed() {
  await connectDB();

  let user = await User.findOne({ email: DEMO_USER.email });
  let passwordReset = false;

  if (!user) {
    user = new User({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      profile: DEMO_USER.profile,
    });
    await user.save();
    passwordReset = true;
  } else {
    user.name = DEMO_USER.name;
    user.profile = DEMO_USER.profile;

    if (process.env.RESET_DEMO_PASSWORD === "true") {
      user.password = DEMO_USER.password;
      passwordReset = true;
    }

    await user.save();
  }

  const deleted = await Report.deleteMany({ userId: user._id });

  for (const reportData of DEMO_REPORTS) {
    await Report.create({ ...reportData, userId: user._id });
  }

  const dates = DEMO_REPORTS.map((r) => r.reportDate.toISOString().slice(0, 10));
  const dateRange = `${dates[0]} → ${dates[dates.length - 1]}`;

  console.log("");
  console.log("Demo patient seeded successfully");
  console.log("────────────────────────────────");
  console.log(`  User ID:      ${user._id}`);
  console.log(`  Email:        ${DEMO_USER.email}`);
  console.log(`  Reports:      ${DEMO_REPORTS.length} (${dateRange})`);
  console.log(`  Removed:      ${deleted.deletedCount} prior demo report(s)`);
  console.log(`  Password:     ${passwordReset ? "set/reset" : "unchanged (set RESET_DEMO_PASSWORD=true to reset)"}`);
  console.log("");
  console.log("  Login: demo@healthlens.ai / DemoHealth2026!");
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Demo seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore disconnect errors */
  }
  process.exit(1);
});
