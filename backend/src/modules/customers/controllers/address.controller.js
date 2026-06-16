const Customer = require("../../../models/Customer");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const axios = require("axios");

const autoGeocode = async (body) => {
  // If coordinates already exist from frontend GPS detection, skip
  if (body.location && body.location.coordinates && body.location.coordinates.length === 2 && body.location.coordinates[0] !== null) {
      return body; 
  }
  
  try {
      const addressString = `${body.street || ''}, ${body.city || ''}, ${body.state || ''}, ${body.zipCode || ''}, ${body.country || 'India'}`;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (apiKey && apiKey !== 'your_google_maps_api_key' && apiKey !== 'your_backend_google_maps_api_key_here') {
          console.log(`📍 [address.controller] Auto-geocoding typed address: ${addressString}`);
          const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
              params: {
                  address: addressString,
                  key: apiKey
              }
          });
          
          if (geoResponse.data.status === 'OK' && geoResponse.data.results.length > 0) {
              const location = geoResponse.data.results[0].geometry.location;
              console.log(`🗺️ [address.controller] Successfully geocoded to Lat: ${location.lat}, Lng: ${location.lng}`);
              body.location = {
                  type: 'Point',
                  coordinates: [location.lng, location.lat]
              };
          } else {
              console.warn(`⚠️ [address.controller] Google Geocode API returned status: ${geoResponse.data.status}`);
          }
      }
  } catch (err) {
      console.error(`❌ [address.controller] Google Geocode API Error:`, err.message);
  }
  return body;
};

/**
 * @desc    Get all saved addresses for customer
 * @route   GET /api/v1/customers/addresses
 * @access  Private (Customer)
 */
exports.getAddresses = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findOne({ user: req.user.id });
  
  // Auto-create profile if role is customer/admin but profile is missing
  if (!customer) {
    customer = await Customer.create({ user: req.user.id });
  }

  if (!customer) {
    // If it's an admin or other authorized role, return empty data instead of error
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }

  res.status(200).json({
    success: true,
    count: customer.addresses.length,
    data: customer.addresses,
  });
});

/**
 * @desc    Add new address
 * @route   POST /api/v1/customers/addresses
 * @access  Private (Customer)
 */
exports.addAddress = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findOne({ user: req.user.id });
  
  // Auto-create profile if role is customer/admin but profile is missing
  if (!customer) {
    customer = await Customer.create({ user: req.user.id });
  }

  if (!customer) {
    return next(new ErrorResponse("Customer profile not found", 404));
  }

  // If this is set as default, unset others first
  if (req.body.isDefault) {
    customer.addresses.forEach(addr => addr.isDefault = false);
  } else if (customer.addresses.length === 0) {
    req.body.isDefault = true; // First address is always default
  }

  // Auto-geocode if coordinates are missing
  req.body = await autoGeocode(req.body);

  customer.addresses.push(req.body);
  await customer.save();

  res.status(201).json({
    success: true,
    data: customer.addresses,
  });
});

/**
 * @desc    Update an address
 * @route   PATCH /api/v1/customers/addresses/:id
 * @access  Private (Customer)
 */
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findOne({ user: req.user.id });
  if (!customer) {
    return next(new ErrorResponse("Customer profile not found", 404));
  }

  const address = customer.addresses.id(req.params.id);
  if (!address) {
    return next(new ErrorResponse("Address not found", 404));
  }

  // If setting as default, unset others
  if (req.body.isDefault) {
    customer.addresses.forEach(addr => addr.isDefault = false);
  }

  // Auto-geocode if coordinates are missing or updated without GPS
  req.body = await autoGeocode(req.body);

  Object.assign(address, req.body);
  await customer.save();

  res.status(200).json({
    success: true,
    data: customer.addresses,
  });
});

/**
 * @desc    Delete an address
 * @route   DELETE /api/v1/customers/addresses/:id
 * @access  Private (Customer)
 */
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findOne({ user: req.user.id });
  if (!customer) {
    return next(new ErrorResponse("Customer profile not found", 404));
  }

  customer.addresses = customer.addresses.filter(
    (addr) => addr._id.toString() !== req.params.id
  );

  // If deleted address was default, set another one as default
  if (customer.addresses.length > 0 && !customer.addresses.some(a => a.isDefault)) {
    customer.addresses[0].isDefault = true;
  }

  await customer.save();

  res.status(200).json({
    success: true,
    data: customer.addresses,
  });
});
