const http = require('http');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/silaiwala').then(async () => {
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find an order
    const order = await Order.findOne({ isMeasurementHome: true }) || await Order.findOne({});
    // Find Ramesh
    const exec = await User.findOne({ role: 'measurement_executive' });
    
    if (!order || !exec) {
        console.log('Missing data');
        process.exit(1);
    }
    
    console.log(`Order: ${order._id}, Exec: ${exec._id}`);
    
    // Find admin user for auth
    const admin = await User.findOne({ role: 'admin' });
    
    // Actually we can just call the controller directly to see the exact error
    const adminController = require('./src/modules/admin/controllers/admin.controller.js');
    
    const req = {
        params: { id: order._id.toString() },
        body: { measurementExecutive: exec._id.toString() }
    };
    
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log('Response:', this.statusCode, data);
            process.exit(0);
        }
    };
    
    try {
        await adminController.updateOrderStatus(req, res);
    } catch (e) {
        console.error('Controller threw error:', e);
        process.exit(1);
    }
});
