const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const MeasurementRequest = require('./src/models/MeasurementRequest');
  const reqs = await MeasurementRequest.find({ status: { $in: ['otp_sent', 'measurements_uploaded', 'accepted'] } }).select('+otp');
  console.log('OTP sent requests:');
  for (const r of reqs) {
    console.log(`Order: ${r.order}, Status: ${r.status}, OTP: ${r.otp}`);
  }
  if (reqs.length === 0) console.log('None found.');
  process.exit();
}).catch(console.error);
