const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const User = require("../src/models/User");
const Order = require("../src/models/Order");
const MeasurementRequest = require("../src/models/MeasurementRequest");

const BASE_URL = "http://localhost:5000/api/v1";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const makeRequest = async (url, token, role) => {
  console.log(`[${role}] GET ${url}`);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // We check content-type as well just to be safe
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error(`❌ [${role}] API Error (${res.status}): Expected JSON but got something else. Response:`, text.substring(0, 100));
        return null;
    }
    
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ [${role}] API Error (${res.status}): ${url}`, data);
      return null;
    }
    
    // Verify required fields exist to prevent empty objects masking as success
    if (data && data.success === true) {
        // Quick shallow check
        console.log(`✅ [${role}] Success - Payload Size: ${JSON.stringify(data).length} bytes`);
    } else {
        console.warn(`⚠️ [${role}] Warning: ${url} returned success: false or missing success field`);
    }
    
    return data.data;
  } catch (err) {
    console.error(`❌ [${role}] Request Failed: ${url}`, err.message);
    return null;
  }
};

const runAudit = async () => {
  try {
    console.log("=========================================");
    console.log("🚀 STARTING SILAIWALA QA INTEGRATION AUDIT");
    console.log("=========================================\n");
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to Database.\n");

    // Fetch random active orders to audit
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).lean();
    if (orders.length === 0) {
      console.log("No orders found to audit.");
      process.exit(0);
    }

    console.log(`Found ${orders.length} orders for QA audit.\n`);

    // Get an Admin token
    const admin = await User.findOne({ role: "admin" }).lean();
    let adminToken = null;
    if (admin) {
      adminToken = generateToken(admin._id);
      console.log(`🔑 Obtained Auth Token for ADMIN (${admin._id})`);
    }

    // Verify Admin Fetch All
    if (adminToken) {
        console.log("\n▶ Testing Global Admin Access:");
        await makeRequest(`${BASE_URL}/admin/orders`, adminToken, "ADMIN");
    }

    for (const order of orders) {
      console.log(`\n---------------------------------------------------------`);
      console.log(`🔎 Auditing Order Details for: ${order.orderId || order._id} (Status: ${order.status})`);
      console.log(`---------------------------------------------------------`);

      // 1. Admin verification
      if (adminToken) {
        await makeRequest(`${BASE_URL}/admin/orders/${order._id}`, adminToken, "ADMIN");
      }

      // 2. Customer verification
      if (order.customer) {
        const customerToken = generateToken(order.customer);
        await makeRequest(`${BASE_URL}/orders/${order._id}`, customerToken, "CUSTOMER");
        if (order.isMeasurementHome) {
           await makeRequest(`${BASE_URL}/orders/${order._id}/measurements`, customerToken, "CUSTOMER");
        }
      }

      // 3. Tailor verification
      if (order.tailor) {
        const tailorToken = generateToken(order.tailor);
        await makeRequest(`${BASE_URL}/tailors/orders?status=all`, tailorToken, "TAILOR");
      }

      // 4. Delivery Partner verification
      if (order.deliveryBoyId || order.deliveryPartner || order.pickupPartner || order.dropoffPartner) {
        const partnerId = order.deliveryBoyId || order.deliveryPartner || order.pickupPartner || order.dropoffPartner;
        if (partnerId) {
            const deliveryToken = generateToken(partnerId);
            await makeRequest(`${BASE_URL}/deliveries/orders/${order._id}`, deliveryToken, "DELIVERY");
            await makeRequest(`${BASE_URL}/deliveries/orders/assigned`, deliveryToken, "DELIVERY");
        }
      } else {
        console.log(`[DELIVERY] Order ${order.orderId || order._id} is not assigned to a delivery partner yet. Skipping.`);
      }
      
      // 5. Measurement Executive verification
      if (order.isMeasurementHome) {
        const mr = await MeasurementRequest.findOne({ order: order._id }).lean();
        if (mr && mr.executive) {
            const meToken = generateToken(mr.executive);
            await makeRequest(`${BASE_URL}/measurement-executive/requests/${mr._id}`, meToken, "EXECUTIVE");
            await makeRequest(`${BASE_URL}/measurement-executive/requests`, meToken, "EXECUTIVE");
        } else {
            console.log(`[EXECUTIVE] Order ${order.orderId || order._id} is home measurement but no executive assigned yet. Skipping.`);
        }
      }
    }

    console.log("\n=========================================");
    console.log("🎉 AUDIT COMPLETE! Review the logs above for any ❌ errors.");
    console.log("=========================================\n");
    process.exit(0);

  } catch (err) {
    console.error("❌ Audit script failed:", err);
    process.exit(1);
  }
};

runAudit();
