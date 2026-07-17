const mongoose = require('mongoose');
const MeasurementExecutive = require('./src/models/MeasurementExecutive.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Set the other executive offline
  const exec = await MeasurementExecutive.findOne({ user: '6a439a7832952a710febfc50' }); // dffg@gmmdsyi.vom
  if (exec) {
    exec.availabilityStatus = 'offline';
    await exec.save();
    console.log("Set dffg@gmmdsyi.vom to OFFLINE.");
  }
  
  process.exit(0);
}
run();
