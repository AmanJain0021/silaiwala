require('dotenv').config();
const mongoose = require('mongoose');

console.log("Connecting to:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Order = mongoose.model('Order', new mongoose.Schema({status: String, deliveryPartner: mongoose.Schema.Types.ObjectId, isRework: Boolean}, {strict: false, collection: 'orders'}));
    const total = await Order.countDocuments({deliveryPartner: null, isRework: {$ne: true}});
    console.log('unassigned count (isRework!=true, deliveryPartner=null):', total);
    
    const activeUnassigned = await Order.countDocuments({
        deliveryPartner: null, 
        isRework: {$ne: true}, 
        status: {$nin: ['delivered', 'cancelled', 'order-completed', 'product-delivered', 'failed-delivery']}
    });
    console.log('active unassigned:', activeUnassigned);
    
    const deliveries = await mongoose.model('Delivery', new mongoose.Schema({totalDeliveries: Number}, {strict: false, collection: 'deliveries'})).aggregate([
        {$group: {_id: null, total: {$sum: '$totalDeliveries'}}}
    ]);
    console.log('total deliveries (from Delivery models):', deliveries);

    const activePartners = await mongoose.model('Delivery').countDocuments({ isAvailable: true });
    console.log('active partners:', activePartners);

    const deliveredOrders = await Order.countDocuments({status: {$in: ['delivered', 'product-delivered', 'order-completed']}});
    console.log('delivered orders:', deliveredOrders);
    
    process.exit(0);
});
