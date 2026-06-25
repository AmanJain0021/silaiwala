const mongoose = require("mongoose");
const Category = require("./src/models/Category");
const TailorWorkSample = require("./src/models/TailorWorkSample");
const Product = require("./src/models/Product");
const User = require("./src/models/User");
require("dotenv").config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Find or Create Categories
    let category = await Category.findOne({ name: "Stitching" });
    if (!category) {
      category = await Category.create({ name: "Stitching", description: "Standard stitching services", isActive: true });
    }

    let fabricCategory = await Category.findOne({ name: "Fabrics" });
    if (!fabricCategory) {
      fabricCategory = await Category.create({ name: "Fabrics", description: "Premium fabric materials", isActive: true });
    }

    // 2. Find a Tailor
    const tailor = await User.findOne({ role: "tailor" });
    if (!tailor) {
      console.log("No tailor found to associate data with. Please sign up a tailor first.");
      process.exit();
    }

    // 3. Create Work Samples
    const samples = [
       {
         tailor: tailor._id,
         title: "Royal Silk Sherwani",
         description: "Custom stitched Royal Silk Sherwani with intricate hand embroidery.",
         image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800",
         serviceType: "STITCHING",
         laborPrice: 15000,
         avgCompletionTime: "7 DAYS",
         category: category._id
       },
       {
         tailor: tailor._id,
         title: "Designer Bridal Lehenga",
         description: "Heavy designer lehenga with zardosi work.",
         image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
         serviceType: "STITCHING",
         laborPrice: 25000,
         avgCompletionTime: "15 DAYS",
         category: category._id
       }
    ];

    await TailorWorkSample.deleteMany({ tailor: tailor._id });
    await TailorWorkSample.insertMany(samples);
    console.log("Work samples seeded!");

    // 4. Create Fabric Products
    const fabrics = [
      {
        name: "Premium Italian Wool",
        description: "Super 120s Italian wool, perfect for bespoke suits.",
        price: 4500,
        originalPrice: 5000,
        image: "https://images.unsplash.com/photo-1524234107056-1c1f48f4470d?w=800",
        category: fabricCategory._id,
        tailor: tailor._id,
        stock: 50,
        isActive: true
      },
      {
        name: "Banarasi Silk - Gold",
        description: "Authentic hand-woven Banarasi silk with pure zari.",
        price: 8500,
        originalPrice: 10000,
        image: "https://images.unsplash.com/photo-1620012253295-c15c54e0c4f8?w=800",
        category: fabricCategory._id,
        tailor: tailor._id,
        stock: 20,
        isActive: true
      }
    ];

    await Product.deleteMany({ tailor: tailor._id });
    await Product.insertMany(fabrics);
    console.log("Fabric products seeded!");

    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
