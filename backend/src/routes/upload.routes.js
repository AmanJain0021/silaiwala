const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/upload.middleware");
const { protect } = require("../middlewares/auth.middleware");

// Helper to determine the target folder
const getFolder = (req, defaultFolder) => {
  // Try to use the folder provided by the client in the formData
  return req.body.folder || defaultFolder;
};

// Helper function to handle the actual upload logic
const processUpload = async (req, res, isMultiple) => {
  try {
    const files = isMultiple ? req.files : (req.file ? [req.file] : null);
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one file" });
    }

    const folderName = getFolder(req, "tailor_platform");
    const urls = [];

    // Try Cloudinary if keys look real
    if (process.env.CLOUDINARY_API_KEY && !process.env.CLOUDINARY_API_KEY.includes('your_')) {
      try {
        const uploadPromises = files.map(file => 
           cloudinary.uploader.upload(file.path, { folder: folderName })
        );
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

    // Local Fallback
    const localUrls = files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
    
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
router.post("/", protect, upload.single("image"), (req, res) => {
  return processUpload(req, res, false);
});

// Bulk upload (Protected)
router.post("/bulk", protect, upload.array("images", 10), (req, res) => {
  return processUpload(req, res, true);
});

// ---------------- PUBLIC ROUTES ---------------- //

// Single upload (Public - useful for registration)
router.post("/public", upload.single("image"), (req, res) => {
  return processUpload(req, res, false);
});

// Bulk upload (Public - useful for bulk registration docs)
router.post("/public/bulk", upload.array("images", 10), (req, res) => {
  return processUpload(req, res, true);
});

module.exports = router;
