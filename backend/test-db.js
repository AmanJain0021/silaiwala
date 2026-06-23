const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor').then(async () => {
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false, collection: 'orders' }));
    const orders = await Order.find({ trackingHistory: { $elemMatch: { message: /measurement/i } } });
    console.log("Orders with measurement in tracking:", orders.map(o => o._id));
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const execs = await User.find({ role: 'measurement_executive' });
    console.log("Execs:", execs.map(e => e._id));
    
    process.exit(0);
});
