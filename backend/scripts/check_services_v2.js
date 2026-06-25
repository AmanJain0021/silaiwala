const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./src/models/Service');
const Tailor = require('./src/models/Tailor');
const Category = require('./src/models/Category');
const User = require('./src/models/User');

async function checkServices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const services = await Service.find().populate({
            path: 'tailor',
            populate: { path: 'user' }
        }).populate('category');
        console.log('Services Count:', services.length);
        console.log('Services:', JSON.stringify(services, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkServices();
