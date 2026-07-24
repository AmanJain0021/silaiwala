const jwt = require("jsonwebtoken");
const User = require("../../../models/User.js");
const Customer = require("../../../models/Customer.js");
const Tailor = require("../../../models/Tailor.js");
const Delivery = require("../../../models/Delivery.js");
const MeasurementExecutive = require("../../../models/MeasurementExecutive.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const { sendNotification } = require("../../../utils/notification.js");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');
const { invalidateCache } = require("../../../utils/cache.js");

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
  const { name, email, phoneNumber, phone, otp, password, role, shopName, experienceInYears, coordinates, specializations, referralCode, profileImage, fcmToken, platform } = req.body;
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

  // 0. Verify OTP
  const isDev = process.env.NODE_ENV !== 'production';
  const isValidOTP = otp === "123456" || otp === "000000" || (otp && String(otp).length === 6);

  if (!isDev && !otp) {
    return next(new ErrorResponse("Invalid or missing OTP. Please verify your mobile number first.", 400));
  }

  if (otp && !isValidOTP) {
    return next(new ErrorResponse("Invalid OTP. Please verify your mobile number first.", 400));
  }

  // 1. Validate Role
  const allowedRoles = ["customer", "tailor", "delivery", "measurement_executive"];
  const finalRole = allowedRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : "customer";

  // 2. Check for existing user
  const userExists = await User.findOne({ $or: [{ email }, { phoneNumber: finalPhoneNumber }] });
  if (userExists) {
    const conflictField = userExists.email === email ? "email" : "phone number";
    return next(new ErrorResponse(`A user with this ${conflictField} already exists`, 400));
  }

  // 3. Validate Referral Code for customers
  let referrerProfile = null;
  if (referralCode && finalRole === "customer") {
    referrerProfile = await Customer.findOne({ referralCode });
    if (!referrerProfile) {
      return next(new ErrorResponse("Invalid referral code. Please check and try again.", 400));
    }
  }

  // 4. Create User - Tailors and Delivery partners are inactive until approved
  const isAutoActive = !["tailor", "delivery", "measurement_executive"].includes(finalRole.toLowerCase());
  
  const isMobile = platform === 'mobile' || platform === 'android' || platform === 'ios' || platform === 'react-native';
  const fcmTokenArray = fcmToken && !isMobile ? [fcmToken] : [];
  const fcmTokenMobileArray = fcmToken && isMobile ? [fcmToken] : [];

  const validProfileImage = (typeof profileImage === 'string' && profileImage.trim() && profileImage !== '{}' && profileImage !== '[object Object]')
    ? profileImage.trim()
    : "default_profile.png";

  const user = await User.create({
    name,
    email,
    phoneNumber: finalPhoneNumber,
    password,
    role: finalRole,
    isActive: isAutoActive,
    profileImage: validProfileImage,
    fcmToken: fcmTokenArray,
    fcmTokenMobile: fcmTokenMobileArray
  });

  let profile = null;

  // 4. Create Role-Specific Profile
  try {
    switch (finalRole) {
      case "customer":
        let referredBy = null;
        if (referrerProfile) {
          referredBy = referrerProfile.user;
          // Increment referrer's referredCount
          referrerProfile.referredCount += 1;
          await referrerProfile.save();
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

        // Notify admins about new tailor registration
        await sendNotification({
          recipient: "admins",
          type: "NEW_REGISTRATION",
          title: "New Tailor Registration",
          message: `${name} has registered as a Tailor and is pending approval.`,
          data: { targetUrl: "/users/tailors/pending" }
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
          documents: req.body.documents || [], // Save documents if provided
          partnerRoles: req.body.partnerRoles || ["delivery"],
          bankDetails: (req.body.accountNumber || req.body.accountName || req.body.ifscCode) ? { 
            accountNumber: req.body.accountNumber,
            accountName: req.body.accountName,
            bankName: req.body.bankName,
            ifscCode: req.body.ifscCode
          } : undefined
        });

        // Notify admins about new delivery partner registration
        await sendNotification({
          recipient: "admins",
          type: "NEW_REGISTRATION",
          title: "New Delivery Partner",
          message: `${name} has registered as a Delivery Partner and is pending approval.`,
          data: { targetUrl: "/users/delivery/pending" }
        });
        break;
      case "measurement_executive":
        profile = await MeasurementExecutive.create({
          user: user._id,
          address: req.body.address,
          currentLocation: {
            type: "Point",
            coordinates: coordinates || [0, 0]
          },
          serviceRadius: req.body.serviceRadius || 10,
          profilePhoto: validProfileImage,
          aadharNumber: req.body.aadharNumber,
          documents: req.body.documents || [],
          bankDetails: (req.body.accountNumber || req.body.accountName || req.body.ifscCode) ? {
            accountNumber: req.body.accountNumber,
            accountName: req.body.accountName,
            bankName: req.body.bankName,
            ifscCode: req.body.ifscCode
          } : undefined
        });

        // Notify admins about new measurement executive registration
        await sendNotification({
          recipient: "admins",
          type: "NEW_REGISTRATION",
          title: "New Measurement Executive",
          message: `${name} has registered as a Measurement Executive and is pending approval.`,
          data: { targetUrl: "/admin/measurement-executives" }
        });
        break;
    }
  } catch (err) {
    // Cleanup: Remove user if profile creation fails (Atomic work-around)
    await User.findByIdAndDelete(user._id);
    return next(new ErrorResponse(`Failed to create ${finalRole} profile: ${err.message}`, 500));
  }

  const token = generateToken(user._id);

  // Invalidate dashboard caches when a new user is created
  await invalidateCache("cache:admin:dashboard-stats");
  await invalidateCache("cache:admin:crm-dashboard");

  res.status(201).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
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
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { phone, phoneNumber, email, otp } = req.body;
  const activePhone = phoneNumber || phone;
  const identifier = activePhone || email;
  
  if (!identifier || !otp) {
    return next(new ErrorResponse("Phone number/email and OTP are required", 400));
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const isValidOTP = otp === "123456" || otp === "000000" || (isDev && otp && String(otp).length === 6);

  if (!isValidOTP) {
    return next(new ErrorResponse("Invalid OTP. Please try again.", 400));
  }

  res.status(200).json({ success: true, message: "OTP verified successfully" });
});

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { phoneNumber, email, phone } = req.body;
  const activePhone = phoneNumber || phone;
  let identifier = activePhone || email;

  if (!identifier) {
    return next(new ErrorResponse("Please provide an email or phone number", 400));
  }

  if (activePhone) {
    const digitsOnly = String(activePhone).replace(/[^\d]/g, '');
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
  const { email, password, otp, expectedRole, fcmToken, platform } = req.body;

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

  // Enforce strict role-based access if expectedRole is provided by the client
  if (expectedRole && user.role !== expectedRole) {
    let portalName = expectedRole === 'customer' ? 'Customer' : expectedRole === 'tailor' ? 'Partner/Tailor' : 'Delivery';
    return next(new ErrorResponse(`Access denied. This portal is strictly for ${portalName}s.`, 403));
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

  if (fcmToken) {
    let isTokenUpdated = false;
    const isMobile = platform === 'mobile' || platform === 'android' || platform === 'ios' || platform === 'react-native';
    
    if (isMobile) {
      if (!user.fcmTokenMobile.includes(fcmToken)) {
        user.fcmTokenMobile.push(fcmToken);
        isTokenUpdated = true;
      }
    } else {
      if (!user.fcmToken.includes(fcmToken)) {
        user.fcmToken.push(fcmToken);
        isTokenUpdated = true;
      }
    }

    if (isTokenUpdated) {
      await user.save();
    }
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

/**
 * @desc    Delete user account permanently
 * @route   DELETE /api/v1/auth/delete-account
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Delete role-specific profile first
  switch (user.role) {
    case "customer":
      await Customer.findOneAndDelete({ user: user._id });
      break;
    case "tailor":
      await Tailor.findOneAndDelete({ user: user._id });
      break;
    case "delivery":
    case "delivery_boy":
      await Delivery.findOneAndDelete({ user: user._id });
      break;
    case "measurement_executive":
      await MeasurementExecutive.findOneAndDelete({ user: user._id });
      break;
  }

  // Delete the user record
  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

/**
 * @desc    Login user with Google
 * @route   POST /api/v1/auth/google-login
 * @access  Public
 */
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { credential, fcmToken, platform } = req.body;
  if (!credential) {
    return next(new ErrorResponse("Google credential is required", 400));
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
      return next(new ErrorResponse("Could not extract email from Google account", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please create an account first."
      });
    }

    if (fcmToken) {
      let isTokenUpdated = false;
      const isMobile = platform === 'mobile' || platform === 'android' || platform === 'ios' || platform === 'react-native';
      
      if (isMobile) {
        if (!user.fcmTokenMobile.includes(fcmToken)) {
          user.fcmTokenMobile.push(fcmToken);
          isTokenUpdated = true;
        }
      } else {
        if (!user.fcmToken.includes(fcmToken)) {
          user.fcmToken.push(fcmToken);
          isTokenUpdated = true;
        }
      }

      if (isTokenUpdated) {
        await user.save();
      }
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
  } catch (error) {
    console.error("Google Auth Error:", error);
    return next(new ErrorResponse("Failed to authenticate with Google", 401));
  }
});
