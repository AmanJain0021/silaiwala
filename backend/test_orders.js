const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const orders2 = await Order.find({ deliveryStatus: 'pending', deliveryPartner: { $ne: null } });
        console.log(JSON.stringify(orders2.map(o => ({
            id: o.orderId,
            status: o.status,
            deliveryPartner: o.deliveryPartner ? o.deliveryPartner.toString() : null,
            dropoffPartner: o.dropoffPartner ? o.dropoffPartner.toString() : null,
            dropoffDeliveryStatus: o.dropoffDeliveryStatus,
            pickupPartner: o.pickupPartner ? o.pickupPartner.toString() : null,
            pickupDeliveryStatus: o.pickupDeliveryStatus
        }))));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
