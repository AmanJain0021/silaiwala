require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const order = await Order.findOne({ orderId: 'ORD-8ADCDFD4' });
  if (order) {
    if (!order.pendingPartnerCandidates.includes('6a211f0c858ad819e5ff2641')) {
        order.pendingPartnerCandidates.push('6a211f0c858ad819e5ff2641');
        await order.save();
        console.log('Added Abhishek to candidates');
    } else {
        console.log('Already a candidate');
    }
  } else {
    console.log('Order not found');
  }
  process.exit(0);
});
