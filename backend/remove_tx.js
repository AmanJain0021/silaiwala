const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
  const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
  
  const tx = await WalletTransaction.findOne({ description: 'Earnings for Pickup of order ORD-C20E3A62' });
  if (tx) {
    await WalletTransaction.deleteOne({ _id: tx._id });
    const profile = await Delivery.findOne({ user: tx.user });
    if (profile) {
      await Delivery.updateOne({ _id: profile._id }, { $inc: { walletBalance: -140, totalEarned: -140 } });
      console.log('Removed tx and updated balance');
    }
  } else {
    console.log('Transaction not found');
  }
  process.exit(0);
});
