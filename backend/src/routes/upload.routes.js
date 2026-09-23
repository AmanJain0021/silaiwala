const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary.js");
const upload = require("../middlewares/upload.middleware.js");
const { protect } = require("../middlewares/auth.middleware.js");
const { uploadLimiter } = require("../middlewares/rateLimiter.middleware.js");

const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }
}

// Helper to determine the target folder
const getFolder = (req, defaultFolder) => {
  return req.body.folder || defaultFolder;
};

// Check if a file is a video
const isVideoFile = (file) => {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();
  return (
    mime.startsWith("video/") ||
    [".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".wmv", ".m4v"].includes(ext)
  );
};

// Generate public URL for a file stored in /uploads
const getPublicFileUrl = (req, filename) => {
  const protoHeader = req.headers["x-forwarded-proto"];
  const protocol = protoHeader ? protoHeader.split(",")[0].trim() : req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}/uploads/${filename}`;
};

// Save buffer to backend/uploads
const saveFileToDisk = async (file, req) => {
  const isVideo = isVideoFile(file);
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  let ext = path.extname(file.originalname || "").toLowerCase();
  if (!ext) {
    if (file.mimetype?.includes("mp4")) ext = ".mp4";
    else if (file.mimetype?.includes("webm")) ext = ".webm";
    else if (file.mimetype?.includes("quicktime")) ext = ".mov";
    else if (isVideo) ext = ".mp4";
    else if (file.mimetype?.includes("png")) ext = ".png";
    else ext = ".jpg";
  }

  const prefix = isVideo ? "video" : "file";
  const filename = `${prefix}-${uniqueSuffix}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);
  return getPublicFileUrl(req, filename);
};

// Multer error handler wrapper — catches file size/type errors before they crash the request
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: "File size exceeds the 500MB limit. Please upload a smaller file or compress it." 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        message: "Unexpected file field. Please try again." 
      });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    // Custom error from fileFilter (invalid file format)
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

const processUpload = async (req, res, isMultiple) => {
  console.log("=== UPLOAD DEBUG ===");
  console.log("Headers:", req.headers['content-type']);
  console.log("Files:", req.files?.length || 0, "files received");
  console.log("Body folder:", req.body?.folder);
  console.log("====================");

  try {
    const files = isMultiple ? req.files : (req.file ? [req.file] : (req.files && req.files.length > 0 ? [req.files[0]] : null));
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one file" });
    }

    const folderName = getFolder(req, "tailor_platform");
    const urls = [];

    for (const file of files) {
      const isVideo = isVideoFile(file) || folderName === "videos";

      // 1. VIDEOS: Save directly to backend/uploads folder so they stream smoothly without 3rd-party limits
      if (isVideo) {
        try {
          const videoUrl = await saveFileToDisk(file, req);
          urls.push(videoUrl);
          continue;
        } catch (diskErr) {
          console.error("Local video disk save error:", diskErr);
        }
      }

      // 2. IMAGES / DOCUMENTS: Try Cloudinary if keys are valid
      let uploadedToCloudinary = false;
      if (process.env.CLOUDINARY_API_KEY && !process.env.CLOUDINARY_API_KEY.includes('your_')) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: folderName, resource_type: "auto" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          if (result && result.secure_url) {
            urls.push(result.secure_url);
            uploadedToCloudinary = true;
          }
        } catch (cloudErr) {
          console.warn("Cloudinary upload failed, falling back to local uploads folder:", cloudErr.message);
        }
      }

      // 3. Fallback: Save directly to backend/uploads folder
      if (!uploadedToCloudinary) {
        try {
          const localUrl = await saveFileToDisk(file, req);
          urls.push(localUrl);
        } catch (diskErr) {
          console.warn("Local disk write failed, fallback to base64:", diskErr.message);
          const base64 = file.buffer.toString("base64");
          const mime = (!file.mimetype || file.mimetype === 'application/octet-stream') ? 'image/jpeg' : file.mimetype;
          urls.push(`data:${mime};base64,${base64}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: isMultiple ? urls : urls[0],
    });
    
  } catch (error) {
    console.error("Critical Upload Error:", error);
    res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
};

// ---------------- PROTECTED ROUTES ---------------- //

// Single upload (Protected)
router.post("/", uploadLimiter, protect, upload.any(), handleMulterError, (req, res) => {
  if (req.files && req.files.length > 0) req.file = req.files[0];
  return processUpload(req, res, false);
});

// Bulk upload (Protected)
router.post("/bulk", uploadLimiter, protect, upload.any(), handleMulterError, (req, res) => {
  return processUpload(req, res, true);
});

// ---------------- PUBLIC ROUTES ---------------- //

// Single upload (Public - useful for registration)
router.post("/public", uploadLimiter, upload.any(), handleMulterError, (req, res) => {
  if (req.files && req.files.length > 0) req.file = req.files[0];
  return processUpload(req, res, false);
});

// Bulk upload (Public - useful for bulk registration docs)
router.post("/public/bulk", uploadLimiter, upload.any(), handleMulterError, (req, res) => {
  return processUpload(req, res, true);
});

module.exports = router;

