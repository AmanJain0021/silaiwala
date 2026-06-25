const fs = require('fs');
const path = 'C:\\Users\\amanj\\OneDrive\\silaiwala1\\silaiwala\\backend\\src\\modules\\orders\\controllers\\order.controller.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Import transitionOrder
if (!content.includes('const { transitionOrder }')) {
    content = content.replace(
        'const razorpay = require("../../../config/razorpay");',
        'const razorpay = require("../../../config/razorpay");\nconst { transitionOrder } = require("../../../utils/orderStateMachine");'
    );
}

// 2. Fix State Machine in verifyPayment (Advance)
content = content.replace(
    /order\.status = nextStatus;\s*order\.trackingHistory\.push\(\{\s*status: order\.status,\s*timestamp: new Date\(\),\s*message: `Advance payment of ₹\$\{order\.advancePaymentAmount\} successful\. Order confirmed\.`,\s*\}\);/g,
    'transitionOrder(order, nextStatus, `Advance payment of ₹${order.advancePaymentAmount} successful. Order confirmed.`, true);'
);

// 3. Fix State Machine in verifyPayment (Remaining)
content = content.replace(
    /order\.trackingHistory\.push\(\{\s*status: order\.status,\s*timestamp: new Date\(\),\s*message: `Remaining payment of ₹\$\{order\.remainingPaymentAmount\} successful\.`,\s*\}\);/g,
    'transitionOrder(order, order.status, `Remaining payment of ₹${order.remainingPaymentAmount} successful.`, true);'
);

// 4. Fix State Machine in verifyPayment (Legacy Full Upfront)
content = content.replace(
    /order\.status = order\.items\.some\(item => item\.fabricSource === 'customer'\) \? 'fabric-ready-for-pickup' : 'in-progress';/g,
    `const legacyNextStatus = order.items.some(item => item.fabricSource === 'customer') ? 'fabric-ready-for-pickup' : 'in-progress';\n       transitionOrder(order, legacyNextStatus, 'Full upfront payment received', true);`
);

// 5. Fix State Machine in updateDeliveryPreference (Self)
content = content.replace(
    /order\.status = 'waiting-for-customer-dropoff';\s*order\.trackingHistory\.push\(\{\s*status: order\.status,\s*timestamp: new Date\(\),\s*message: "Customer opted for self delivery of fabric\.",\s*\}\);/g,
    `transitionOrder(order, 'waiting-for-customer-dropoff', "Customer opted for self delivery of fabric.");`
);

// 6. Fix State Machine in updateDeliveryPreference (Partner)
content = content.replace(
    /order\.status = 'fabric-ready-for-pickup';/g,
    `transitionOrder(order, 'fabric-ready-for-pickup', "Customer requested partner for fabric pickup.");`
);

// 7. Fix State Machine in confirmMeasurements
content = content.replace(
    /order\.status = 'measurements-approved';\s*order\.trackingHistory\.push\(\{\s*status: 'measurements-approved',\s*message: 'Customer approved the measurements',\s*timestamp: new Date\(\)\s*\}\);/g,
    `transitionOrder(order, 'measurements-approved', 'Customer approved the measurements');`
);

// 8. Fix State Machine in requestMeasurementRevision
content = content.replace(
    /order\.status = 'measurement-revision-required';\s*order\.trackingHistory\.push\(\{\s*status: 'measurement-revision-required',\s*message: `Customer requested revision: \$\{reason\}`,\s*timestamp: new Date\(\)\s*\}\);/g,
    `transitionOrder(order, 'measurement-revision-required', \`Customer requested revision: \${reason}\`);`
);

// --- NOW RESTORE H5 AND H6 FIXES ---

// Fix Tailor Advance Transaction (H6 + H5)
const tailorAdvanceOld = `tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorAdvanceAmount;
               await tailorProfile.save();

               await WalletTransaction.create({
                   user: order.tailor,
                   amount: tailorAdvanceAmount,
                   type: "credit",
                   category: "advance_payment",
                   order: order._id,
                   description: \`Advance payment received for order \${order.orderId}\`
               });
               console.log(\`Credited ₹\${tailorAdvanceAmount} advance to Tailor \${order.tailor}\`);`;

