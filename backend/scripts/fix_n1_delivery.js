const fs = require('fs');

const deliveriesPath = 'C:\\Users\\amanj\\OneDrive\\silaiwala1\\silaiwala\\backend\\src\\modules\\deliveries\\controllers\\delivery.controller.js';
let content = fs.readFileSync(deliveriesPath, 'utf8');

const regex1 = /const formattedOrders = await Promise\.all\(orders\.map\(async \(order\) => \{([\s\S]*?)const customerDoc = await Customer\.findOne\(\{ user: order\.customer\._id \|\| order\.customer \}\)\.lean\(\);([\s\S]*?)\}\)\);/g;

// I'll use string replacement
const oldCode = `  // Enrich each order with Tailor profile data (shopName, location, phone)
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    // Determine taskType based on status AND fabricPickupRequired flag
    const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

    let tailorProfile = null;
    let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
    if (order.tailor) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
        if (tailorProfile.location?.coordinates?.length >= 2) {
            vendorLongitude = tailorProfile.location.coordinates[0];
            vendorLatitude = tailorProfile.location.coordinates[1];
        }
      } else {
        const User = require("../../../models/User");
        const tailorUser = await User.findById(order.tailor).lean();
        if (tailorUser) {
          tailorProfile = {
            _id: order.tailor,
            shopName: tailorUser.name || 'Tailor Workshop',
            phone: tailorUser.phoneNumber,
            location: null
          };
          vendorName = tailorProfile.shopName;
          vendorAddress = 'Tailor Address Not Provided';
          vendorPhone = tailorProfile.phone;
        } else {
          vendorName = "Silaiwala Hub";
          vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
          vendorPhone = "N/A";
        }
      }
    } else {
      vendorName = "Silaiwala Hub";
      vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
      vendorPhone = "N/A";
    }

    // Extract Customer details
    const Customer = require("../../../models/Customer");
    const customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();`;

const newCode = `  const tailorUserIds = [...new Set(orders.filter(o => o.tailor).map(o => o.tailor.toString()))];
  const customerUserIds = [...new Set(orders.filter(o => o.customer).map(o => (o.customer._id || o.customer).toString()))];
  const User = require("../../../models/User");
  const Customer = require("../../../models/Customer");

  const [tailorDocs, tailorUsers, customerDocs] = await Promise.all([
    Tailor.find({ user: { $in: tailorUserIds } }).populate("user", "name phoneNumber").lean(),
    User.find({ _id: { $in: tailorUserIds } }).lean(),
    Customer.find({ user: { $in: customerUserIds } }).lean()
  ]);

  const tailorMap = new Map(tailorDocs.map(t => [t.user._id.toString(), t]));
  const tailorUserMap = new Map(tailorUsers.map(u => [u._id.toString(), u]));
  const customerMap = new Map(customerDocs.map(c => [c.user.toString(), c]));

  // Enrich each order with Tailor profile data (shopName, location, phone)
  const formattedOrders = orders.map((order) => {
    // Determine taskType based on status AND fabricPickupRequired flag
    const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

    let tailorProfile = null;
    let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
    if (order.tailor) {
      const tailorDoc = tailorMap.get(order.tailor.toString());
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
        if (tailorProfile.location?.coordinates?.length >= 2) {
            vendorLongitude = tailorProfile.location.coordinates[0];
            vendorLatitude = tailorProfile.location.coordinates[1];
        }
      } else {
        const tailorUser = tailorUserMap.get(order.tailor.toString());
        if (tailorUser) {
          tailorProfile = {
            _id: order.tailor,
            shopName: tailorUser.name || 'Tailor Workshop',
            phone: tailorUser.phoneNumber,
            location: null
          };
          vendorName = tailorProfile.shopName;
          vendorAddress = 'Tailor Address Not Provided';
          vendorPhone = tailorProfile.phone;
        } else {
          vendorName = "Silaiwala Hub";
          vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
          vendorPhone = "N/A";
        }
      }
    } else {
      vendorName = "Silaiwala Hub";
      vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
      vendorPhone = "N/A";
    }

    // Extract Customer details
    const customerDoc = customerMap.get((order.customer._id || order.customer).toString());`;

content = content.replace(oldCode, newCode);

content = content.replace(
  `    };
  }));

  res.status(200).json({`,
  `    };
  });

  res.status(200).json({`
);

fs.writeFileSync(deliveriesPath, content, 'utf8');
console.log('Fixed delivery.controller.js');
