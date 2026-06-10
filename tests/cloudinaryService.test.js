const test = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeFilename,
  buildPublicId,
  detectUploadResourceType,
  normalizeDeliveryType,
  deliveryTypeCandidates,
  uploadReportFile,
  getSignedDownloadUrl,
  deleteReportFile,
  resolveSignedDownloadUrl,
  SIGNED_URL_TTL_SECONDS,
} = require("../services/cloudinaryService");

test("sanitizeFilename strips unsafe characters", () => {
  assert.equal(sanitizeFilename("lab report (1).pdf"), "lab_report__1_.pdf");
  assert.equal(sanitizeFilename(""), "report");
});

test("detectUploadResourceType uses raw for PDFs", () => {
  assert.equal(
    detectUploadResourceType("application/pdf", "cbc-report.pdf"),
    "raw",
  );
  assert.equal(detectUploadResourceType("image/jpeg", "scan.jpg"), "image");
});

test("buildPublicId scopes uploads under user folder", () => {
  const rawId = buildPublicId("user123", "cbc-report.pdf", "raw");
  assert.match(rawId, /^healthlens\/users\/user123\/\d+_cbc-report\.pdf$/);

  const imageId = buildPublicId("user123", "scan.jpg", "image");
  assert.match(imageId, /^healthlens\/users\/user123\/\d+_scan$/);
  assert.doesNotMatch(imageId, /\.jpg$/);
});

test("normalizeDeliveryType defaults unknown values to upload", () => {
  assert.equal(normalizeDeliveryType("authenticated"), "authenticated");
  assert.equal(normalizeDeliveryType("missing"), "upload");
});

test("deliveryTypeCandidates prefers stored type then upload", () => {
  assert.deepEqual(deliveryTypeCandidates("authenticated"), [
    "authenticated",
    "upload",
    "private",
  ]);
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

  let uploadOptions = null;
  const mockUpload = async (filePath, options) => {
    uploadOptions = options;
    return {
      public_id: "healthlens/users/u1/123_report.pdf",
      resource_type: "raw",
      type: "authenticated",
      bytes: 2048,
      format: "pdf",
    };
  };

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
    assert.equal(result.cloudinaryDeliveryType, "authenticated");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.bytes, 2048);
    assert.equal(uploadOptions.type, "authenticated");
    assert.equal(uploadOptions.resource_type, "raw");
    assert.match(uploadOptions.public_id, /^healthlens\/users\/u1\/\d+_report\.pdf$/);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("getSignedDownloadUrl uses stored public id and delivery type", () => {
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
  };

  try {
    const url = getSignedDownloadUrl(
      "healthlens/users/u1/report.pdf",
      "raw",
      {
        attachmentFilename: "report.pdf",
        mimeType: "application/pdf",
        originalFilename: "report.pdf",
        deliveryType: "upload",
      },
      { cloudinary: mockClient },
    );

    assert.equal(url, "https://signed.example/report.pdf");
    assert.equal(calledWith.publicId, "healthlens/users/u1/report.pdf");
    assert.equal(calledWith.format, "pdf");
    assert.equal(calledWith.options.type, "upload");
    assert.equal(calledWith.options.resource_type, "raw");
    assert.ok(calledWith.options.expires_at > Math.floor(Date.now() / 1000));
    assert.equal(calledWith.options.attachment, "report.pdf");
    assert.equal(SIGNED_URL_TTL_SECONDS, 300);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("deleteReportFile destroys stored asset", async () => {
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
      "healthlens/users/u1/report.pdf",
      "raw",
      {
        mimeType: "application/pdf",
        originalFilename: "report.pdf",
        deliveryType: "upload",
      },
      { cloudinary: mockClient },
    );

    assert.equal(result.result, "ok");
    assert.equal(destroyArgs.publicId, "healthlens/users/u1/report.pdf");
    assert.equal(destroyArgs.options.resource_type, "raw");
    assert.equal(destroyArgs.options.type, "upload");
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("resolveSignedDownloadUrl picks first reachable delivery variant", async () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  const mockClient = {
    utils: {
      private_download_url: (publicId, format, options) =>
        `https://signed.example/${options.type}/${options.resource_type}/${publicId}.${format}`,
    },
  };

  try {
    const url = await resolveSignedDownloadUrl(
      "healthlens/users/u1/report.pdf",
      "raw",
      {
        attachmentFilename: "report.pdf",
        mimeType: "application/pdf",
        deliveryType: "authenticated",
      },
      {
        cloudinary: mockClient,
        verifyDownloadUrl: async (candidate) =>
          candidate.includes("/upload/image/"),
      },
    );

    assert.equal(
      url,
      "https://signed.example/upload/image/healthlens/users/u1/report.pdf.pdf",
    );
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});

test("deleteReportFile retries alternate delivery and resource types", async () => {
  const originalEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";

  const attempts = [];
  const mockClient = {
    uploader: {
      destroy: async (publicId, options) => {
        attempts.push({ publicId, options });
        if (options.type === "upload" && options.resource_type === "image") {
          return { result: "ok" };
        }
        return { result: "not found" };
      },
    },
  };

  try {
    const result = await deleteReportFile(
      "healthlens/users/u1/report.pdf",
      "raw",
      {
        mimeType: "application/pdf",
        originalFilename: "report.pdf",
        deliveryType: "authenticated",
      },
      { cloudinary: mockClient },
    );

    assert.equal(result.result, "ok");
    assert.ok(attempts.length >= 2);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
  }
});
