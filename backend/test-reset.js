const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    const MeasurementRequest = require('./src/models/MeasurementRequest');
    
    const result = await MeasurementRequest.deleteMany({});
    console.log("Deleted old measurement requests:", result.deletedCount);
    
    const Order = require('./src/models/Order');
    await Order.updateMany({ isMeasurementHome: true }, { $unset: { measurementRequest: "" }, status: 'accepted' });
    console.log("Reset order status to accepted so admin can reassign.");
    
    process.exit(0);
});
