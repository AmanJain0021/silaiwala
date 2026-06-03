const jwt = require("jsonwebtoken");
const User = require("../../../models/User");
const Customer = require("../../../models/Customer");
const Tailor = require("../../../models/Tailor");
const Delivery = require("../../../models/Delivery");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

/**
 * @desc    Check if user email or phone exists
 * @route   POST /api/v1/auth/check-user
 * @access  Public
 */
exports.checkUserExists = asyncHandler(async (req, res, next) => {
  const { email, phoneNumber } = req.body;
  const query = [];
  
  if (email) {
    query.push({ email: email.toLowerCase() });
  }
  
  if (phoneNumber) {
    let finalPhoneNumber = String(phoneNumber).replace(/[^\d]/g, '');
    if (finalPhoneNumber.length >= 10) {
      finalPhoneNumber = `+91${finalPhoneNumber.slice(-10)}`;
    }
    query.push({ phoneNumber: finalPhoneNumber });
  }

  if (query.length === 0) {
    return next(new ErrorResponse("Please provide email or phone number to check", 400));
  }

  const userExists = await User.findOne({ $or: query });
  
  if (userExists) {
    const conflictField = userExists.email === email?.toLowerCase() ? "email" : "phone";
    return res.status(200).json({ success: true, exists: true, message: `This ${conflictField} is already registered`, field: conflictField });
  }
  
  res.status(200).json({ success: true, exists: false, message: "User does not exist" });
});

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phoneNumber, phone, otp, password, role, shopName, experienceInYears, coordinates, specializations, referralCode, profileImage } = req.body;
  let finalPhoneNumber = phoneNumber || phone;

  if (!finalPhoneNumber) {
    return next(new ErrorResponse("Please provide a phone number", 400));
  }

  // Normalize phone number: strip non-digits except +, extract last 10 digits
  const digitsOnly = finalPhoneNumber.trim().replace(/[^\d]/g, '');
  const last10Digits = digitsOnly.slice(-10);

  if (!/^[6-9]\d{9}$/.test(last10Digits)) {
    return next(new ErrorResponse("Please provide a valid 10-digit mobile number starting with 6-9", 400));
  }

  // Enforce country code +91
  finalPhoneNumber = `+91${last10Digits}`;

  // 0. Verify OTP (Currently hardcoded legacy check, but required for signup flow)
  const isDev = process.env.NODE_ENV !== 'production';
  const isValidOTP = otp === "123456" || otp === "000000" || (isDev && otp && String(otp).length === 6);

  // In development, we allow registration without OTP if it's missing (to support all signup flows)
  // But if provided, it must be valid. In production, it is always required.
  if (!isDev && !otp) {
    return next(new ErrorResponse("Invalid or missing OTP. Please verify your mobile number first.", 400));
  }

  if (otp && !isValidOTP) {
    return next(new ErrorResponse("Invalid OTP. Please verify your mobile number first.", 400));
  }

  // 1. Validate Role
  const allowedRoles = ["customer", "tailor", "delivery"];
  const finalRole = allowedRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : "customer";

  // 2. Check for existing user
  const userExists = await User.findOne({ $or: [{ email }, { phoneNumber: finalPhoneNumber }] });
  if (userExists) {
    const conflictField = userExists.email === email ? "email" : "phone number";
    return next(new ErrorResponse(`A user with this ${conflictField} already exists`, 400));
  }

  // 3. Create User - Tailors and Delivery partners are inactive until approved
  const isAutoActive = !["tailor", "delivery"].includes(finalRole.toLowerCase());
  
  const user = await User.create({
    name,
    email,
    phoneNumber: finalPhoneNumber,
    password,
    role: finalRole,
    isActive: isAutoActive,
    profileImage: profileImage || "default_profile.png"
  });

  let profile = null;

  // 4. Create Role-Specific Profile
  try {
    switch (finalRole) {
      case "customer":
        let referredBy = null;
        if (referralCode) {
          const referrer = await Customer.findOne({ referralCode });
          if (referrer) {
            referredBy = referrer.user;
            // Increment referrer's referredCount
            referrer.referredCount += 1;
            await referrer.save();
          }
        }
        profile = await Customer.create({ 
          user: user._id,
          referredBy
        });
        break;
      case "tailor":
        profile = await Tailor.create({ 
          user: user._id,
          shopName: shopName || `${name}'s Boutique`,
          experienceInYears: experienceInYears || 0,
          specializations: specializations || [],
          location: {
            type: "Point",
            coordinates: coordinates || [0, 0], // [longitude, latitude]
            address: req.body.address
          },
          documents: req.body.documents || [] // Save documents if provided
        });
        break;
      case "delivery":
        profile = await Delivery.create({ 
          user: user._id,
          vehicleType: req.body.vehicleType || "bike",
          vehicleNumber: req.body.vehicleNumber,
          emergencyContact: req.body.emergencyContact,
          aadharNumber: req.body.aadharNumber,
          address: req.body.address,
          currentLocation: {
            type: "Point",
            coordinates: coordinates || [0, 0]
          },
          documents: req.body.documents || [] // Save documents if provided
        });
        break;
    }
  } catch (err) {
    // Cleanup: Remove user if profile creation fails (Atomic work-around)
    await User.findByIdAndDelete(user._id);
    return next(new ErrorResponse(`Failed to create ${finalRole} profile: ${err.message}`, 500));
  }

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile: profile
    },
  });
});

