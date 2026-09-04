const mongoose = require('mongoose');

const styleAddonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name for the style add-on']
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'All'
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
    },
    addonType: {
        type: String,
        default: 'embellishment'
    },
    customizationType: {
        type: String,
        enum: ['neck', 'sleeve', 'bottom', 'embroidery', 'lacePiping', 'lining', 'other'],
        default: 'neck'
    }
}, { timestamps: true });

module.exports = mongoose.model('StyleAddon', styleAddonSchema);

