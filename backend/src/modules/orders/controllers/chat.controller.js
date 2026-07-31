const mongoose = require('mongoose');
const Order = require('../../../models/Order');
const OrderChat = require('../../../models/OrderChat');
const ErrorResponse = require('../../../utils/errorResponse');
const asyncHandler = require('../../../utils/asyncHandler');
const { getIO } = require('../../../config/socket');
const { sendNotification } = require('../../../utils/notification');

exports.getOrderChat = asyncHandler(async (req, res, next) => {
    console.log("[getOrderChat] Hit with orderId:", req.params.id);
    console.log("[getOrderChat] User ID:", req.user?.id, "Role:", req.user?.role);
    
    const orderId = req.params.id;
    
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    const order = await Order.findOne(query);

    if (!order) {
        console.log("[getOrderChat] Order not found for id:", orderId);
        return next(new ErrorResponse("Order not found", 404));
    }
    console.log("[getOrderChat] Found order:", order._id);

    // Authorization: User must be either the customer or the tailor of this order
    const isCustomer = order.customer?.toString() === req.user.id;
    const isTailor = order.tailor?.toString() === req.user.id;

    if (!isCustomer && !isTailor) {
        return next(new ErrorResponse("Not authorized to view this chat", 403));
    }

    const messages = await OrderChat.find({ order: order._id })
        .sort({ createdAt: 1 })
        .populate('sender', 'name profileImage');

    // Mark messages as read
    const senderModelToMark = isCustomer ? 'Tailor' : 'Customer';
    await OrderChat.updateMany(
        { order: order._id, senderModel: senderModelToMark, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({
        success: true,
        data: messages
    });
});

exports.sendChatMessage = asyncHandler(async (req, res, next) => {
    const orderId = req.params.id;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
        return next(new ErrorResponse("Message cannot be empty", 400));
    }

    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    const order = await Order.findOne(query);

    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    // Business Logic Constraints
    if (order.status === 'delivered') {
        return next(new ErrorResponse("Chat is no longer available for delivered orders", 403));
    }
    
    if (order.advancePaymentAmount > 0 && order.advancePaymentStatus !== 'paid' && order.paymentStatus !== 'paid') {
        return next(new ErrorResponse("Chat is available only after advance payment is completed", 403));
    }

    const isCustomer = order.customer?.toString() === req.user.id;
    const isTailor = order.tailor?.toString() === req.user.id;

    if (!isCustomer && !isTailor) {
        return next(new ErrorResponse("Not authorized to send messages in this chat", 403));
    }

    const senderModel = isCustomer ? 'Customer' : 'Tailor';

    const newMessage = await OrderChat.create({
        order: order._id,
        sender: req.user.id,
        senderModel,
        message: message.trim()
    });

    const populatedMessage = await OrderChat.findById(newMessage._id).populate('sender', 'name profileImage');

    // Emit socket event
    const io = getIO();
    if (io) {
        io.to(`order_${order._id}`).emit('new_chat_message', populatedMessage);
    }

    // Send push notification to the other party
    const recipient = isCustomer ? order.tailor : order.customer;
    if (recipient) {
        await sendNotification({
            recipient: recipient,
            type: "NEW_MESSAGE",
            title: `New message from ${isCustomer ? 'Customer' : 'Tailor'}`,
            message: populatedMessage.message,
            data: { orderId: order._id, type: 'chat' }
        });
    }

    res.status(201).json({
        success: true,
        data: populatedMessage
    });
});

exports.getUnreadChatCounts = asyncHandler(async (req, res, next) => {
    const unreadMessages = await OrderChat.aggregate([
        { 
            $match: { 
                isRead: false,
                sender: { $ne: new mongoose.Types.ObjectId(req.user.id) }
            } 
        },
        { 
            $group: { 
                _id: "$order", 
                count: { $sum: 1 } 
            } 
        }
    ]);

    const counts = {};
    unreadMessages.forEach(msg => {
        counts[msg._id.toString()] = msg.count;
    });

    res.status(200).json({
        success: true,
        data: counts
    });
});
