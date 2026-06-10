const test = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeFilename,
  buildPublicId,
  uploadReportFile,
  getSignedDownloadUrl,
  deleteReportFile,
  SIGNED_URL_TTL_SECONDS,
} = require("../services/cloudinaryService");

test("sanitizeFilename strips unsafe characters", () => {
  assert.equal(sanitizeFilename("lab report (1).pdf"), "lab_report__1_.pdf");
  assert.equal(sanitizeFilename(""), "report");
});

test("buildPublicId scopes uploads under user folder", () => {
  const publicId = buildPublicId("user123", "cbc-report.pdf");
  assert.match(publicId, /^healthlens\/users\/user123\/\d+_cbc-report\.pdf$/);
});

test("uploadReportFile returns storage metadata", async () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  const mockUpload = async () => ({
    public_id: "healthlens/users/u1/123_report.pdf",
    resource_type: "raw",
    bytes: 2048,
    format: "pdf",
  });

  try {
    const result = await uploadReportFile(
      "/tmp/report.pdf",
      {
        userId: "u1",
        originalFilename: "report.pdf",
        mimeType: "application/pdf",
      },
      {
        cloudinary: {
          uploader: { upload: mockUpload },
        },
      },
    );

    assert.equal(result.cloudinaryPublicId, "healthlens/users/u1/123_report.pdf");
    assert.equal(result.cloudinaryResourceType, "raw");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.bytes, 2048);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("getSignedDownloadUrl uses private download for raw assets", () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  let calledWith = null;
  const mockClient = {
    utils: {
      private_download_url: (publicId, format, options) => {
        calledWith = { publicId, format, options };
        return "https://signed.example/report.pdf";
      },
    },
    url: () => "https://signed.example/image.jpg",
  };

  try {
    const url = getSignedDownloadUrl(
      "healthlens/users/u1/report",
      "raw",
      { attachmentFilename: "report.pdf" },
      { cloudinary: mockClient },
    );

    assert.equal(url, "https://signed.example/report.pdf");
    assert.equal(calledWith.publicId, "healthlens/users/u1/report");
    assert.equal(calledWith.format, "pdf");
    assert.equal(calledWith.options.type, "authenticated");
    assert.ok(calledWith.options.expires_at > Math.floor(Date.now() / 1000));
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("getSignedDownloadUrl signs image assets", () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  let calledWith = null;
  const mockClient = {
    utils: { private_download_url: () => "unused" },
    url: (publicId, options) => {
      calledWith = { publicId, options };
      return "https://signed.example/image.jpg";
    },
  };

  try {
    const url = getSignedDownloadUrl(
      "healthlens/users/u1/scan",
      "image",
      { attachmentFilename: "scan.jpg" },
      { cloudinary: mockClient },
    );

    assert.equal(url, "https://signed.example/image.jpg");
    assert.equal(calledWith.publicId, "healthlens/users/u1/scan");
    assert.equal(calledWith.options.type, "authenticated");
    assert.equal(calledWith.options.sign_url, true);
    assert.match(calledWith.options.flags, /attachment:scan\.jpg/);
    assert.equal(SIGNED_URL_TTL_SECONDS, 300);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("deleteReportFile destroys authenticated asset", async () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  let destroyArgs = null;
  const mockClient = {
    uploader: {
      destroy: async (publicId, options) => {
        destroyArgs = { publicId, options };
        return { result: "ok" };
      },
    },
  };

  try {
    const result = await deleteReportFile(
      "healthlens/users/u1/report",
      "raw",
      { cloudinary: mockClient },
    );

    assert.equal(result.result, "ok");
    assert.equal(destroyArgs.publicId, "healthlens/users/u1/report");
    assert.equal(destroyArgs.options.resource_type, "raw");
    assert.equal(destroyArgs.options.type, "authenticated");
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});
