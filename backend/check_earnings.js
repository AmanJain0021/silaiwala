const mongoose = require('mongoose');
const Order = require('./src/models/Order.js');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const orders = await Order.find({ deliveryPartner: { $exists: true, $ne: null } }).sort('-createdAt').limit(3).lean();
  orders.forEach(o => {
    console.log(o.orderId, 'Fee:', o.deliveryFee, 'PartnerEarning:', o.deliveryPartnerEarning, 'Earnings:', o.deliveryEarnings);
  });
  process.exit(0);
});
