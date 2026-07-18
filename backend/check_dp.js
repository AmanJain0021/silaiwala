const User = require('./src/models/User');
const Order = require('./src/models/Order');
require('./src/config/db')();

setTimeout(async () => {
    try {
        const o = await Order.findOne({ deliveryPartner: { $exists: true, $ne: null } })
            .populate('deliveryPartner pickupPartner dropoffPartner')
            .sort('-updatedAt');
        
        console.log("deliveryPartner:", JSON.stringify(o?.deliveryPartner, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}, 2000);
