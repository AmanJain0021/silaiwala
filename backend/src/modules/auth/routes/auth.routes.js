const express = require("express");
const router = express.Router();
const { register, login, sendOTP, checkUserExists, deleteAccount, googleLogin, verifyOTP } = require("../controllers/auth.controller.js");
const { validateRegister, validateLogin, validateOTP } = require("../validators/auth.validator.js");
const validate = require("../../../middlewares/validate.middleware.js");
const { protect } = require("../../../middlewares/auth.middleware.js");

router.post("/register", validateRegister, validate, register);
router.post("/register-customer", validateRegister, validate, register);
router.post("/send-otp", validateOTP, validate, sendOTP);
router.post("/verify-otp", validateOTP, validate, verifyOTP);
router.post("/login", validateLogin, validate, login);
router.post("/google-login", googleLogin);
router.post("/check-user", checkUserExists);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
