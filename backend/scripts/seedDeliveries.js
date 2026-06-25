require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Delivery = require("./src/models/Delivery");

const MONGODB_URI = process.env.MONGO_URI;

const seedDeliveries = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    for (let i = 1; i <= 10; i++) {
      const user = new User({
        name: `Delivery Boy ${i}`,
        email: `delivery${i}_${Date.now()}@example.com`,
        phoneNumber: `69999000${i.toString().padStart(2, "0")}`, // Starts with 6, length 10
        password: "Password123!",
        role: "delivery",
        isActive: true,
        isVerified: true,
      });

      const savedUser = await user.save();

      const delivery = new Delivery({
        user: savedUser._id,
        vehicleType: i % 2 === 0 ? "bike" : "scooter",
        vehicleNumber: `MH 12 AB 12${i.toString().padStart(2, "0")}`,
        isAvailable: true,
        status: "active",
        currentLocation: {
          type: "Point",
          // Random coordinates around central Delhi (28.6139, 77.2090)
          coordinates: [
            77.2090 + (Math.random() - 0.5) * 0.1, // longitude
            28.6139 + (Math.random() - 0.5) * 0.1  // latitude
          ],
        },
        address: `Sample Address ${i}, Delhi, India`,
        aadharNumber: `1234567890${i.toString().padStart(2, "0")}`,
        emergencyContact: `99999999${i.toString().padStart(2, "0")}`,
        documents: [
          { name: "Driving License Front", url: "https://example.com/dl-front.jpg", status: "verified" },
          { name: "Driving License Back", url: "https://example.com/dl-back.jpg", status: "verified" },
          { name: "Aadhar Front", url: "https://example.com/aadhar-front.jpg", status: "verified" },
          { name: "Aadhar Back", url: "https://example.com/aadhar-back.jpg", status: "verified" },
        ]
      });

      await delivery.save();
      console.log(`Created delivery boy ${i}`);
    }

    console.log("Successfully seeded 10 delivery boys!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding deliveries:", error);
    process.exit(1);
  }
};

seedDeliveries();
