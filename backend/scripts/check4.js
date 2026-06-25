const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
    const result = await Delivery.updateMany({}, { $set: { walletBalance: 78, totalEarned: 78 } });
    console.log('Updated:', result.modifiedCount);
    process.exit(0);
}
fix();
