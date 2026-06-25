const multer = require("multer");
const path = require("path");

// Use memory storage to completely bypass Vercel's read-only file system
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 1. Strict Mimetype check
  const allowedMimetypes = [
    "image/jpeg", "image/png", "image/webp", "image/jpg", 
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  // 2. Strict Extension check (prevent null byte or double extension attacks)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimetypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only JPG, PNG, WEBP, PDF, and DOC files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
