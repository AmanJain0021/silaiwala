const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne({ orderId: 'ORD-44E41BDF' }).populate('customer');
        if (!order) {
            console.log('Order not found');
        } else {
            console.log('Order Customer ID:', order.customer._id);
            console.log('Order Customer Name:', order.customer.name);
            console.log('Order Customer Role:', order.customer.role);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
