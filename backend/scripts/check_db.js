const mongoose = require('mongoose'); 
const Order = require('./src/models/Order'); 
const Tailor = require('./src/models/Tailor'); 
const User = require('./src/models/User'); 

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor')
.then(async () => { 
    const order = await Order.findOne({ orderId: { $regex: '39AD63E6', $options: 'i' } }).lean(); 
    console.log('Order:', order?.orderId); 
    console.log('Order tailor ID:', order?.tailor); 
    if (order?.tailor) { 
        const tailorDocUser = await Tailor.findOne({ user: order.tailor }).lean(); 
        console.log('Tailor Doc by user:', tailorDocUser ? 'Found' : 'NOT FOUND'); 
        if (tailorDocUser) console.log('Tailor location:', tailorDocUser.location);
        
        const tailorDocId = await Tailor.findById(order.tailor).lean(); 
        console.log('Tailor Doc by ID:', tailorDocId ? 'Found' : 'NOT FOUND'); 
        if (tailorDocId) console.log('Tailor location:', tailorDocId.location);

        const userDoc = await User.findById(order.tailor).lean(); 
        console.log('User Doc:', userDoc ? 'Found' : 'NOT FOUND'); 
    } 
    process.exit(0); 
})
.catch(console.error);
