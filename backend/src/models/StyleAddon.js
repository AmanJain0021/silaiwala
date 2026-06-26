const mongoose = require('mongoose');

const styleAddonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name for the style add-on']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    image: {
        type: String,
        required: [true, 'Please add an image URL']
    },
    category: {
        type: String,
        required: [true, 'Please add the clothing category applicable (e.g., Kurta, Shirt, Suit)']
    },
    referenceImages: {
        left: { type: String, default: '' },
        right: { type: String, default: '' },
        front: { type: String, default: '' },
        back: { type: String, default: '' }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('StyleAddon', styleAddonSchema);
