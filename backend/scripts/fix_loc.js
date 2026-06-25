const mongoose = require('mongoose');
require('dotenv').config();
const Tailor = require('./src/models/Tailor');

async function fixLoc() {
    await mongoose.connect(process.env.MONGO_URI);
    // Setting John Deo to Indore coordinates for testing
    await Tailor.updateOne(
        { shopName: /John/i }, 
        { $set: { "location.coordinates": [75.8577, 22.72] } }
    );
    console.log("Updated John Deo location to Indore [75.8577, 22.72]");
    process.exit(0);
}
fixLoc();
