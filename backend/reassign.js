const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const MeasurementRequest = require('./src/models/MeasurementRequest');
  const yashGuptaId = '6a362fe9ae31de2f21526bfd';
  const req = await MeasurementRequest.findOneAndUpdate(
    { requestId: 'MR1234567890' },
    { executive: yashGuptaId },
    { new: true }
  );
  if (req) {
    console.log('Successfully reassigned to Yash Gupta:', req.executive);
  } else {
    console.log('Request not found');
  }
  process.exit();
}).catch(console.error);
