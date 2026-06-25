const express = require("express");
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getTailors,
  getWishlist,
  wishlistToggle,
  applyPromoCode,
  getReferralStats
} = require("../controllers/customer.controller");
const { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress 
} = require("../controllers/address.controller");
const {
  getCart,
  addToCart,
  removeFromCart
} = require("../controllers/cart.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

router.use(protect);

router.get("/profile", authorize("customer", "admin", "tailor", "delivery"), getProfile);
router.patch("/profile", authorize("customer", "admin", "tailor", "delivery"), updateProfile);
router.get("/tailors", getTailors);

// Address Management
router.get("/addresses", authorize("customer", "admin", "tailor", "delivery"), getAddresses);
router.post("/addresses", authorize("customer", "admin", "tailor", "delivery"), addAddress);
router.patch("/addresses/:id", authorize("customer", "admin", "tailor", "delivery"), updateAddress);
router.delete("/addresses/:id", authorize("customer", "admin", "tailor", "delivery"), deleteAddress);

// Wishlist
router.get("/wishlist", authorize("customer", "admin", "tailor", "delivery"), getWishlist);
router.post("/wishlist/toggle", authorize("customer", "admin", "tailor", "delivery"), wishlistToggle);

// Promo
router.post("/apply-promo", authorize("customer", "admin", "tailor", "delivery"), applyPromoCode);

// Refer & Earn
router.get("/referral-stats", authorize("customer", "admin", "tailor", "delivery"), getReferralStats);

// Cart Management
router.get("/cart", authorize("customer", "admin", "tailor", "delivery"), getCart);
router.post("/cart", authorize("customer", "admin", "tailor", "delivery"), addToCart);
router.delete("/cart/:itemId", authorize("customer", "admin", "tailor", "delivery"), removeFromCart);

module.exports = router;
