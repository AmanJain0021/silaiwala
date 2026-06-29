const express = require("express");
const router = express.Router();
const { register, login, sendOTP, checkUserExists, deleteAccount } = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validateOTP } = require("../validators/auth.validator");
const validate = require("../../../middlewares/validate.middleware");
const { protect } = require("../../../middlewares/auth.middleware");

router.post("/register", validateRegister, validate, register);
router.post("/register-customer", validateRegister, validate, register);
router.post("/send-otp", validateOTP, validate, sendOTP);
router.post("/login", validateLogin, validate, login);
router.post("/check-user", checkUserExists);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
