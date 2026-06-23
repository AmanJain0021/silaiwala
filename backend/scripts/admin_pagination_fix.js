const fs = require('fs');
const path = require('path');

const adminCtrlPath = 'C:\\Users\\amanj\\OneDrive\\silaiwala1\\silaiwala\\backend\\src\\modules\\admin\\controllers\\admin.controller.js';
let content = fs.readFileSync(adminCtrlPath, 'utf8');

// 1. Fix getAllUsers
content = content.replace(
  /exports\.getAllUsers = async \(req, res\) => \{\s*try \{\s*const \{ role \} = req\.query;/,
  `exports.getAllUsers = async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;`
);

content = content.replace(
  /const users = await User\.find\(\{ role: 'customer' \}\)\.select\("-password"\)\.sort\("-createdAt"\)\.lean\(\);/,
  `const total = await User.countDocuments({ role: 'customer' });
      const users = await User.find({ role: 'customer' }).select("-password").sort("-createdAt").limit(Number(limit)).skip(skip).lean();`
);

content = content.replace(
  /const users = await User\.find\(\{ role: 'tailor' \}\)\.select\("-password"\)\.sort\("-createdAt"\)\.lean\(\);/,
  `const total = await User.countDocuments({ role: 'tailor' });
      const users = await User.find({ role: 'tailor' }).select("-password").sort("-createdAt").limit(Number(limit)).skip(skip).lean();`
);

content = content.replace(
  /const users = await User\.find\(query\)\.select\("-password"\)\.sort\("-createdAt"\);/,
  `const total = await User.countDocuments(query);
    const users = await User.find(query).select("-password").sort("-createdAt").limit(Number(limit)).skip(skip);`
);

content = content.replace(
  /return res\.status\(200\)\.json\(\{ success: true, count: data\.length, data \}\);/g,
  `return res.status(200).json({ success: true, count: data.length, total, pages: Math.ceil(total / limit), data });`
);

content = content.replace(
  /res\.status\(200\)\.json\(\{ success: true, count: users\.length, data: users \}\);/,
  `res.status(200).json({ success: true, count: users.length, total, pages: Math.ceil(total / limit), data: users });`
);

// 2. Fix getDeliveryPartners
content = content.replace(
  /exports\.getDeliveryPartners = async \(req, res\) => \{\s*try \{\s*\/\/ 1\. Get all users with delivery role\s*const users = await User\.find\(\{ role: "delivery" \}\)\.select\("-password"\)\.sort\("-createdAt"\)\.lean\(\);/,
  `exports.getDeliveryPartners = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments({ role: "delivery" });
    // 1. Get all users with delivery role
    const users = await User.find({ role: "delivery" }).select("-password").sort("-createdAt").limit(Number(limit)).skip(skip).lean();`
);

content = content.replace(
  /res\.status\(200\)\.json\(\{ success: true, count: data\.length, data \}\);/,
  `res.status(200).json({ success: true, count: data.length, total, pages: Math.ceil(total / limit), data });`
);

// 3. Fix getPendingTailors
content = content.replace(
  /exports\.getPendingTailors = async \(req, res\) => \{\s*try \{\s*const users = await User\.find\(\{ role: "tailor", isActive: false \}\)\.select\("-password"\)\.lean\(\);/,
  `exports.getPendingTailors = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments({ role: "tailor", isActive: false });
    const users = await User.find({ role: "tailor", isActive: false }).select("-password").limit(Number(limit)).skip(skip).lean();`
);

// 4. Fix getPendingDeliveryPartners
content = content.replace(
  /exports\.getPendingDeliveryPartners = async \(req, res\) => \{\s*try \{\s*const users = await User\.find\(\{ role: "delivery", isActive: false \}\)\.select\("-password"\)\.lean\(\);/,
  `exports.getPendingDeliveryPartners = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments({ role: "delivery", isActive: false });
    const users = await User.find({ role: "delivery", isActive: false }).select("-password").limit(Number(limit)).skip(skip).lean();`
);

// Replace the two occurrences of res.status(200).json({ success: true, data }); in getPendingTailors and getPendingDeliveryPartners
content = content.replace(
  /res\.status\(200\)\.json\(\{ success: true, data \}\);/g,
  `res.status(200).json({ success: true, count: data.length, total, pages: Math.ceil(total / limit), data });`
);

fs.writeFileSync(adminCtrlPath, content, 'utf8');
console.log('Fixed admin.controller.js pagination');
