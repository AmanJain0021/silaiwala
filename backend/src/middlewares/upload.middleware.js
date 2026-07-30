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
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"
  ];
  
  // 2. Strict Extension check
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const ext = path.extname(file.originalname || "").toLowerCase();
  const isAllowedMime = allowedMimetypes.includes(file.mimetype) || file.mimetype?.startsWith('video/');
  const isAllowedExt = allowedExtensions.includes(ext);
  const isMediaMime =
    file.mimetype &&
    (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/"));

  if (isAllowedMime && (isAllowedExt || (isMediaMime && !ext))) {
    cb(null, true);
  } else if (isMediaMime && !isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only images, documents, and videos (MP4, WEBM, MOV) are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

module.exports = upload;
