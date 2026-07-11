const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require("../models/User.js");
const Delivery = require("../models/Delivery.js");
const Order = require("../models/Order.js");

const seedDeliveryData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        console.log('Cleaning up existing delivery dummy data...');
        // Find existing dummy delivery users
        const dummyEmails = ['delivery@example.com', 'rider@example.com'];
        const dummyUsers = await User.find({ email: { $in: dummyEmails } });
        const dummyUserIds = dummyUsers.map(u => u._id);

        await Delivery.deleteMany({ user: { $in: dummyUserIds } });
        await User.deleteMany({ _id: { $in: dummyUserIds } });

        // 1. Create a Delivery Partner User
        console.log('Creating delivery partner user...');
        const deliveryUser = new User({
            name: 'Vikram Singh',
            email: 'delivery@example.com',
            phoneNumber: '9888888888',
            password: 'password123',
            role: 'delivery',
            isVerified: true
        });
        await deliveryUser.save();

        // 2. Create Delivery Profile
        console.log('Creating delivery profile...');
        const deliveryProfile = new Delivery({
            user: deliveryUser._id,
            vehicleType: 'bike',
            vehicleNumber: 'MH-02-AB-1234',
            isAvailable: true,
            currentLocation: {
                type: 'Point',
                coordinates: [72.8777, 19.0760] // Mumbai
            },
            bankDetails: {
                accountName: 'Vikram Singh',
                bankName: 'ICICI Bank',
                accountNumber: '554433221100',
                ifscCode: 'ICIC0001234'
            },
            rating: 4.8,
            totalDeliveries: 12
        });
        await deliveryProfile.save();

        // 3. Find some existing tailors and customers to link orders
        console.log('Fetching dependencies for orders...');
        const tailorUser = await User.findOne({ role: 'tailor' });
        const customerUser = await User.findOne({ role: 'customer' });

        if (!tailorUser || !customerUser) {
            console.error('Please run the main seed.js script first to create tailors and customers.');
            process.exit(1);
        }

        // 4. Create dummy orders in different delivery states
        console.log('Seeding delivery orders...');
        
        // Cleanup old orders from this rider if any
        await Order.deleteMany({ deliveryPartner: deliveryUser._id });
        // Also cleanup orders with no partner that we want available
        await Order.deleteMany({ orderId: { $in: ['DLV-001', 'DLV-002', 'DLV-003', 'DLV-004'] } });

        const orders = [
            {
                orderId: 'DLV-001',
                customer: customerUser._id,
                tailor: tailorUser._id,
                deliveryPartner: deliveryUser._id,
                totalAmount: 1500,
                status: 'ready-for-pickup',
                paymentStatus: 'paid',
                deliveryAddress: {
                    street: 'Apt 4B, Hill View Residency',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400050'
                }
            },
            {
                orderId: 'DLV-002',
                customer: customerUser._id,
                tailor: tailorUser._id,
                deliveryPartner: deliveryUser._id,
                totalAmount: 2500,
                status: 'out-for-delivery',
                paymentStatus: 'paid',
                deliveryAddress: {
                    street: '12th Floor, Sky Tower',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400051'
                }
            },
            {
                orderId: 'DLV-003',
                customer: customerUser._id,
                tailor: tailorUser._id,
                deliveryPartner: deliveryUser._id,
                totalAmount: 3200,
                status: 'delivered',
                paymentStatus: 'paid',
                deliveredAt: new Date(Date.now() - 3600000), // 1 hour ago
                deliveryProof: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=400&auto=format&fit=crop',
                deliveryAddress: {
                    street: 'G-01, Sunshine Apartments',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400052'
                }
            },
            {
                orderId: 'DLV-004',
                customer: customerUser._id,
                tailor: tailorUser._id,
                deliveryPartner: null, // Available to be claimed
                totalAmount: 1800,
                status: 'ready-for-pickup',
                paymentStatus: 'paid',
                deliveryAddress: {
                    street: 'Plot 22, Green Valley',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400053'
                }
            }
        ];

        await Order.insertMany(orders);
        console.log('Delivery orders seeded successfully!');

        console.log('\n--- SEED SUMMARY ---');
        console.log('Login Email: delivery@example.com');
        console.log('Password: password123');
        console.log('Orders Attached: 3 (1 Pickup, 1 In Transit, 1 Completed)');
        console.log('Available Orders: 1 (Ready to be claimed)');
        console.log('--------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('SEEDING ERROR:', error);
        process.exit(1);
    }
};

seedDeliveryData();
