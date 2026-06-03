const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await Order.find({}).populate('customer');
    for (const order of orders) {
        console.log(`Order: ${order.orderId}, Customer: ${order.customer?.name} (${order.customer?.role})`);
    }
    process.exit(0);
}

run();
