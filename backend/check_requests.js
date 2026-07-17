const mongoose = require('mongoose');
const MeasurementRequest = require('./src/models/MeasurementRequest.js');
const User = require('./src/models/User.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const requests = await MeasurementRequest.find().lean();
  console.log("All Requests:");
  console.log(JSON.stringify(requests, null, 2));
  
  const execs = await User.find({ role: 'measurement_executive' }).lean();
  console.log("\nExecutives:");
  execs.forEach(e => console.log(e._id, e.email));
  
  process.exit(0);
}
run();
