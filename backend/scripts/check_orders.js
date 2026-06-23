const mongoose = require("mongoose");
const Order = require("./src/models/Order");
require("dotenv").config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/silaiwala");
  const orders = await Order.find({
    status: { $in: ["fabric-ready-for-pickup", "ready", "ready-for-delivery"] },
    $or: [
      { deliveryPartner: null },
      { deliveryPartner: { $exists: false } },
      { pickupPartner: null, status: "fabric-ready-for-pickup" },
      { dropoffPartner: null, status: { $in: ["ready", "ready-for-delivery"] } }
    ]
  });
  console.log("AVAILABLE ORDERS:", orders.length);
  for (const o of orders) {
    console.log(`- ${o._id} | status: ${o.status} | dp: ${o.deliveryPartner} | pp: ${o.pickupPartner} | dop: ${o.dropoffPartner}`);
  }
  process.exit();
}
check();
