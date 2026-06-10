const test = require("node:test");
const assert = require("node:assert/strict");
const {
  medicationsHandler,
  diagnosesHandler,
  symptomsHandler,
  adviceHandler,
  timelineHandler,
  summaryHandler,
  overviewHandler,
  insightsHandler,
  doctorSummaryHandler,
} = require("../routes/repository");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const stubUserId = "507f1f77bcf86cd799439099";

const stubReports = [
  {
    _id: "r1",
    reportDate: new Date("2026-01-01"),
    documentType: "prescription",
    medications: [{ name: "Metformin" }],
    diagnoses: [{ condition: "Diabetes", status: "active" }],
    symptoms: [{ description: "Fatigue" }],
    doctorAdvice: ["Hydrate"],
    testsAdvised: ["HbA1c"],
  },
  {
    _id: "r2",
    reportDate: new Date("2026-06-01"),
    documentType: "lab_report",
    measurements: [{ name: "hemoglobin", value: 14 }],
  },
];

const req = { user: { id: stubUserId } };

test("medications handler returns deduped rollup", async () => {
  const res = createMockRes();
  await medicationsHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.medications[0].name, "Metformin");
});

test("diagnoses handler returns rollup", async () => {
  const res = createMockRes();
  await diagnosesHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.diagnoses[0].condition, "Diabetes");
});

test("symptoms handler returns rollup", async () => {
  const res = createMockRes();
  await symptomsHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.symptoms[0].description, "Fatigue");
});

test("advice handler returns rollup with advice and tests", async () => {
  const res = createMockRes();
  await adviceHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.advice.length, 2);
});

test("timeline handler returns chronological events", async () => {
  const res = createMockRes();
  await timelineHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.timeline.length, 2);
  assert.equal(res.body.timeline[0].id, "r2");
});

test("summary handler returns counts", async () => {
  const res = createMockRes();
  await summaryHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.summary.totalReports, 2);
  assert.equal(res.body.summary.medications, 1);
  assert.equal(res.body.summary.events, 2);
});

test("overview handler returns bundled rollups in one response", async () => {
  const res = createMockRes();
  await overviewHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.summary.totalReports, 2);
  assert.equal(res.body.medications[0].name, "Metformin");
  assert.equal(res.body.diagnoses[0].condition, "Diabetes");
  assert.equal(res.body.symptoms[0].description, "Fatigue");
  assert.equal(res.body.advice.length, 2);
});

test("handlers return 500 when fetch fails", async () => {
  const res = createMockRes();
  await medicationsHandler(req, res, {
    findReports: async () => {
      throw new Error("Database connection lost");
    },
  });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to fetch medication history/);
});

// Two lab reports so the insights handler passes the <2-lab short-circuit and
// actually invokes the (mocked) AI generator.
const insightsReports = [
  {
    _id: "lab1",
    documentType: "lab_report",
    reportDate: new Date("2026-03-20"),
    measurements: [{ name: "HbA1c", value: 6.8, unit: "%", status: "high", referenceRange: "4.0-5.6" }],
  },
  {
    _id: "lab2",
    documentType: "lab_report",
    reportDate: new Date("2026-06-05"),
    measurements: [{ name: "HbA1c", value: 6.2, unit: "%", status: "high", referenceRange: "4.0-5.6" }],
  },
];

const insightsUser = { _id: stubUserId, profile: { gender: "Female" } };

