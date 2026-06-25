const mongoose = require('mongoose');
require('dotenv').config();
const Tailor = require('./src/models/Tailor');
const User = require('./src/models/User');

async function seedDocs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ name: /Mayur Chadokar/i });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }
        
        const dummyDocs = [
            {
                name: "Aadhar Card",
                url: "https://res.cloudinary.com/demo/image/upload/v1672312345/sample_id.jpg",
                status: "pending"
            },
            {
                name: "PAN Card",
                url: "https://res.cloudinary.com/demo/image/upload/v1672312345/sample_pan.jpg",
                status: "pending"
            },
            {
                name: "Shop License",
                url: "https://res.cloudinary.com/demo/image/upload/v1672312345/sample_license.jpg",
                status: "pending"
            }
        ];

        await Tailor.findOneAndUpdate(
            { user: user._id },
            { $set: { documents: dummyDocs } }
        );

        console.log('Dummy documents seeded for Mayur Chadokar');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDocs();
