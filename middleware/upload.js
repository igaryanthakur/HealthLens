const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(process.cwd(), "uploads");
const maxSizeMB = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${baseName}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const isValid = allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension);

  if (!isValid) {
    return cb(new Error("Unsupported file type. Allowed: PDF, JPG, JPEG, PNG."));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeMB * 1024 * 1024,
  },
});

module.exports = upload;
