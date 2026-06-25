const mongoose = require('mongoose');
require('dotenv').config();
const Tailor = require('./src/models/Tailor');
const User = require('./src/models/User');

async function checkDocs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ name: /Mayur Chadokar/i });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }
        
        const profile = await Tailor.findOne({ user: user._id });
        console.log('Profile Documents:', JSON.stringify(profile.documents, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDocs();
