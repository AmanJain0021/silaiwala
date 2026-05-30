require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const forceSeedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@tailor.com';
        const password = 'admin123';

        let adminUser = await User.findOne({ email });
        
        if (adminUser) {
            console.log('Admin user exists, updating password...');
            adminUser.password = password;
            await adminUser.save();
            console.log('Admin password updated successfully!');
        } else {
            console.log('Creating new admin user...');
            adminUser = await User.create({
                name: 'Super Admin',
                email: email,
                password: password,
                phoneNumber: '+919876543210',
                role: 'admin',
                isActive: true,
                isVerified: true
            });
            console.log('Admin user created successfully!');
        }

        console.log('Testing login logic...');
        const testUser = await User.findOne({ email }).select('+password');
        const isMatch = await testUser.comparePassword(password);
        console.log('Password match test:', isMatch);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

forceSeedAdmin();
