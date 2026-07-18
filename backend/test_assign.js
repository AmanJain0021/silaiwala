const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const Delivery = require('./src/models/Delivery');
  require('./src/models/User');

  const query = {
      isAvailable: true,
      cashBlocked: { $ne: true }
  };
  
  const allRiders = await Delivery.find(query);
  console.log(`Total Riders matching basic query: ${allRiders.length}`);
  if (allRiders.length > 0) {
      console.log('Sample rider:', JSON.stringify(allRiders[0], null, 2));
  }
  
  process.exit();
}

main().catch(console.error);
