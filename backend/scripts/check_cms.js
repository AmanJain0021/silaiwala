const mongoose = require('mongoose');
const CMSContent = require('./src/models/CMSContent');
require('dotenv').config();

const checkCMS = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const docs = await CMSContent.find();
        console.log('CMS CONTENT COUNT:', docs.length);
        console.log('DOCS:', JSON.stringify(docs, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCMS();
