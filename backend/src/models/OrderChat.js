const mongoose = require('mongoose');

const orderChatSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderModel: {
        type: String,
        enum: ['Customer', 'Tailor'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index to quickly fetch chats for an order
orderChatSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('OrderChat', orderChatSchema);
