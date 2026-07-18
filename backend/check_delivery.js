const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const Delivery = require('./src/models/Delivery');

  const users = await User.find({role: { $in: ['delivery', 'delivery_boy'] }});
  console.log(`Found ${users.length} delivery users`);
  
  for (const u of users) {
    const d = await Delivery.findOne({user: u._id});
    if (!d) {
        console.log(`Creating missing Delivery profile for ${u.name} (${u._id})...`);
        await Delivery.create({
            user: u._id,
            vehicleType: "bike",
            partnerRoles: ["delivery"],
            isAvailable: true,
            status: "active",
            currentLocation: {
                type: "Point",
                coordinates: [77.4126, 23.2599] // Bhopal coordinates as default
            }
        });
        console.log(`Created.`);
    } else {
        console.log(`User ${u._id} already has a profile.`);
    }
  }
  console.log("Done.");
  process.exit();
}

main().catch(console.error);
