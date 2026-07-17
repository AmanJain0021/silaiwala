const mongoose = require('mongoose');
const MeasurementRequest = require('./src/models/MeasurementRequest.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const mr = await MeasurementRequest.findOne({ requestId: 'MR1784288665239' });
  if (mr) {
    mr.executive = '6a362fe9ae31de2f21526bfd'; // yash123@gmail.com
    await mr.save();
    console.log("Successfully reassigned to yash123@gmail.com");
  } else {
    console.log("Not found");
  }
  process.exit(0);
}
run();
