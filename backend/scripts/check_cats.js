const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./src/models/Category');

async function checkCats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cats = await Category.find();
        console.log('Categories:', JSON.stringify(cats, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCats();
