const mongoose = require('mongoose');

require('dotenv').config();

async function syncWallets() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const orders = await db.collection('orders').find({ status: { $in: ['delivered', 'fabric-delivered', 'fabric-received'] } }).toArray();
  
  console.log('Orders found:', orders.length);
  for (let order of orders) {
    const partnerId = order.deliveryPartner || order.dropoffPartner || order.pickupPartner;
    if (!partnerId) continue;
    
    let earnings = order.deliveryEarnings || order.deliveryFee || 0;
    
    if (earnings > 0) {
      // Check if already credited
      const existingTx = await db.collection('wallettransactions').findOne({
        user: partnerId,
        order: order._id,
      });
      
      if (!existingTx) {
        console.log(`Crediting ${earnings} to ${partnerId} for order ${order._id}`);
        await db.collection('wallettransactions').insertOne({
          user: partnerId,
          amount: earnings,
          type: "credit",
          category: "delivery_earnings",
          order: order._id,
          description: `Delivery payout for existing order`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await db.collection('deliveries').updateOne(
          { user: partnerId },
          { $inc: { walletBalance: earnings, totalEarned: earnings, totalDeliveries: 1 } }
        );
      }
    }
  }
  process.exit(0);
}

syncWallets().catch(console.error);
