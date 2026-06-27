const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StyleAddon = require('../src/models/StyleAddon');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const addons = [
    // Floral Embroidery
    { name: 'Rose pattern', category: 'Floral Embroidery', price: 300 },
    { name: 'Leaf pattern', category: 'Floral Embroidery', price: 250 },
    { name: 'Vine design', category: 'Floral Embroidery', price: 350 },
    { name: 'Small flower pattern', category: 'Floral Embroidery', price: 200 },
    { name: 'Full floral work', category: 'Floral Embroidery', price: 800 },

    // Traditional Embroidery
    { name: 'Paisley design', category: 'Traditional Embroidery', price: 400 },
    { name: 'Peacock design', category: 'Traditional Embroidery', price: 600 },
    { name: 'Ethnic motif', category: 'Traditional Embroidery', price: 350 },
    { name: 'Mirror work pattern', category: 'Traditional Embroidery', price: 500 },

    // Geometric Embroidery
    { name: 'Zig-zag', category: 'Geometric Embroidery', price: 250 },
    { name: 'Diamond pattern', category: 'Geometric Embroidery', price: 300 },
    { name: 'Triangle pattern', category: 'Geometric Embroidery', price: 250 },
    { name: 'Line art pattern', category: 'Geometric Embroidery', price: 200 },

    // Border Embroidery
    { name: 'Neck border work', category: 'Border Embroidery', price: 350 },
    { name: 'Sleeve border work', category: 'Border Embroidery', price: 300 },
    { name: 'Bottom border work', category: 'Border Embroidery', price: 400 },
    { name: 'Pocket border work', category: 'Border Embroidery', price: 200 },

    // Thread Work
    { name: 'Simple thread work', category: 'Thread Work', price: 150 },
    { name: 'Multi-color thread work', category: 'Thread Work', price: 350 },
    { name: 'Heavy thread work', category: 'Thread Work', price: 600 },

    // Bead / Decorative Work
    { name: 'Pearl work', category: 'Bead / Decorative Work', price: 450 },
    { name: 'Stone work', category: 'Bead / Decorative Work', price: 550 },
    { name: 'Sequin work', category: 'Bead / Decorative Work', price: 300 },
    { name: 'Bead work', category: 'Bead / Decorative Work', price: 400 },

    // Placement options
    { name: 'Neck embroidery', category: 'Placement options', price: 300 },
    { name: 'Sleeve embroidery', category: 'Placement options', price: 250 },
    { name: 'Front embroidery', category: 'Placement options', price: 500 },
    { name: 'Back embroidery', category: 'Placement options', price: 500 },
    { name: 'Full dress embroidery', category: 'Placement options', price: 1500 }
];

const seedData = addons.map(addon => ({
    ...addon,
    description: `Premium bespoke ${addon.name.toLowerCase()} embroidery designed by expert artisans. Elevate your outfit with intricate detailing.`,
    image: '/images/addons/embroidery_main.png',
    referenceImages: {
        left: '/images/addons/embroidery_left.png',
        right: '/images/addons/embroidery_right.png',
        front: '/images/addons/embroidery_front.png',
        back: '/images/addons/embroidery_back.png'
    },
    isActive: true,
    addonType: 'embroidery'
}));

const seedEmbroideryAddons = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');

        // Clear existing embroidery
        await StyleAddon.deleteMany({ addonType: 'embroidery' });
        console.log('Existing Embroidery Addons cleared...');

        await StyleAddon.insertMany(seedData);
        console.log(`Successfully seeded ${seedData.length} Embroidery Add-ons!`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedEmbroideryAddons();
