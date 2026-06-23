const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Tailor = require('./src/models/Tailor');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const seedOrders = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Get/Create a Customer
        let customer = await User.findOne({ role: 'customer' });
        if (!customer) {
            customer = await User.create({
                name: 'Anjali Sharma',
                email: 'anjali@example.com',
                password: 'Password123!',
                phoneNumber: '9876543210',
                role: 'customer',
                isActive: true,
                isVerified: true
            });
        }

        // 2. Get the System Tailor
        const systemTailorProfile = await Tailor.findOne({ shopName: /Silaiwala Central Store/i });
        const systemTailorUser = systemTailorProfile ? await User.findById(systemTailorProfile.user) : null;

        // 3. Get some products
        const products = await Product.find().limit(2);
        if (products.length === 0) {
            console.log('No products found. Run seedStore.js first.');
            process.exit(1);
        }

        // 4. Create Sample Orders
        console.log('Creating Orders...');
        const orders = [
            {
                orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                customer: customer._id,
                tailor: systemTailorUser?._id,
                items: [
                    {
                        product: products[0]._id,
                        quantity: 2,
                        price: products[0].price
                    }
                ],
                totalAmount: products[0].price * 2,
                paymentStatus: 'paid',
                status: 'delivered',
                deliveryAddress: {
                    street: '123, MG Road',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001'
                },
                trackingHistory: [
                    { status: 'pending', message: 'Order placed' },
                    { status: 'accepted', message: 'Tailor accepted your order' },
                    { status: 'delivered', message: 'Package delivered successfully' }
                ]
            },
            {
                orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                customer: customer._id,
                tailor: systemTailorUser?._id,
                items: [
                    {
                        product: products[1]._id,
                        quantity: 1,
                        price: products[1].price
                    }
                ],
                totalAmount: products[1].price,
                paymentStatus: 'pending',
                status: 'accepted',
                deliveryAddress: {
                    street: '45, Park Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400002'
                },
                trackingHistory: [
                    { status: 'pending', message: 'Order placed' },
                    { status: 'accepted', message: 'Order accepted' }
                ]
            }
        ];

        for (const order of orders) {
            // Check if order already exists (unlikely with random IDs but safe)
            await Order.findOneAndUpdate({ orderId: order.orderId }, order, { upsert: true });
        }

        console.log('Orders seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding orders failed:', error);
        process.exit(1);
    }
};

seedOrders();
