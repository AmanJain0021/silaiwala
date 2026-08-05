const multer = require("multer");
const path = require("path");

// Use memory storage to completely bypass Vercel's read-only file system
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Explicitly forbidden dangerous executable/script extensions
  const forbiddenExtensions = [
    '.exe', '.bat', '.cmd', '.sh', '.php', '.pl', '.py', '.js', '.vbs', '.jar', '.vbe', '.wsf', '.wsc', '.scr'
  ];

  const ext = path.extname(file.originalname || "").toLowerCase();

  // If explicitly dangerous extension, reject immediately
  if (forbiddenExtensions.includes(ext)) {
    return cb(new Error("Executable or script files are strictly prohibited."), false);
  }

  // Allowed Extensions for images, documents, and videos
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.heif', '.avif', '.bmp', '.tiff', '.ico',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
    '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.3gp', '.wmv', '.m4v'
  ];

  const mime = (file.mimetype || "").toLowerCase();

  // Check 1: Is it any image or video media type?
  const isImageOrVideoMime = mime.startsWith("image/") || mime.startsWith("video/");

  // Check 2: Is it a supported document MIME type?
  const isDocumentMime = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv"
  ].includes(mime);

  // Check 3: Is the extension explicitly in the allowed list?
  const isAllowedExt = allowedExtensions.includes(ext);

  // Check 4: Is it a frontend Blob/Canvas upload (generic octet-stream or empty mime with no extension or 'blob' name)?
  const isBlobUpload = (mime === "application/octet-stream" || !mime) && (!ext || ext === '' || file.originalname === 'blob');

  if (isImageOrVideoMime || isDocumentMime || isAllowedExt || isBlobUpload) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only images (JPG, PNG, WEBP, HEIC, GIF, SVG), documents (PDF, DOC), and videos (MP4, WEBM, MOV) are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

module.exports = upload;
