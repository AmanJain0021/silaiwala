const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    require('./src/models/User');
    require('./src/models/Product');
    require('./src/models/Order');
    require('./src/models/MeasurementReport');
    const MeasurementRequest = require('./src/models/MeasurementRequest');
    const MeasurementExecutive = require('./src/models/MeasurementExecutive');
    
    try {
      const request = await MeasurementRequest.findById('6a3661f5c693c59f0e5cf0b6')
        .populate("customer", "name phoneNumber profileImage email")
        .populate("tailor", "name phoneNumber profileImage")
        .populate("executive", "name phoneNumber profileImage")
        .populate("order", "orderId totalAmount status items deliveryAddress")
        .lean();
        
      console.log("Request found:", !!request);
      
      const reqUserId = request.executive._id.toString(); // fake req.user.id
      
      const report = await mongoose.model("MeasurementReport").findOne({
        measurementRequest: request._id,
      }).lean();
      
      const profile = await MeasurementExecutive.findOne({ user: reqUserId }).lean();
      let distance = null;
      if (profile?.currentLocation?.coordinates?.length === 2 && request.customerLocation?.coordinates?.length === 2) {
        const [lon1, lat1] = profile.currentLocation.coordinates;
        const [lon2, lat2] = request.customerLocation.coordinates;
        
        // Haversine formula
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = (R * c).toFixed(1);
      }
      
      console.log("Distance calculated:", distance);
      console.log("SUCCESS");
    } catch (err) {
      console.error("ERROR:", err);
    }
    
    process.exit(0);
});
