const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    require('./src/models/User');
    const Order = require('./src/models/Order');
    const Tailor = require('./src/models/Tailor');
    const Delivery = require('./src/models/Delivery');

    const order = await Order.findOne({orderId: 'ORD-BCDA777C'});
    const tailorProfile = await Tailor.findOne({ user: order.tailor });
    
    let nearestRider = null;
    try {
        const nearbyRiders = await Delivery.find({
            isAvailable: true,
            currentLocation: {
                $near: {
                    $geometry: tailorProfile.location,
                    $maxDistance: 15000
                }
            }
        }).populate("user").limit(1);
        if (nearbyRiders.length > 0) nearestRider = nearbyRiders[0];
    } catch (geoError) {
        console.log("geo error:", geoError.message);
        nearestRider = await Delivery.findOne({ isAvailable: true }).populate("user");
    }

    try {
        if (nearestRider && nearestRider.user) {
            console.log("Assigning rider:", nearestRider.user._id);
            order.deliveryPartner = nearestRider.user._id;
            order.deliveryStatus = 'assigned';
            order.assignedAt = new Date();
            order.trackingHistory.push({
                status: "delivery-assigned",
                message: "Delivery partner auto-assigned for fabric pickup.",
                timestamp: new Date()
            });
            await order.save();
            console.log("Save successful!");
        } else {
            console.log("No valid rider found.");
        }
    } catch (err) {
        console.log("Save error:", err.message);
    }
    process.exit(0);
});
