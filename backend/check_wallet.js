const mongoose = require('mongoose');
const User = require('./src/models/User');
const Delivery = require('./src/models/Delivery');

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    const deliveries = await Delivery.find().populate('user', 'name');
    deliveries.forEach(d => {
        console.log(`Delivery: ${d.user?.name}, Wallet: ${d.walletBalance}, Total Earned: ${d.totalEarned}, Total Deliveries: ${d.totalDeliveries}`);
    });
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
