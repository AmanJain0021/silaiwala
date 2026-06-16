const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
    const profiles = await Delivery.find({});
    console.log(JSON.stringify(profiles.map(p => ({
        id: p._id,
        user: p.user,
        walletBalance: p.walletBalance,
        totalEarned: p.totalEarned
    })), null, 2));
    process.exit(0);
}
check();
