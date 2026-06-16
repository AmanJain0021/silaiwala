const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const WithdrawalRequest = mongoose.model('WithdrawalRequest', new mongoose.Schema({}, { strict: false, collection: 'withdrawalrequests' }));
    const reqs = await WithdrawalRequest.find({});
    console.log(JSON.stringify(reqs, null, 2));
    process.exit(0);
}
check();
