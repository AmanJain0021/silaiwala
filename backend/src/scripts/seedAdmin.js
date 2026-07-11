require('dotenv').config();
const mongoose = require('mongoose');
const User = require("../models/User.js");

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        let adminUser = await User.findOne({ email: 'admin@tailor.com' });
        
        if (adminUser) {
            console.log('Admin user already exists!');
            console.log(`Email: ${adminUser.email}`);
            console.log(`Password: admin123  (Assuming default password)`);
        } else {
            // Create admin user
            adminUser = await User.create({
                name: 'Super Admin',
                email: 'admin@tailor.com',
                password: 'admin123', // Will be hashed by pre-save hook
                phoneNumber: '+919876543210',
                role: 'admin',
                isActive: true,
                isVerified: true
            });
            console.log('Admin user created successfully!');
            console.log(`Email: ${adminUser.email}`);
            console.log(`Password: admin123`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
