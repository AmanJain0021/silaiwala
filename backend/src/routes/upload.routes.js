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
  const host = req.headers["x-forwarded-host"] || req.get("host") || "";
  if (process.env.NODE_ENV === "production" || host.includes("sewzella.com")) {
    return `https://sewzella.com/api/v1/uploads/${filename}`;
  }
  const protoHeader = req.headers["x-forwarded-proto"];
  const protocol = protoHeader ? protoHeader.split(",")[0].trim() : req.protocol;
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

// ---------------- CHUNKED UPLOAD ROUTES (For large videos & files) ---------------- //

const CHUNKS_DIR = path.join(UPLOAD_DIR, "chunks");
if (!fs.existsSync(CHUNKS_DIR)) {
  try {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create chunks directory:", err);
  }
}

// Handler for single chunk
const handleChunkUpload = async (req, res) => {
  try {
    const safeUploadId = (req.body.uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeUploadId) {
      return res.status(400).json({ success: false, message: "Valid uploadId is required" });
    }

    const chunkIndex = parseInt(req.body.chunkIndex, 10);
    if (isNaN(chunkIndex)) {
      return res.status(400).json({ success: false, message: "Valid chunkIndex is required" });
    }

    const chunkFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    if (!chunkFile || !chunkFile.buffer) {
      return res.status(400).json({ success: false, message: "No chunk file data received" });
    }

    const targetChunkDir = path.join(CHUNKS_DIR, safeUploadId);
    if (!fs.existsSync(targetChunkDir)) {
      fs.mkdirSync(targetChunkDir, { recursive: true });
    }

    const chunkFilePath = path.join(targetChunkDir, `chunk-${chunkIndex}`);
    await fs.promises.writeFile(chunkFilePath, chunkFile.buffer);

    return res.status(200).json({
      success: true,
      message: `Chunk ${chunkIndex} uploaded successfully`,
      chunkIndex,
    });
  } catch (err) {
    console.error("Error in chunk upload:", err);
    return res.status(500).json({ success: false, message: "Chunk upload failed: " + err.message });
  }
};

// Handler for merging chunks after upload completes
const handleChunkComplete = async (req, res) => {
  try {
    const safeUploadId = (req.body.uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const totalChunks = parseInt(req.body.totalChunks, 10);
    const rawFileName = req.body.fileName || "video.mp4";

    if (!safeUploadId || isNaN(totalChunks) || totalChunks <= 0) {
      return res.status(400).json({ success: false, message: "Valid uploadId and totalChunks are required" });
    }

    const targetChunkDir = path.join(CHUNKS_DIR, safeUploadId);
    if (!fs.existsSync(targetChunkDir)) {
      return res.status(404).json({ success: false, message: "Upload session chunks not found or expired" });
    }

    // 1. Verify all chunk files 0 .. totalChunks - 1 exist
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(targetChunkDir, `chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({
          success: false,
          message: `Chunk ${i} is missing. Please retry uploading chunk ${i}.`,
        });
      }
    }

    // 2. Prepare final file destination
    let ext = path.extname(rawFileName).toLowerCase();
    if (!ext) ext = ".mp4";
    const isVideo = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".wmv", ".m4v"].includes(ext);
    const prefix = isVideo ? "video" : "file";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const finalFileName = `${prefix}-${uniqueSuffix}${ext}`;
    const finalFilePath = path.join(UPLOAD_DIR, finalFileName);

    // 3. Stream-merge chunks sequentially to keep RAM minimal
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(targetChunkDir, `chunk-${i}`);
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.pipe(writeStream, { end: false });
        readStream.on("end", resolve);
        readStream.on("error", reject);
      });
    }

    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // 4. Clean up temporary chunks folder in background
    try {
      if (fs.promises.rm) {
        await fs.promises.rm(targetChunkDir, { recursive: true, force: true });
      } else {
        fs.rmdirSync(targetChunkDir, { recursive: true });
      }
    } catch (cleanupErr) {
      console.warn("Non-fatal: failed to clean up chunk dir:", cleanupErr.message);
    }

    // 5. Generate public file URL
    const fileUrl = getPublicFileUrl(req, finalFileName);

    return res.status(200).json({
      success: true,
      message: "File chunks merged successfully",
      data: fileUrl,
    });
  } catch (err) {
    console.error("Error in chunk complete:", err);
    return res.status(500).json({ success: false, message: "Failed to merge chunks: " + err.message });
  }
};

// Chunk routes (Both public and protected paths supported)
router.post("/chunk", uploadLimiter, upload.any(), handleMulterError, handleChunkUpload);
router.post("/public/chunk", uploadLimiter, upload.any(), handleMulterError, handleChunkUpload);
router.post("/chunk/complete", uploadLimiter, handleChunkComplete);
router.post("/public/chunk/complete", uploadLimiter, handleChunkComplete);

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



