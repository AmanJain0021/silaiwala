const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("./src/models/Category");

dotenv.config();

const seedHierarchicalCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Clear existing categories for testing
        // await Category.deleteMany({});

        // 1. Root Categories
        const roots = [
            { name: "Silk", type: "product", description: "Premium Silk Fabrics" },
            { name: "Cotton", type: "product", description: "Breathable Cotton Fabrics" },
            { name: "Velvet", type: "product", description: "Luxurious Velvet" },
            { name: "Linen", type: "product", description: "Natural Linen" }
        ];

        const rootDocs = await Promise.all(roots.map(r => Category.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true })));
        console.log("Root categories seeded.");

        // 2. Subcategories
        const subcategories = [
            // Silk subs
            { name: "Raw Silk", parentCategory: rootDocs[0]._id, type: "product" },
            { name: "Banarasi Silk", parentCategory: rootDocs[0]._id, type: "product" },
            { name: "Tussar Silk", parentCategory: rootDocs[0]._id, type: "product" },
            
            // Cotton subs
            { name: "Organic Cotton", parentCategory: rootDocs[1]._id, type: "product" },
            { name: "Egyptian Cotton", parentCategory: rootDocs[1]._id, type: "product" },
            { name: "Handloom Cotton", parentCategory: rootDocs[1]._id, type: "product" }
        ];

        await Promise.all(subcategories.map(s => Category.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true })));
        console.log("Subcategories seeded.");

        console.log("Seeding complete!");
        process.exit();
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedHierarchicalCategories();
