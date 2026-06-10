const path = require("path");
const {
  cloudinary,
  isCloudinaryEnabled,
  configureCloudinary,
} = require("../config/cloudinary");

const SIGNED_URL_TTL_SECONDS = 300;
const DELIVERY_TYPES = ["upload", "authenticated", "private"];

function sanitizeFilename(filename) {
  const base = path.basename(filename || "report");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "report";
}

function detectUploadResourceType(mimeType, originalFilename) {
  const mime = String(mimeType || "").toLowerCase();
  const ext = path.extname(originalFilename || "").toLowerCase();

  if (mime === "application/pdf" || ext === ".pdf") {
    return "raw";
  }

  return "image";
}

function buildPublicId(userId, originalFilename, resourceType = "image") {
  const safeName = sanitizeFilename(originalFilename);
  const stamp = Date.now();
  const nameWithoutExt = path.basename(safeName, path.extname(safeName)) || "report";
  const ext = path.extname(safeName);
  const base = `healthlens/users/${userId}/${stamp}_${nameWithoutExt}`;

  // Raw assets keep the extension in public_id; image/video IDs must not.
  if (resourceType === "raw" && ext) {
    return `${base}${ext}`;
  }

  return base;
}

function normalizeResourceType(resourceType) {
  return resourceType === "raw" ? "raw" : "image";
}

function normalizeDeliveryType(deliveryType) {
  return DELIVERY_TYPES.includes(deliveryType) ? deliveryType : "upload";
}

function normalizeFormat(format) {
  if (!format) return null;
  if (format === "jpeg") return "jpg";
  return format;
}

function guessFormat({ mimeType, originalFilename, publicId } = {}) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) {
    return normalizeFormat(mime.slice("image/".length));
  }

  const fromName = normalizeFormat(
    path.extname(originalFilename || "").replace(/^\./, "").toLowerCase(),
  );
  if (fromName) return fromName;

  const lastDot = publicId?.lastIndexOf(".") ?? -1;
  const lastSlash = publicId?.lastIndexOf("/") ?? -1;
  if (lastDot > lastSlash) {
    return normalizeFormat(publicId.slice(lastDot + 1).toLowerCase());
  }

  return null;
}

function deliveryTypeCandidates(deliveryType) {
  const preferred = normalizeDeliveryType(deliveryType);
  return [...new Set([preferred, "upload", "authenticated", "private"])];
}

function resourceTypeCandidates(resourceType) {
  const preferred = normalizeResourceType(resourceType);
  return [...new Set([preferred, preferred === "raw" ? "image" : "raw"])];
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
  const uploadResourceType = detectUploadResourceType(mimeType, originalFilename);
  const publicId = buildPublicId(userId, originalFilename, uploadResourceType);

  const result = await client.uploader.upload(filePath, {
    public_id: publicId,
    type: "authenticated",
    resource_type: uploadResourceType,
    use_filename: false,
    unique_filename: false,
    overwrite: false,
  });

  return {
    cloudinaryPublicId: result.public_id,
    cloudinaryResourceType: normalizeResourceType(result.resource_type),
    cloudinaryDeliveryType: normalizeDeliveryType(result.type),
    mimeType: mimeType || (result.format ? `application/${result.format}` : undefined),
    bytes: result.bytes,
  };
}

function buildSignedDownloadUrl(
  publicId,
  resourceType,
  deliveryType,
  {
    attachmentFilename,
    mimeType,
    originalFilename,
  },
  deps = {},
) {
  const client = getCloudinaryClient(deps);
  const safeFilename = sanitizeFilename(attachmentFilename);
  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const format = guessFormat({ mimeType, originalFilename, publicId }) || "pdf";

  return client.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: deliveryType,
    expires_at: expiresAt,
    attachment: safeFilename,
  });
}

function getSignedDownloadUrl(
  publicId,
  resourceType,
  {
    attachmentFilename,
    mimeType,
    originalFilename,
    deliveryType = "upload",
  } = {},
  deps = {},
) {
  if (!isCloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured.");
  }

  const preferredDeliveryType = normalizeDeliveryType(deliveryType);
  const preferredResourceType = normalizeResourceType(resourceType);

  return buildSignedDownloadUrl(
    publicId,
    preferredResourceType,
    preferredDeliveryType,
    { attachmentFilename, mimeType, originalFilename },
    deps,
  );
}

async function resolveSignedDownloadUrl(
  publicId,
  resourceType,
  options = {},
  deps = {},
) {
  if (!isCloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured.");
  }

  const verifyUrl =
    deps.verifyDownloadUrl ??
    (async (url) => {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    });

  const deliveryTypes = deliveryTypeCandidates(options.deliveryType);
  const resourceTypes = resourceTypeCandidates(resourceType);
  const seen = new Set();
  let fallbackUrl = null;

  for (const deliveryType of deliveryTypes) {
    for (const rt of resourceTypes) {
      const key = `${deliveryType}:${rt}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const url = buildSignedDownloadUrl(publicId, rt, deliveryType, options, deps);
      fallbackUrl = fallbackUrl || url;

      if (await verifyUrl(url)) {
        return url;
      }
    }
  }

  if (fallbackUrl) {
    return fallbackUrl;
  }

  throw new Error("Failed to generate download link.");
}

async function destroyStoredAsset(client, publicId, resourceType, deliveryType) {
  return client.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
  });
}

async function deleteReportFile(
  publicId,
  resourceType,
  { mimeType, originalFilename, deliveryType = "upload" } = {},
  deps = {},
) {
  if (!isCloudinaryEnabled() || !publicId) {
    return { result: "skipped" };
  }

  const client = getCloudinaryClient(deps);
  const seen = new Set();
  let lastResult = { result: "not found" };

  for (const type of deliveryTypeCandidates(deliveryType)) {
    for (const rt of resourceTypeCandidates(resourceType)) {
      const key = `${type}:${rt}:${publicId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      lastResult = await destroyStoredAsset(client, publicId, rt, type);

      if (lastResult.result === "ok") {
        return lastResult;
      }
    }
  }

  if (lastResult.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${lastResult.result}`);
  }

  return lastResult;
}

module.exports = {
  SIGNED_URL_TTL_SECONDS,
  DELIVERY_TYPES,
  sanitizeFilename,
  buildPublicId,
  detectUploadResourceType,
  normalizeDeliveryType,
  deliveryTypeCandidates,
  uploadReportFile,
  buildSignedDownloadUrl,
  getSignedDownloadUrl,
  resolveSignedDownloadUrl,
  deleteReportFile,
  isCloudinaryEnabled,
};
