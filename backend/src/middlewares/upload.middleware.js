const multer = require("multer");
const path = require("path");

// Use memory storage to completely bypass Vercel's read-only file system
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow all image types, PDFs, and common document formats
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype.includes("document") // to catch word docs just in case
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF documents are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
