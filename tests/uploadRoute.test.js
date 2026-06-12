const test = require("node:test");
const assert = require("node:assert/strict");
const { handleUpload } = require("../routes/upload");

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

function createStubExtraction() {
  return {
    methodUsed: "pdf-parse",
    documentType: "lab_report",
    cleanedText: "Haemoglobin 8.6",
    cleanedTextFull: "Haemoglobin 8.6",
    cleanedTextClinical: "Haemoglobin 8.6",
    structured: {
      reportType: "CBC",
      measurements: [],
      medications: [],
      diagnoses: [],
      flags: [],
      provenance: {},
    },
  };
}

test("handleUpload runs extraction and Cloudinary concurrently", async () => {
  const res = createMockRes();
  const order = [];

  await handleUpload(
    {
      file: {
        path: "/tmp/report.pdf",
        originalname: "report.pdf",
        mimetype: "application/pdf",
      },
      user: { id: stubUserId },
      body: { documentType: "auto" },
    },
    res,
    () => {},
    {
      isCloudinaryEnabled: () => true,
      extractMedicalReportText: () =>
        new Promise((resolve) => {
          order.push("extraction-start");
          setTimeout(() => {
            order.push("extraction-end");
            resolve(createStubExtraction());
          }, 30);
        }),
      uploadReportFile: () =>
        new Promise((resolve) => {
          order.push("cloudinary-start");
          setTimeout(() => {
            order.push("cloudinary-end");
            resolve({
              cloudinaryPublicId: "healthlens/users/u1/report.pdf",
              cloudinaryResourceType: "raw",
            });
          }, 10);
        }),
      cleanupFile: async () => {},
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(
    res.body.structured.provenance.cloudinaryPublicId,
    "healthlens/users/u1/report.pdf",
  );
  assert.equal(order.indexOf("cloudinary-start") < order.indexOf("extraction-end"), true);
  assert.equal(order.includes("extraction-start"), true);
  assert.equal(order.includes("cloudinary-start"), true);
});

test("handleUpload returns 503 when Cloudinary fails after extraction succeeds", async () => {
  const res = createMockRes();

  await handleUpload(
    {
      file: {
        path: "/tmp/report.pdf",
        originalname: "report.pdf",
        mimetype: "application/pdf",
      },
      user: { id: stubUserId },
      body: {},
    },
    res,
    () => {},
    {
      isCloudinaryEnabled: () => true,
      extractMedicalReportText: async () => createStubExtraction(),
      uploadReportFile: async () => {
        throw new Error("Cloudinary unavailable");
      },
      cleanupFile: async () => {},
    },
  );

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /file storage is temporarily unavailable/i);
});

test("handleUpload skips Cloudinary when storage is disabled", async () => {
  const res = createMockRes();
  let cloudinaryCalled = false;

  await handleUpload(
    {
      file: {
        path: "/tmp/report.pdf",
        originalname: "report.pdf",
        mimetype: "application/pdf",
      },
      user: { id: stubUserId },
      body: {},
    },
    res,
    () => {},
    {
      isCloudinaryEnabled: () => false,
      extractMedicalReportText: async () => createStubExtraction(),
      uploadReportFile: async () => {
        cloudinaryCalled = true;
        return {};
      },
      cleanupFile: async () => {},
    },
  );

  assert.equal(cloudinaryCalled, false);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.structured.provenance.cloudinaryPublicId, undefined);
});
