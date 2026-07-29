const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

dotenv.config();

// Configure DNS resolution for MongoDB SRV / Atlas connections
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  /* fallback to default system DNS */
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔁 MongoDB reconnected.");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
