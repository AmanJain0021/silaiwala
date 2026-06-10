const cron = require('node-cron');
const Order = require('../models/Order');
const { sendNotification } = require('./notification');

const initCronJobs = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('⏳ Running tailor timeout check...');
            
            // Timeout duration: 30 minutes
            const TIMEOUT_MS = 30 * 60 * 1000;
            const timeoutThreshold = new Date(Date.now() - TIMEOUT_MS);

            // Find orders that are pending, haven't been notified yet, and are older than 30 mins
            const stuckOrders = await Order.find({
                status: 'pending',
                tailorTimeoutNotified: false,
                createdAt: { $lt: timeoutThreshold }
            });

            if (stuckOrders.length > 0) {
                console.log(`⚠️ Found ${stuckOrders.length} orders exceeding tailor acceptance timeout.`);
                
                for (const order of stuckOrders) {
                    // Send notification to customer
                    await sendNotification({
                        recipient: order.customer,
                        type: "TAILOR_TIMEOUT",
                        title: "Tailor is taking time",
                        message: `The assigned tailor is taking longer than expected for order ${order.orderId}. Would you like to change the tailor?`,
                        data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
                    });

                    // Update order to prevent duplicate notifications
                    order.tailorTimeoutNotified = true;
                    await order.save();
                }
            }
        } catch (error) {
            console.error('❌ Error in tailor timeout cron job:', error);
        }
    });

    console.log('⏰ Cron jobs initialized.');
};

module.exports = { initCronJobs };
