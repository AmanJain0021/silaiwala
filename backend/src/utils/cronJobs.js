const cron = require('node-cron');
const Order = require("../models/Order.js");
const { sendNotification } = require("./notification.js");
const { isRedisEnabled, getRedisClient } = require("../config/redis.js");

const initCronJobs = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            // ── Distributed lock (prevents duplicate runs across multiple instances) ──
            if (isRedisEnabled) {
                try {
                    const redisClient = getRedisClient();
                    if (redisClient) {
                        // 4-minute TTL — shorter than the 5-minute interval so it always
                        // expires before the next tick. NX = only set if not already held.
                        const acquired = await redisClient.set(
                            'cron-lock:tailor-timeout-check',
                            '1',
                            'PX',
                            4 * 60 * 1000,
                            'NX'
                        );
                        if (!acquired) {
                            console.log('⏭️  [Cron] tailor-timeout-check skipped — lock held by another instance');
                            return;
                        }
                    }
                } catch (lockErr) {
                    // Redis error acquiring lock — run the job anyway (single-instance-safe fallback)
                    console.warn(`⚠️  [Cron] Redis lock error — ${lockErr.message}. Running job without lock.`);
                }
            }

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

    // Run every 2 minutes to check for stuck delivery assignments
    cron.schedule('*/2 * * * *', async () => {
        try {
            if (isRedisEnabled) {
                try {
                    const redisClient = getRedisClient();
                    if (redisClient) {
                        const acquired = await redisClient.set(
                            'cron-lock:delivery-timeout-check',
                            '1',
                            'PX',
                            90 * 1000, // 90 seconds TTL
                            'NX'
                        );
                        if (!acquired) {
                            return;
                        }
                    }
                } catch (lockErr) {
                    console.warn(`⚠️ [Cron] Redis lock error for delivery check — ${lockErr.message}. Running fallback.`);
                }
            }

            const { checkStuckDeliveryAssignments } = require("./deliveryAssignment.js");
            await checkStuckDeliveryAssignments();
        } catch (error) {
            console.error('❌ Error in delivery assignment cron job:', error);
        }
    });

    console.log('⏰ Cron jobs initialized.');
};

module.exports = { initCronJobs };
