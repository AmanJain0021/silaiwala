const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require("../models/User.js");
const Tailor = require("../models/Tailor.js");
const Category = require("../models/Category.js");
const Service = require("../models/Service.js");

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        console.log('Cleaning up existing dummy data...');
        const dummyUsers = await User.find({ email: { $in: ['royal@example.com', 'elite@example.com', 'rejected@example.com'] } });
        const dummyUserIds = dummyUsers.map(u => u._id);
        await Tailor.deleteMany({ user: { $in: dummyUserIds } });
        await User.deleteMany({ _id: { $in: dummyUserIds } });
        // Also check by phone in case of leftovers
        await User.deleteMany({ phoneNumber: { $in: ['9876543210', '9876543211', '9876543212'] } });

        console.log('Checking categories...');
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            await Category.insertMany([
                { name: 'Bridal Wear', description: 'Wedding dresses', type: 'service' },
                { name: 'Formal Suits', description: 'Suits and blazers', type: 'service' },
                { name: 'Casual Wear', description: 'Daily wear', type: 'service' }
            ]);
            console.log('Categories created.');
        }

        const categories = await Category.find();
        const bridalCat = categories.find(c => c.name === 'Bridal Wear');

        // 2. Helper to create tailor
        const createTailor = async (email, name, shopName, phone, status) => {
            console.log(`Processing tailor: ${email}`);
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    name,
                    email,
                    phoneNumber: phone,
                    password: 'password123',
                    role: 'tailor',
                    isVerified: true
                });
                await user.save();
                console.log(`User created: ${email}`);
            } else {
                // Update password anyway to be sure
                user.password = 'password123';
                await user.save();
                console.log(`User updated: ${email}`);
            }

            let tailor = await Tailor.findOne({ user: user._id });
            if (!tailor) {
                tailor = new Tailor({
                    user: user._id,
                    shopName,
                    bio: `Professional tailoring by ${name}`,
                    specializations: ['Bridal Wear'],
                    experienceInYears: 10,
                    location: {
                        type: 'Point',
                        coordinates: [72.8777, 19.0760],
                        address: 'Bandra, Mumbai'
                    },
                    documents: [
                        { 
                            name: 'Aadhar', 
                            status: status, 
                            url: 'https://example.com/doc.jpg',
                            remarks: status === 'rejected' ? 'Aadhar card is expired.' : ''
                        }
                    ]
                });
                await tailor.save();
                console.log(`Tailor profile created: ${shopName}`);
            } else {
                console.log(`Tailor profile already exists: ${shopName}`);
            }
        };

        await createTailor('royal@example.com', 'Royal Owner', 'Royal Stitches', '9876543210', 'verified');
        await createTailor('elite@example.com', 'Elite Owner', 'Elite Tailors', '9876543211', 'pending');
        await createTailor('rejected@example.com', 'Rejected Owner', 'Rejected Stitches', '9876543212', 'rejected');

        // 3. SEED DUMMY ORDERS for Royal Stitches
        console.log('Seeding dummy orders...');
        const royalUser = await User.findOne({ email: 'royal@example.com' });
        
        // Create a dummy customer
        let customer = await User.findOne({ email: 'customer@example.com' });
        if (!customer) {
            customer = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                phoneNumber: '9000000001',
                password: 'password123',
                role: 'customer'
            });
            await customer.save();
        }

        const Order = require("../models/Order.js");
        await Order.deleteMany({ tailor: royalUser._id });
        await Order.deleteMany({ orderId: { $in: ['ORD-101', 'ORD-102', 'ORD-103'] } });
        
        const orders = [
            {
                orderId: 'ORD-101',
                customer: customer._id,
                tailor: royalUser._id,
                totalAmount: 4500,
                status: 'pending',
                paymentStatus: 'paid',
                items: [{ quantity: 1, price: 4500 }]
            },
            {
                orderId: 'ORD-102',
                customer: customer._id,
                tailor: royalUser._id,
                totalAmount: 2200,
                status: 'accepted',
                paymentStatus: 'paid',
                items: [{ quantity: 1, price: 2200 }],
                acceptedAt: new Date()
            },
            {
                orderId: 'ORD-103',
                customer: customer._id,
                tailor: royalUser._id,
                totalAmount: 6800,
                status: 'delivered',
                paymentStatus: 'paid',
                items: [{ quantity: 1, price: 6800 }],
                acceptedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
                deliveredAt: new Date(Date.now() - 86400000) // 1 day ago
            }
        ];

        await Order.insertMany(orders);
        console.log('Dummy orders seeded for Royal Stitches.');

        // 4. SEED DUMMY SERVICES for Royal Stitches
        console.log('Seeding dummy services...');
        await Service.deleteMany({ tailor: royalUser._id });

        const royalTailor = await Tailor.findOne({ user: royalUser._id });
        const serviceCat = categories.find(c => c.type === 'service') || categories[0];

        const services = [
            {
                title: 'Custom Kurti Stitching',
                description: 'Perfect fit with your choice of neck & sleeve design. Includes lining.',
                basePrice: 499,
                deliveryTime: '3-15 Days',
                category: serviceCat._id,
                tailor: royalTailor._id,
                tags: ['Popular', 'Express'],
                isPickupAvailable: true,
                rating: 4.8,
                reviewsCount: 12
            },
            {
                title: 'Designer Blouse',
                description: 'Intricate embroidery, padding options, and latkan customization.',
                basePrice: 899,
                deliveryTime: '5-7 Days',
                category: serviceCat._id,
                tailor: royalTailor._id,
                tags: ['Wedding', 'Handwork'],
                isPickupAvailable: true,
                rating: 4.9,
                reviewsCount: 25
            },
            {
                title: 'Salwar Kameez Set',
                description: 'Complete set stitching with salwar, pants, or palazzo options.',
                basePrice: 1200,
                deliveryTime: '4-8 Days',
                category: serviceCat._id,
                tailor: royalTailor._id,
                tags: ['New'],
                isPickupAvailable: true,
                rating: 4.7,
                reviewsCount: 8
            },
            {
                title: 'Lehenga Choli',
                description: 'Heavy bridal & party wear lehenga stitching with can-can.',
                basePrice: 2500,
                deliveryTime: '7-10 Days',
                category: serviceCat._id,
                tailor: royalTailor._id,
                tags: ['Premium', 'Bridal'],
                isPickupAvailable: true,
                rating: 5.0,
                reviewsCount: 15
            }
        ];

        await Service.insertMany(services);
        console.log('Dummy services seeded for Royal Stitches.');

        console.log('Seeding finished!');
        process.exit(0);
    } catch (error) {
        console.error('SEEDING ERROR:', error);
        if (error.errors) {
            console.error('Detailed Validation Errors:', JSON.stringify(error.errors, null, 2));
        }
        process.exit(1);
    }
};

seedData();
