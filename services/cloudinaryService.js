const path = require("path");
const {
  cloudinary,
  isCloudinaryEnabled,
  configureCloudinary,
} = require("../config/cloudinary");

const SIGNED_URL_TTL_SECONDS = 300;

function sanitizeFilename(filename) {
  const base = path.basename(filename || "report");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "report";
}

function buildPublicId(userId, originalFilename) {
  const safeName = sanitizeFilename(originalFilename);
  const stamp = Date.now();
  return `healthlens/users/${userId}/${stamp}_${safeName}`;
}

function normalizeResourceType(resourceType) {
  return resourceType === "raw" ? "raw" : "image";
}

function getCloudinaryClient(deps = {}) {
  if (deps.cloudinary) {
    return deps.cloudinary;
  }

  configureCloudinary();
  return cloudinary;
}

async function uploadReportFile(filePath, { userId, originalFilename, mimeType }, deps = {}) {
  if (!isCloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured.");
  }

  const client = getCloudinaryClient(deps);
  const publicId = buildPublicId(userId, originalFilename);

  const result = await client.uploader.upload(filePath, {
    public_id: publicId,
    access_mode: "authenticated",
    resource_type: "auto",
    use_filename: false,
    unique_filename: false,
    overwrite: false,
  });

  return {
    cloudinaryPublicId: result.public_id,
    cloudinaryResourceType: normalizeResourceType(result.resource_type),
    mimeType: mimeType || (result.format ? `application/${result.format}` : undefined),
    bytes: result.bytes,
  };
}

function getSignedDownloadUrl(
  publicId,
  resourceType,
  { attachmentFilename } = {},
  deps = {},
) {
  if (!isCloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured.");
  }

  const client = getCloudinaryClient(deps);
  const normalizedType = normalizeResourceType(resourceType);
  const safeFilename = sanitizeFilename(attachmentFilename);

  if (normalizedType === "raw") {
    return client.utils.private_download_url(publicId, "pdf", {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
      attachment: safeFilename,
    });
  }

  return client.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    flags: `attachment:${safeFilename}`,
  });
}

async function deleteReportFile(publicId, resourceType, deps = {}) {
  if (!isCloudinaryEnabled() || !publicId) {
    return { result: "skipped" };
  }

  const client = getCloudinaryClient(deps);
  const normalizedType = normalizeResourceType(resourceType);

  return client.uploader.destroy(publicId, {
    resource_type: normalizedType,
    type: "authenticated",
  });
}

module.exports = {
  SIGNED_URL_TTL_SECONDS,
  sanitizeFilename,
  buildPublicId,
  uploadReportFile,
  getSignedDownloadUrl,
  deleteReportFile,
  isCloudinaryEnabled,
};