test("insights handler returns AI insights when generator succeeds", async () => {
  const res = createMockRes();
  const aiInsights = {
    summary: "AI summary",
    whatChanged: [],
    improvingSignals: ["HbA1c improving"],
    needsAttention: [],
    riskFlags: [],
    doctorQuestions: [],
    followUpSuggestions: [],
    disclaimer: "disclaimer",
    generatedBy: "ai",
  };

  await insightsHandler(req, res, {
    findReports: async () => insightsReports,
    findUserById: async () => insightsUser,
    generateInsights: async () => aiInsights,
    aiEnabled: true,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.insights.generatedBy, "ai");
  assert.equal(res.body.insights.summary, "AI summary");
  assert.ok(res.body.generatedAt);
});

test("insights handler falls back to deterministic when AI throws", async () => {
  const res = createMockRes();

  await insightsHandler(req, res, {
    findReports: async () => insightsReports,
    findUserById: async () => insightsUser,
    generateInsights: async () => {
      throw new Error("Gemini unavailable");
    },
    aiEnabled: true,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.insights.generatedBy, "deterministic");
});

test("insights handler skips AI when LONGITUDINAL_AI_ENABLED is off", async () => {
  const res = createMockRes();
  let aiCalled = false;

  await insightsHandler(req, res, {
    findReports: async () => insightsReports,
    findUserById: async () => insightsUser,
    generateInsights: async () => {
      aiCalled = true;
      return {};
    },
    aiEnabled: false,
  });

  assert.equal(aiCalled, false);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.insights.generatedBy, "deterministic");
});

test("insights handler skips AI when fewer than two lab reports", async () => {
  const res = createMockRes();
  let aiCalled = false;

  await insightsHandler(req, res, {
    findReports: async () => [insightsReports[0]],
    findUserById: async () => insightsUser,
    generateInsights: async () => {
      aiCalled = true;
      return {};
    },
    aiEnabled: true,
  });

  assert.equal(aiCalled, false);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.insights.generatedBy, "deterministic");
});

test("insights handler returns 404 when user is missing", async () => {
  const res = createMockRes();

  await insightsHandler(req, res, {
    findReports: async () => insightsReports,
    findUserById: async () => null,
    generateInsights: async () => ({}),
  });

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /User not found/);
});

test("insights handler returns 500 when report loading fails", async () => {
  const res = createMockRes();

  await insightsHandler(req, res, {
    findReports: async () => {
      throw new Error("Database connection lost");
    },
    findUserById: async () => insightsUser,
    generateInsights: async () => ({}),
  });

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to generate health insights/);
});

const doctorSummaryUser = {
  _id: stubUserId,
  name: "Priya Sharma",
  email: "demo@healthlens.ai",
  profile: { gender: "Female", chronicConditions: ["Type 2 Diabetes"] },
};

test("doctor summary handler returns the full summary contract", async () => {
  const res = createMockRes();

  await doctorSummaryHandler(req, res, {
    findReports: async () => stubReports,
    findUserById: async () => doctorSummaryUser,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.summary.patient.name, "Priya Sharma");
  assert.equal(res.body.summary.snapshot.totalReports, 2);
  assert.ok(Array.isArray(res.body.summary.medications));
  assert.ok(Array.isArray(res.body.summary.latestVitals));
  assert.ok(Array.isArray(res.body.summary.timelineHighlights));
  assert.ok(res.body.summary.disclaimer);
  assert.ok(res.body.summary.generatedAt);
  // Insight subset must not expose AI-vs-deterministic provenance.
  assert.equal("generatedBy" in res.body.summary.insights, false);
});

test("doctor summary handler returns 404 when user is missing", async () => {
  const res = createMockRes();

  await doctorSummaryHandler(req, res, {
    findReports: async () => stubReports,
    findUserById: async () => null,
  });

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /User not found/);
});

test("doctor summary handler returns 500 when report loading fails", async () => {
  const res = createMockRes();

  await doctorSummaryHandler(req, res, {
    findReports: async () => {
      throw new Error("Database connection lost");
    },
    findUserById: async () => doctorSummaryUser,
  });

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to generate doctor summary/);
});

test("doctor summary handler returns 200 with empty arrays for no reports", async () => {
  const res = createMockRes();

  await doctorSummaryHandler(req, res, {
    findReports: async () => [],
    findUserById: async () => doctorSummaryUser,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.summary.snapshot.totalReports, 0);
  assert.equal(res.body.summary.snapshot.latestReportDate, null);
  assert.deepEqual(res.body.summary.medications, []);
  assert.deepEqual(res.body.summary.latestVitals, []);
  assert.deepEqual(res.body.summary.abnormalMarkers, []);
});
