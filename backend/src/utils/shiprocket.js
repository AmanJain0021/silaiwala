const axios = require('axios');
const ErrorResponse = require("./errorResponse.js");

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let _token = null;
let _tokenExpiry = null;

/**
 * Get Shiprocket Auth Token
 */
const getToken = async () => {
  // If token exists and is valid (with 5 min buffer), return it
  if (_token && _tokenExpiry && _tokenExpiry > Date.now() + 300000) {
    return _token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email === 'TODO_ENTER_EMAIL' || email === 'your_shiprocket_email@example.com') {
    console.warn("⚠️ Shiprocket credentials not set. Simulating API response.");
    return 'SIMULATED_TOKEN';
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });

    _token = response.data.token;
    // Shiprocket tokens usually last 10 days. We'll refresh after 9 days.
    _tokenExpiry = Date.now() + (9 * 24 * 60 * 60 * 1000); 
    return _token;
  } catch (error) {
    console.error("Shiprocket Login Error:", error.response?.data || error.message);
    throw new ErrorResponse("Failed to authenticate with Shiprocket", 500);
  }
};

/**
 * Create Custom Order in Shiprocket
 */
const createOrder = async (orderData) => {
  const token = await getToken();
  
  if (token === 'SIMULATED_TOKEN') {
    return {
      order_id: `SR_ORD_${Date.now()}`,
      shipment_id: `SR_SHIP_${Date.now()}`,
      status: 'NEW',
      status_code: 1,
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Shiprocket Create Order Error:", error.response?.data || error.message);
    throw new ErrorResponse(error.response?.data?.message || "Failed to create Shiprocket order", 500);
  }
};

/**
 * Generate AWB
 */
const generateAWB = async (shipmentId) => {
  const token = await getToken();

  if (token === 'SIMULATED_TOKEN') {
    return {
      awb_code: `AWB${Math.floor(Math.random() * 1000000000)}`,
      courier_name: "Delhivery (Simulated)",
      routing_code: "RT123"
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/courier/assign/awb`, {
      shipment_id: shipmentId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.response.data;
  } catch (error) {
    console.error("Shiprocket AWB Error:", error.response?.data || error.message);
    throw new ErrorResponse("Failed to generate AWB", 500);
  }
};

/**
 * Request Pickup
 */
const requestPickup = async (shipmentId) => {
  const token = await getToken();

  if (token === 'SIMULATED_TOKEN') {
    return { pickup_scheduled_date: new Date().toISOString() };
  }

  try {
    const response = await axios.post(`${BASE_URL}/courier/generate/pickup`, {
      shipment_id: [shipmentId]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Shiprocket Pickup Error:", error.response?.data || error.message);
    throw new ErrorResponse("Failed to schedule pickup", 500);
  }
};

/**
 * Generate Label URL
 */
const generateLabel = async (shipmentId) => {
  const token = await getToken();

  if (token === 'SIMULATED_TOKEN') {
    return { label_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" };
  }

  try {
    const response = await axios.post(`${BASE_URL}/courier/generate/label`, {
      shipment_id: [shipmentId]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Shiprocket Label Error:", error.response?.data || error.message);
    throw new ErrorResponse("Failed to generate shipping label", 500);
  }
};

/**
 * Create Return Order in Shiprocket
 */
const createReturnOrder = async (orderData) => {
  const token = await getToken();
  
  if (token === 'SIMULATED_TOKEN') {
    return {
      order_id: `SR_RET_${Date.now()}`,
      shipment_id: `SR_RET_SHIP_${Date.now()}`,
      status: 'NEW',
      status_code: 1,
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/orders/create/return`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Shiprocket Create Return Order Error:", error.response?.data || error.message);
    throw new ErrorResponse(error.response?.data?.message || "Failed to create Shiprocket return order", 500);
  }
};

/**
 * Create Pickup Location in Shiprocket
 * Required fields: pickup_location, name, email, phone, address, address_2, city, state, country, pin_code
 */
const createPickupLocation = async (locationData) => {
  const token = await getToken();

  if (token === 'SIMULATED_TOKEN') {
    return {
      pickup_id: Math.floor(Math.random() * 100000),
      pickup_location: locationData.pickup_location,
      status: 'CREATED',
      simulated: true,
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/settings/company/addpickup`, locationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.errors || error.message;
    const errorStr = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);

    // Handle "pickup location already exists" gracefully — treat as success
    if (errorStr.toLowerCase().includes('already') || errorStr.toLowerCase().includes('exists') || errorStr.toLowerCase().includes('duplicate')) {
      console.warn(`Shiprocket Pickup Location already exists for "${locationData.pickup_location}", treating as success.`);
      return {
        pickup_location: locationData.pickup_location,
        status: 'ALREADY_EXISTS',
        reused: true,
      };
    }

    console.error("Shiprocket Create Pickup Location Error:", error.response?.data || error.message);
    throw new ErrorResponse(errorStr || "Failed to create Shiprocket pickup location", 500);
  }
};

module.exports = {
  createOrder,
  generateAWB,
  requestPickup,
  generateLabel,
  createReturnOrder,
  createPickupLocation
};
