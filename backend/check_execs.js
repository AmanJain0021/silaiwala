const mongoose = require('mongoose');
const MeasurementExecutive = require('./src/models/MeasurementExecutive.js');
const User = require('./src/models/User.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const execs = await MeasurementExecutive.find().populate('user', 'name email').lean();
  console.log("Executives:");
  execs.forEach(e => console.log(e.user?.email, e.availabilityStatus, e.verificationStatus, e.currentLocation));
  process.exit(0);
}
run();
