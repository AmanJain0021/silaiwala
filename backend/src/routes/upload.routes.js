const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary.js");
const upload = require("../middlewares/upload.middleware.js");
const { protect } = require("../middlewares/auth.middleware.js");
const { uploadLimiter } = require("../middlewares/rateLimiter.middleware.js");

// Helper to determine the target folder
const getFolder = (req, defaultFolder) => {
  // Try to use the folder provided by the client in the formData
  return req.body.folder || defaultFolder;
};

// Multer error handler wrapper — catches file size/type errors before they crash the request
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: "File size exceeds the 5MB limit. Please compress your images and try again." 
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

    // Try Cloudinary if keys look real
    if (process.env.CLOUDINARY_API_KEY && !process.env.CLOUDINARY_API_KEY.includes('your_')) {
      try {
        const uploadPromises = files.map(file => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: folderName, resource_type: "auto" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });
        });
        
        const results = await Promise.all(uploadPromises);
        
        results.forEach(result => {
           if (result && result.secure_url) urls.push(result.secure_url);
        });
        
        // Return Cloudinary URLs if successful
        if (urls.length > 0) {
          return res.status(200).json({ 
             success: true, 
             data: isMultiple ? urls : urls[0] 
          });
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local:", cloudErr.message);
      }
    }

    // Local Fallback (using Base64 since we are in memory and Vercel disk is read-only)
    const localUrls = files.map(file => {
      const base64 = file.buffer.toString("base64");
      const mime = (!file.mimetype || file.mimetype === 'application/octet-stream') ? 'image/jpeg' : file.mimetype;
      return `data:${mime};base64,${base64}`;
    });
    
    res.status(200).json({
      success: true,
      data: isMultiple ? localUrls : localUrls[0],
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