/**
 * @desc    Backward compatibility for registerCustomer
 */
exports.registerCustomer = exports.register;

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { phoneNumber, email } = req.body;
  let identifier = phoneNumber || email;

  if (!identifier) {
    return next(new ErrorResponse("Please provide an email or phone number", 400));
  }

  if (phoneNumber) {
    const digitsOnly = String(phoneNumber).replace(/[^\d]/g, '');
    const last10Digits = digitsOnly.slice(-10);
    
    if (!/^[6-9]\d{9}$/.test(last10Digits)) {
      return next(new ErrorResponse("Please provide a valid 10-digit mobile number starting with 6-9", 400));
    }
    
    identifier = `+91${last10Digits}`;
  }
  
  // Real implementation would use Twilio/AWS SNS etc.
  console.log(`[OTP] Sending verification code 123456 to ${identifier}`);
  res.status(200).json({ success: true, message: "OTP sent successfully" });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, otp } = req.body;

  // 1. Identify User (By Email OR Phone Number)
  if (!email) return next(new ErrorResponse("Identifier is required", 400));
  
  let phoneIdentifier = email;
  if (/^[\d+]+$/.test(email)) {
    const digitsOnly = String(email).replace(/[^\d]/g, '');
    const last10Digits = digitsOnly.slice(-10);
    
    if (!/^[6-9]\d{9}$/.test(last10Digits)) {
      return next(new ErrorResponse("Please provide a valid 10-digit mobile number starting with 6-9", 400));
    }
    
    phoneIdentifier = `+91${last10Digits}`;
  }

  const user = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { phoneNumber: phoneIdentifier }] 
  }).select("+password");

  if (!user) {
    return next(new ErrorResponse("No account found with this information", 404));
  }

  // 2. Verification (Password OR OTP)
  let verified = false;
  if (password) {
    verified = await user.comparePassword(password);
  } else if (otp === "123456" || (process.env.NODE_ENV !== "production" && otp && String(otp).length === 6)) {
    // Basic verification for testing/limited duration
    verified = true;
  }

  if (!verified) {
    return next(new ErrorResponse("Invalid credentials or incorrect OTP", 401));
  }

  const token = generateToken(user._id);

  let profile = null;
  if (user.role === 'tailor') {
    profile = await Tailor.findOne({ user: user._id });
  }

  res.status(200).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      profile: profile
    },
  });
});

