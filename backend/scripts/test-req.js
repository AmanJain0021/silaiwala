require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    const MeasurementRequest = require('./src/models/MeasurementRequest');
    const reqData = await MeasurementRequest.findById('6a3661f5c693c59f0e5cf0b6').lean();
    
    if (!reqData) {
        console.log("Request not found!");
        process.exit(1);
    }
    
    const executiveUserId = reqData.executive.toString();
    console.log("Executive User ID:", executiveUserId);
    
    // Generate JWT token
    const token = jwt.sign({ id: executiveUserId, role: 'measurement_executive' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/measurement-executive/requests/6a3661f5c693c59f0e5cf0b6',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    const req = http.request(options, (res) => {
        console.log('STATUS:', res.statusCode);
        console.log('HEADERS:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('BODY LENGTH:', data.length);
            if (res.statusCode !== 200 && res.statusCode !== 304) {
                console.log('BODY:', data);
            } else {
                console.log('BODY PREFIX:', data.substring(0, 500));
            }
            process.exit(0);
        });
    });
    
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });
    
    req.end();
});
