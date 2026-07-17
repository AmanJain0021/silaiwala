const mongoose = require('mongoose');
const MeasurementRequest = require('./src/models/MeasurementRequest.js');
const Order = require('./src/models/Order.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find a pending order without MR
  const order = await Order.findOne({ status: 'pending', isMeasurementHome: true });
  if (order) {
    const existing = await MeasurementRequest.findOne({ order: order._id });
    if (!existing) {
      console.log("Creating mock MeasurementRequest for order", order.orderId);
      await MeasurementRequest.create({
        requestId: `MR${Date.now()}`,
        order: order._id,
        customer: order.customer,
        tailor: order.tailor,
        status: "pending",
        executive: null
      });
      console.log("Created successfully.");
    } else {
      console.log("MR already exists. Resetting to pending/null.");
      existing.status = "pending";
      existing.executive = null;
      await existing.save();
    }
  } else {
    console.log("No pending order found.");
  }
  
  process.exit(0);
}
run();
