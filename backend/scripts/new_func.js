exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const mongoose = require('mongoose');
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderObjectId,
    paymentType
  } = req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = require('crypto')
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature !== expectedSign) {
    return next(new ErrorResponse('Invalid payment signature', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderObjectId).session(session);
    if (!order) {
      throw new Error('Order not found during verification');
    }

    if (paymentType === 'advance') {
       order.advancePaymentStatus = 'paid';
       order.advancePaymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       
       const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
       let nextStatus = 'in-progress';
       
       if (order.isMeasurementHome) {
           nextStatus = 'measurement-requested';
       } else if (fabricPickupRequired) {
           nextStatus = 'fabric-ready-for-pickup';
       }
       
       order.status = nextStatus;
       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Advance payment of ₹${order.advancePaymentAmount} successful. Order confirmed.`,
       });

       const tailorProfile = await Tailor.findOne({ user: order.tailor }).session(session);
       if (tailorProfile) {
           const Settings = require('../../../models/Settings');
           const settings = await Settings.getSettings();
           const advancePct = settings?.walletConfig?.advancePercentage || 30;
           const tailorTotalEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
           const tailorAdvanceAmount = Math.round(tailorTotalEarning * (advancePct / 100));

           tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorAdvanceAmount;
           await tailorProfile.save({ session });

           await WalletTransaction.create([{
               user: order.tailor,
               amount: tailorAdvanceAmount,
               type: 'credit',
               category: 'advance_payment',
               order: order._id,
               description: `Advance payment received for order ${order.orderId}`
           }], { session });
       }

    } else if (paymentType === 'remaining') {
       order.remainingPaymentStatus = 'paid';
       order.remainingPaymentMethod = 'online';
       order.remainingPaymentId = razorpay_payment_id;
       
       const Settings = require('../../../models/Settings');
       const settings = await Settings.getSettings();
       const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
       const platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
       const deliveryFee = order.deliveryFee || 0; 
       order.platformFee = platformFee;
       order.deliveryFee = deliveryFee;
       
       const tailorEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
       order.tailorEarning = Math.max(tailorEarning, 0);
       order.deliveryPartnerEarning = deliveryFee;
       order.netPlatformEarning = order.totalAmount - order.tailorEarning - deliveryFee - (order.gstAmount || 0);
       order.paidAt = new Date();
       
       order.paymentStatus = 'paid'; 

       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Remaining payment of ₹${order.remainingPaymentAmount} successful.`,
       });

       const ledgerId = `LED-${Date.now().toString(36).toUpperCase()}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;
       await PaymentLedger.create([{
         ledgerId,
         order: order._id,
         orderId: order.orderId,
         customer: order.customer,
         tailor: order.tailor,
         deliveryPartner: order.deliveryPartner || null,
         paymentId: razorpay_payment_id,
         razorpayOrderId: razorpay_order_id,
         transactionId: order.transactionId || ledgerId,
         orderAmount: order.totalAmount - (order.gstAmount || 0) - (order.deliveryFee || 0),
         gstAmount: order.gstAmount || 0,
         gstPercentage: order.gstPercentage || 0,
         deliveryFee: order.deliveryFee || 0,
         platformFee: order.platformFee,
         discountAmount: order.discountAmount || 0,
         couponCode: order.couponCode || null,
         tailorEarning: order.tailorEarning,
         deliveryPartnerEarning: order.deliveryPartnerEarning,
         netPlatformEarning: order.netPlatformEarning,
         totalPaid: order.remainingPaymentAmount || 0,
         paymentType: 'remaining',
         paymentMethod: 'online',
         paymentStatus: 'paid',
         paidAt: new Date(),
       }], { session });

    } else {
       order.paymentStatus = 'paid';
       order.paymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       order.paidAt = new Date();
       order.status = order.items.some(item => item.fabricSource === 'customer') ? 'fabric-ready-for-pickup' : 'in-progress';
       
       const Settings = require('../../../models/Settings');
       const settings = await Settings.getSettings();
       const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
       const platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
       order.platformFee = platformFee;
       
       const tailorEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
       order.tailorEarning = Math.max(tailorEarning, 0);
       order.deliveryPartnerEarning = order.deliveryFee || 0;
       order.netPlatformEarning = order.totalAmount - order.tailorEarning - (order.deliveryFee || 0) - (order.gstAmount || 0);

       const ledgerId = `LED-${Date.now().toString(36).toUpperCase()}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;
       await PaymentLedger.create([{
         ledgerId,
         order: order._id,
         orderId: order.orderId,
         customer: order.customer,
         tailor: order.tailor,
         paymentId: razorpay_payment_id,
         razorpayOrderId: razorpay_order_id,
         transactionId: order.transactionId || ledgerId,
         orderAmount: order.totalAmount - (order.gstAmount || 0) - (order.deliveryFee || 0),
         gstAmount: order.gstAmount || 0,
         gstPercentage: order.gstPercentage || 0,
         deliveryFee: order.deliveryFee || 0,
         platformFee: order.platformFee,
         discountAmount: order.discountAmount || 0,
         couponCode: order.couponCode || null,
         tailorEarning: order.tailorEarning,
         deliveryPartnerEarning: order.deliveryPartnerEarning,
         netPlatformEarning: order.netPlatformEarning,
         totalPaid: order.totalAmount,
         paymentType: 'full',
         paymentMethod: 'online',
         paymentStatus: 'paid',
         paidAt: new Date(),
       }], { session });
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Side Effects
    const { sendNotification } = require('../../../utils/notification');
    const { getIO } = require('../../../config/socket');
    
    if (paymentType === 'advance') {
       const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
       sendNotification({
           recipient: order.tailor,
           type: 'ORDER_CREATED',
           title: 'Advance Paid - Start Order!',
           message: `Customer has paid the advance for ${order.orderId}. ${fabricPickupRequired ? 'Wait for fabric delivery.' : 'You can start processing.'}`,
           data: { orderId: order._id, targetUrl: '/orders' }
       }).catch(()=>{});
    } else if (paymentType === 'remaining') {
       sendNotification({
           recipient: order.tailor,
           type: 'PAYMENT_COMPLETED',
           title: 'Final Payment Received',
           message: `Customer has paid the remaining balance for ${order.orderId}.`,
           data: { orderId: order._id, targetUrl: '/orders' }
       }).catch(()=>{});
    }

    sendNotification({
        recipient: order.customer,
        type: 'PAYMENT_SUCCESS',
        title: 'Order Placed Successfully!',
        message: `Your payment for order ${order.orderId} was successful. Our tailor will start working on it soon.`,
        data: { orderId: order._id, targetUrl: '/profile/orders' }
    }).catch(()=>{});

    const io = getIO();
    if (io) {
        io.to(`user_${order.tailor}`).emit('order_status_updated', {
            orderId: order.orderId,
            status: order.status
        });
        if (paymentType === 'advance' || paymentType === 'full') {
            io.to(`user_${order.tailor}`).emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status
            });
        }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order updated successfully',
      data: order
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Payment Verification Transaction Failed:', error);
    return next(new ErrorResponse(error.message || 'Payment processing failed. Please contact support.', 500));
  }
});
