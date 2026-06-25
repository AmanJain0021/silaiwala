const mongoose = require('mongoose');
const Order = require('./src/models/Order');

mongoose.connect('mongodb+srv://amanjain0021:7oFmB3jDngR2K3xG@silaiwala.o3t1b.mongodb.net/silaiwala?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    const order = await Order.findById('6a326e309b23c011a7d9e8c3');
    console.log("Found order by ID:", order ? "YES" : "NO");
    const bulkOrder = await mongoose.connection.collection('bulkorders').findOne({ _id: new mongoose.Types.ObjectId('6a326e309b23c011a7d9e8c3') });
    console.log("Found in bulkorders:", bulkOrder ? "YES" : "NO");
    
    // Check if the ID matches orderId instead
    const orderByOrderId = await Order.findOne({ orderId: '6a326e309b23c011a7d9e8c3' });
    console.log("Found order by orderId:", orderByOrderId ? "YES" : "NO");
    
    // Get all orders and print their IDs
    const orders = await Order.find().limit(5);
    console.log("Some order IDs:", orders.map(o => ({ _id: o._id.toString(), orderId: o.orderId })));
    process.exit(0);
})
.catch(console.error);
