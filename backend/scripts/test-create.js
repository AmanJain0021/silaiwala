const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    const Order = require('./src/models/Order');
    const User = require('./src/models/User');
    const MeasurementRequest = require('./src/models/MeasurementRequest');
    
    const order = await Order.findOne({ isMeasurementHome: true });
    const exec = await User.findOne({ role: 'measurement_executive' });
    
    if (!order || !exec) {
        console.log('Missing data');
        process.exit(1);
    }
    
    console.log(`Order: ${order._id}, Exec: ${exec._id}`);
    console.log(`Tailor: ${order.tailor}`);
    
    try {
        const mRequest = await MeasurementRequest.create({
          requestId: `MR${Date.now()}`,
          order: order._id,
          customer: order.customer,
          tailor: order.tailor,
          executive: exec._id,
          status: "assigned"
        });
        console.log("Created successfully:", mRequest._id);
    } catch (e) {
        console.error("Failed to create MeasurementRequest:", e.message);
    }
    
    process.exit(0);
});
