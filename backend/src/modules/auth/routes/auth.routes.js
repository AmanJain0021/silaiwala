const express = require("express");
const router = express.Router();
const { register, login, sendOTP, checkUserExists } = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validateOTP } = require("../validators/auth.validator");
const validate = require("../../../middlewares/validate.middleware");

router.post("/register", validateRegister, validate, register);
router.post("/register-customer", validateRegister, validate, register);
router.post("/send-otp", validateOTP, validate, sendOTP);
router.post("/login", validateLogin, validate, login);
router.post("/check-user", checkUserExists);

module.exports = router;
