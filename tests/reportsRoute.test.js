const test = require("node:test");
const assert = require("node:assert/strict");
const {
  historyHandler,
  getByIdHandler,
  fileDownloadHandler,
  deleteByIdHandler,
} = require("../routes/reports");

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

const stubReports = [
  {
    _id: "507f1f77bcf86cd799439011",
    reportDate: new Date("2026-01-01"),
    measurements: [{ name: "hemoglobin", value: 14, status: "normal" }],
    toJSON() {
      return { ...this, vitalityScore: 100 };
    },
  },
  {
    _id: "507f1f77bcf86cd799439012",
    reportDate: new Date("2026-06-01"),
    measurements: [{ name: "hemoglobin", value: 8.6, status: "low" }],
    toJSON() {
      return { ...this, vitalityScore: 95 };
    },
  },
];

const stubUserId = "507f1f77bcf86cd799439011";

test("history handler returns success and reports array", async () => {
  const res = createMockRes();

  await historyHandler(
    { user: { id: stubUserId } },
    res,
    {
      findReports: async () => stubReports,
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.reports, stubReports);
});

test("history handler returns 500 when fetch fails", async () => {
  const res = createMockRes();

  await historyHandler(
    { user: { id: stubUserId } },
    res,
    {
      findReports: async () => {
        throw new Error("Database connection lost");
      },
    },
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to fetch report history/);
});

const ownedReportId = "507f1f77bcf86cd799439011";
const otherUserId = "507f1f77bcf86cd799439099";

const ownedReport = {
  _id: ownedReportId,
  userId: { toString: () => stubUserId },
  reportDate: new Date("2026-06-01"),
  reportType: "CBC",
  measurements: [{ name: "hemoglobin", value: 14, status: "normal" }],
  aiInterpretation: { summary: "All normal", findings: [], recommendations: [] },
};

test("getById handler returns success and report for owner", async () => {
  const res = createMockRes();

  await getByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    { findById: async () => ownedReport },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.report, ownedReport);
});

test("getById handler returns 403 when userId does not match", async () => {
  const res = createMockRes();

  await getByIdHandler(
    { params: { id: ownedReportId }, user: { id: otherUserId } },
    res,
    { findById: async () => ownedReport },
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Forbidden.");
});

test("getById handler returns 400 for malformed report id", async () => {
  const res = createMockRes();

  await getByIdHandler(
    { params: { id: "notavalidid123" }, user: { id: stubUserId } },
    res,
    {
      findById: async () => {
        throw new Error("findById should not be called");
      },
    },
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Invalid report id.");
});

test("getById handler returns 404 when report not found", async () => {
  const res = createMockRes();

  await getByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    { findById: async () => null },
  );

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Report not found/);
});

const reportWithStoredFile = {
  ...ownedReport,
  provenance: {
    cloudinaryPublicId: "healthlens/users/u1/report.pdf",
    cloudinaryResourceType: "raw",
    originalFilename: "cbc-report.pdf",
    mimeType: "application/pdf",
  },
};

test("fileDownloadHandler returns signed URL for owner with stored file", async () => {
  const res = createMockRes();

  await fileDownloadHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    {
      findById: async () => reportWithStoredFile,
      isCloudinaryEnabled: () => true,
      getSignedDownloadUrl: () => "https://signed.example/cbc-report.pdf",
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.downloadUrl, "https://signed.example/cbc-report.pdf");
  assert.equal(res.body.filename, "cbc-report.pdf");
  assert.equal(res.body.mimeType, "application/pdf");
  assert.equal(res.body.expiresInSeconds, 300);
});

test("fileDownloadHandler returns 404 when no stored file", async () => {
  const res = createMockRes();

  await fileDownloadHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    { findById: async () => ownedReport },
  );

  assert.equal(res.statusCode, 404);
  assert.match(res.body.message, /No stored file/);
});

test("fileDownloadHandler returns 403 for non-owner", async () => {
  const res = createMockRes();

  await fileDownloadHandler(
    { params: { id: ownedReportId }, user: { id: otherUserId } },
    res,
    { findById: async () => reportWithStoredFile },
  );

  assert.equal(res.statusCode, 403);
});

test("fileDownloadHandler returns 400 for malformed report id", async () => {
  const res = createMockRes();

  await fileDownloadHandler(
    { params: { id: "notavalidid123" }, user: { id: stubUserId } },
    res,
    {
      findById: async () => {
        throw new Error("findById should not be called");
      },
    },
  );

  assert.equal(res.statusCode, 400);
});

test("deleteById handler deletes owned report", async () => {
  const res = createMockRes();
  let deletedId = null;

  await deleteByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    {
      findById: async () => ownedReport,
      deleteById: async (id) => {
        deletedId = id;
      },
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.reportId, ownedReportId);
  assert.equal(deletedId, ownedReportId);
});

test("deleteById handler removes Cloudinary asset when present", async () => {
  const res = createMockRes();
  let deletedId = null;
  let removedPublicId = null;

  await deleteByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    {
      findById: async () => reportWithStoredFile,
      deleteById: async (id) => {
        deletedId = id;
      },
      isCloudinaryEnabled: () => true,
      deleteReportFile: async (publicId) => {
        removedPublicId = publicId;
        return { result: "ok" };
      },
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(deletedId, ownedReportId);
  assert.equal(removedPublicId, "healthlens/users/u1/report.pdf");
});

test("deleteById handler returns 403 for non-owner", async () => {
  const res = createMockRes();

  await deleteByIdHandler(
    { params: { id: ownedReportId }, user: { id: otherUserId } },
    res,
    { findById: async () => ownedReport },
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Forbidden.");
});

test("deleteById handler returns 400 for malformed report id", async () => {
  const res = createMockRes();

  await deleteByIdHandler(
    { params: { id: "notavalidid123" }, user: { id: stubUserId } },
    res,
    {
      findById: async () => {
        throw new Error("findById should not be called");
      },
    },
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid report id.");
});

test("deleteById handler returns 404 when report missing", async () => {
  const res = createMockRes();

  await deleteByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    { findById: async () => null },
  );

  assert.equal(res.statusCode, 404);
});

test("getById handler returns 500 when fetch fails", async () => {
  const res = createMockRes();

  await getByIdHandler(
    { params: { id: ownedReportId }, user: { id: stubUserId } },
    res,
    {
      findById: async () => {
        throw new Error("Database connection lost");
      },
    },
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to fetch report/);
});
