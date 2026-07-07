require('dotenv').config();
const mongoose = require('mongoose');

console.log("Connecting to:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({role: String, isActive: Boolean}, {strict: false, collection: 'users'}));
    const activeUsers = await User.find({role: 'delivery', isActive: true}); 
    const activeUserIds = activeUsers.map(u => u._id); 
    const activePartners = await mongoose.model('Delivery', new mongoose.Schema({user: mongoose.Schema.Types.ObjectId, isAvailable: Boolean}, {strict: false, collection: 'deliveries'})).countDocuments({user: {$in: activeUserIds}, isAvailable: true}); 
    console.log('active partners (isActive=true AND isAvailable=true):', activePartners); 

    const allDeliveryUsers = await User.find({role: 'delivery'});
    console.log('total delivery users:', allDeliveryUsers.length);
    const availableProfiles = await mongoose.model('Delivery').countDocuments({isAvailable: true});
    console.log('total profiles with isAvailable=true:', availableProfiles);

    process.exit(0);
});
