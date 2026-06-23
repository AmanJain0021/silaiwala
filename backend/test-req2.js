require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    // Generate JWT token for customer 6a1aa9846b5a658daae77587
    const token = jwt.sign({ id: '6a1aa9846b5a658daae77587', role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/orders/6a36565a63ccad1a7c775488',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            const parsed = JSON.parse(data);
            console.log("Success:", parsed.success);
            console.log("measurementOtp:", parsed.data.measurementOtp);
            console.log("order.isMeasurementHome:", parsed.data.isMeasurementHome);
            process.exit(0);
        });
    });
    
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });
    
    req.end();
});
