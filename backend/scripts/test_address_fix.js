const mongoose = require('mongoose');
const User = require('./src/models/User');
const Customer = require('./src/models/Customer');
const { getAddresses } = require('./src/modules/customers/controllers/address.controller');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const user = await User.findOne({ email: 'customer@example.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        // Mock req and res
        const req = {
            user: {
                id: user._id,
                role: 'customer'
            }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                console.log('Response Status:', this.statusCode);
                console.log('Response Data:', JSON.stringify(data, null, 2));
            }
        };

        const next = (err) => {
            if (err) console.error('Next Error:', err);
        };

        console.log('Testing getAddresses...');
        await getAddresses(req, res, next);

        // Check DB again
        const customer = await Customer.findOne({ user: user._id });
        console.log('Customer in DB after call:', customer ? 'Found' : 'Not Found');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
