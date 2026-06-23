const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Tailor = require('./src/models/Tailor');
const User = require('./src/models/User');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        // 1. Ensure we have an Admin/System Tailor to assign products to
        let systemTailor = await User.findOne({ email: 'admin@silaiwala.com' });
        if (!systemTailor) {
            console.log('Creating System Admin User...');
            systemTailor = await User.create({
                name: 'Silaiwala Admin',
                email: 'admin@silaiwala.com',
                password: 'Password123!',
                phoneNumber: '0000000000',
                role: 'admin',
                isActive: true,
                isVerified: true
            });
        }

        let tailorProfile = await Tailor.findOne({ user: systemTailor._id });
        if (!tailorProfile) {
            console.log('Creating System Tailor Profile...');
            tailorProfile = await Tailor.create({
                user: systemTailor._id,
                shopName: 'Silaiwala Central Store',
                status: 'APPROVED',
                isVerified: true,
                location: {
                    type: 'Point',
                    coordinates: [72.8777, 19.0760] // Mumbai for default
                }
            });
        }

        // 2. Create Product Categories
        console.log('Creating Categories...');
        const categories = [
            { name: 'Fabrics', description: 'Premium quality dress materials', type: 'product' },
            { name: 'Readymade', description: 'Finished garments ready to wear', type: 'product' },
            { name: 'Accessories', description: 'Trimmings and sewing supplies', type: 'product' },
            { name: 'Laces', description: 'Beautiful borders for suits', type: 'product' }
        ];

        for (const cat of categories) {
            await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
        }

        const dbCategories = await Category.find({ type: 'product' });
        const fabricCat = dbCategories.find(c => c.name === 'Fabrics');
        const readymadeCat = dbCategories.find(c => c.name === 'Readymade');

        // 3. Create Sample Products
        console.log('Creating Products...');
        const products = [
            {
                name: 'Silk Cotton Fabric - Blue',
                description: 'Soft and breathable silk cotton blend with beautiful floral prints.',
                price: 450,
                originalPrice: 600,
                stock: 50,
                category: fabricCat._id,
                tailor: tailorProfile._id,
                image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=200',
                productType: 'fabric'
            },
            {
                name: 'Premium Banarasi Silk',
                description: 'Authentic Banarasi silk fabric for wedding wear.',
                price: 1200,
                originalPrice: 1500,
                stock: 20,
                category: fabricCat._id,
                tailor: tailorProfile._id,
                image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=200',
                productType: 'fabric'
            },
            {
                name: 'White Chikankari Kurta',
                description: 'Handcrafted Lucknowi Chikankari kurta on premium cotton.',
                price: 850,
                originalPrice: 1200,
                stock: 15,
                category: readymadeCat._id,
                tailor: tailorProfile._id,
                image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=200',
                productType: 'store_item'
            }
        ];

        for (const prod of products) {
            await Product.findOneAndUpdate({ name: prod.name }, prod, { upsert: true });
        }

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
