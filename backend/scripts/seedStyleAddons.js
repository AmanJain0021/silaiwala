const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StyleAddon = require('../src/models/StyleAddon');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const addons = [
    // Neck / Gaala
    { name: 'Round Neck', category: 'Neck / Gaala', price: 100 },
    { name: 'V Neck', category: 'Neck / Gaala', price: 150 },
    { name: 'Boat Neck', category: 'Neck / Gaala', price: 200 },
    { name: 'Square Neck', category: 'Neck / Gaala', price: 150 },
    { name: 'Collar Neck', category: 'Neck / Gaala', price: 250 },
    { name: 'Mandarin Neck', category: 'Neck / Gaala', price: 300 },

    // Sleeves / Baaju
    { name: 'Full Sleeve', category: 'Sleeves / Baaju', price: 200 },
    { name: 'Half Sleeve', category: 'Sleeves / Baaju', price: 100 },
    { name: 'Puff Sleeve', category: 'Sleeves / Baaju', price: 300 },
    { name: 'Bell Sleeve', category: 'Sleeves / Baaju', price: 250 },
    { name: 'Sleeveless', category: 'Sleeves / Baaju', price: 50 },

    // Cuffs
    { name: 'Button Cuff', category: 'Cuffs', price: 150 },
    { name: 'Fold Cuff', category: 'Cuffs', price: 100 },
    { name: 'Elastic Cuff', category: 'Cuffs', price: 100 },

    // Collar
    { name: 'Chinese Collar', category: 'Collar', price: 200 },
    { name: 'Shirt Collar', category: 'Collar', price: 250 },
    { name: 'Stand Collar', category: 'Collar', price: 200 },

    // Pockets
    { name: 'Side Pocket', category: 'Pockets', price: 100 },
    { name: 'Patch Pocket', category: 'Pockets', price: 150 },
    { name: 'Hidden Pocket', category: 'Pockets', price: 200 },

    // Bottom Style
    { name: 'Straight', category: 'Bottom Style', price: 300 },
    { name: 'Flared', category: 'Bottom Style', price: 400 },
    { name: 'Narrow Fit', category: 'Bottom Style', price: 350 },
    { name: 'Ankle Length', category: 'Bottom Style', price: 300 },

    // Extra Add-ons
    { name: 'Lace Work', category: 'Extra Add-ons', price: 250 },
    { name: 'Buttons', category: 'Extra Add-ons', price: 100 },
    { name: 'Embroidery', category: 'Extra Add-ons', price: 500 },
    { name: 'Border Design', category: 'Extra Add-ons', price: 350 },
    { name: 'Frills', category: 'Extra Add-ons', price: 200 }
];

const seedData = addons.map(addon => ({
    ...addon,
    description: `Premium bespoke ${addon.name.toLowerCase()} design to elevate your garment's style. Meticulously crafted by our expert tailors.`,
    image: '/images/addons/fashion_main.png',
    referenceImages: {
        left: '/images/addons/fashion_left.png',
        right: '/images/addons/fashion_right.png',
        front: '/images/addons/fashion_front.png',
        back: '/images/addons/fashion_back.png'
    },
    isActive: true
}));

const seedStyleAddons = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connected...');

        // Clear existing
        await StyleAddon.deleteMany();
        console.log('Existing Addons cleared...');

        await StyleAddon.insertMany(seedData);
        console.log(`Successfully seeded ${seedData.length} Style Add-ons with reference images!`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedStyleAddons();
