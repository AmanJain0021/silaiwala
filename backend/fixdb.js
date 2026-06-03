const mongoose = require('mongoose');
const Tailor = require('./src/models/Tailor');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const tailors = await Tailor.find({});
    for (const tailor of tailors) {
        if (tailor.documents) {
            let changed = false;
            tailor.documents.forEach(doc => {
                if (doc.status === 'rejected') {
                    doc.status = 'pending';
                    changed = true;
                }
            });
            if (changed) {
                await tailor.save();
                console.log('Fixed tailor:', tailor.shopName);
            }
        }
    }
    console.log('Done');
    process.exit(0);
}

run();
