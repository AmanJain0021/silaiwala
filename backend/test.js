
const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: { $in: ['admin', 'super-admin', 'superadmin', 'super admin', 'Super Admin'] } });
    if (!admin) { console.log('no admin'); process.exit(1); }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const http = require('http');
    const data = JSON.stringify({ pricing: { gstPercentage: 10 } });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/settings',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Authorization': 'Bearer ' + token }
    };
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => console.log('Response:', res.statusCode, chunks));
    });
    req.on('error', error => console.error(error));
    req.write(data);
    req.end();
    setTimeout(() => process.exit(0), 2000);
}
run();

