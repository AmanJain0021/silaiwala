const mongoose = require('mongoose');
const Order = require('./src/models/Order.js');
const MeasurementRequest = require('./src/models/MeasurementRequest.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const orders = await Order.find().sort('-createdAt').limit(5).lean();
  console.log("Recent Orders:");
  for (let order of orders) {
    console.log(`Order: ${order.orderId}, Status: ${order.status}, isMeasurementHome: ${order.isMeasurementHome}`);
    const mr = await MeasurementRequest.findOne({ order: order._id }).lean();
    if (mr) {
      console.log(`  -> Has MR: ${mr.requestId}, status: ${mr.status}, executive: ${mr.executive}`);
    } else {
      console.log(`  -> NO MeasurementRequest`);
    }
  }
  
  process.exit(0);
}
run();
