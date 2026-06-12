const mongoose = require('mongoose');
const { getOrderById } = require('./src/modules/deliveries/controllers/delivery.controller');

mongoose.connect('mongodb+srv://mayurchadokar14_db_user:sORqnMJxbSjnstzY@cluster0.ueig0du.mongodb.net/dev_trailor')
.then(async () => {
    const req = {
        params: { id: 'ORD-39AD63E6' },
        user: { id: 'dummy' }
    };
    const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { console.log(JSON.stringify(data, null, 2)); process.exit(0); }
    };
    const next = function(err) { console.error('Next called with error:', err); process.exit(1); };
    
    await getOrderById(req, res, next);
});
