const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
  const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
  
  const txs = await WalletTransaction.find({ amount: 70, category: 'order_earnings' });
  console.log('Found txs:', txs.length);
  
  for (let tx of txs) {
    await WalletTransaction.updateOne({ _id: tx._id }, { $set: { amount: 140 } });
    const profile = await Delivery.findOne({ user: tx.user });
    if (profile) {
      await Delivery.updateOne({ _id: profile._id }, { $inc: { walletBalance: 70, totalEarned: 70 } });
    }
  }
  
  console.log('Done!');
  process.exit(0);
});
