const Order = require('./src/models/Order');
const User = require('./src/models/User');
require('./src/config/db')();

setTimeout(async () => {
    try {
        const order = await Order.findOne({ status: { $in: ['quality-check', 'ready-for-delivery', 'out-for-delivery'] } })
            .select('+pickupDeliveryOtp +dropoffDeliveryOtp')
            .populate("customer", "name phoneNumber")
            .populate("tailor", "name shopName phoneNumber location")
            .populate("deliveryPartner", "name phoneNumber profileImage")
            .populate("pickupPartner", "name phoneNumber profileImage")
            .populate("dropoffPartner", "name phoneNumber profileImage")
            .lean();
        
        console.log("Order ID:", order?._id);
        console.log("deliveryPartner:", JSON.stringify(order?.deliveryPartner, null, 2));
        console.log("dropoffPartner:", JSON.stringify(order?.dropoffPartner, null, 2));
        console.log("pickupPartner:", JSON.stringify(order?.pickupPartner, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}, 2000);