const tailorAdvanceNew = `const mongoose = require("mongoose");
               const session = await mongoose.startSession();
               session.startTransaction();
               try {
                   await Tailor.findOneAndUpdate(
                       { user: order.tailor },
                       { $inc: { walletBalance: tailorAdvanceAmount } },
                       { session }
                   );

                   await WalletTransaction.create([{
                       user: order.tailor,
                       amount: tailorAdvanceAmount,
                       type: "credit",
                       category: "advance_payment",
                       order: order._id,
                       description: \`Advance payment received for order \${order.orderId}\`
                   }], { session });

                   await session.commitTransaction();
                   console.log(\`Credited ₹\${tailorAdvanceAmount} advance to Tailor \${order.tailor}\`);
               } catch (txnErr) {
                   await session.abortTransaction();
                   throw txnErr;
               } finally {
                   session.endSession();
               }`;

content = content.replace(tailorAdvanceOld, tailorAdvanceNew);

// Fix Referral Flow Transaction (H6 + H5)
const refOld = `const customerProfile = await Customer.findOne({ user: order.customer });
    if (customerProfile && customerProfile.totalOrders === 0) {
        // If referred by someone, give them both a bonus
        if (customerProfile.referredBy) {
            const referrerProfile = await Customer.findOne({ user: customerProfile.referredBy });
            if (referrerProfile) {
                const REFERRER_BONUS = 50;
                const CUSTOMER_BONUS = 25;

                // 1. Reward Referrer
                referrerProfile.walletBalance += REFERRER_BONUS;
                referrerProfile.referralEarnings += REFERRER_BONUS;
                await referrerProfile.save();

                await WalletTransaction.create({
                    user: referrerProfile.user,
                    amount: REFERRER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: \`Bonus for referring \${customerProfile.user.name || 'a new user'}\`
                });

                // 2. Reward New Customer
                customerProfile.walletBalance += CUSTOMER_BONUS;
                await WalletTransaction.create({
                    user: customerProfile.user,
                    amount: CUSTOMER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: "Welcome bonus from referral"
                });
            }
        }
        customerProfile.totalOrders = 1;
        await customerProfile.save();
    } else if (customerProfile) {
        customerProfile.totalOrders += 1;
        await customerProfile.save();
    }`;

const refNew = `const mongoose = require("mongoose");
    const refSession = await mongoose.startSession();
    refSession.startTransaction();
    try {
        const customerProfile = await Customer.findOne({ user: order.customer }).session(refSession);
        if (customerProfile && customerProfile.totalOrders === 0) {
            if (customerProfile.referredBy) {
                const referrerProfile = await Customer.findOne({ user: customerProfile.referredBy }).session(refSession);
                if (referrerProfile) {
                    const REFERRER_BONUS = 50;
                    const CUSTOMER_BONUS = 25;

                    await Customer.findOneAndUpdate(
                        { user: customerProfile.referredBy },
                        { $inc: { walletBalance: REFERRER_BONUS, referralEarnings: REFERRER_BONUS } },
                        { session: refSession }
                    );

                    await WalletTransaction.create([{
                        user: referrerProfile.user,
                        amount: REFERRER_BONUS,
                        type: "credit",
                        category: "referral_bonus",
                        description: \`Bonus for referring \${customerProfile.user.name || 'a new user'}\`
                    }], { session: refSession });

                    await Customer.findOneAndUpdate(
                        { user: order.customer },
                        { $inc: { walletBalance: CUSTOMER_BONUS } },
                        { session: refSession }
                    );
                    await WalletTransaction.create([{
                        user: order.customer,
                        amount: CUSTOMER_BONUS,
                        type: "credit",
                        category: "referral_bonus",
                        description: "Welcome bonus from referral"
                    }], { session: refSession });
                }
            }
            await Customer.findOneAndUpdate(
                { user: order.customer },
                { $set: { totalOrders: 1 } },
                { session: refSession }
            );
        } else if (customerProfile) {
            await Customer.findOneAndUpdate(
                { user: order.customer },
                { $inc: { totalOrders: 1 } },
                { session: refSession }
            );
        }
        await refSession.commitTransaction();
    } catch (refErr) {
        await refSession.abortTransaction();
        console.error("Failed to process referral bonus:", refErr);
    } finally {
        refSession.endSession();
    }`;

content = content.replace(refOld, refNew);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated order.controller.js successfully.");
