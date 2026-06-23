const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function activateUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ name: /Mayur Chadokar/i });
        if (user) {
            user.isActive = true;
            user.isVerified = true;
            await user.save();
            console.log('User Mayur Chadokar ACTIVATED successfully');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

activateUser();
