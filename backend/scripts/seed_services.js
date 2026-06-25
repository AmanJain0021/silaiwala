const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./src/models/Service');
const Tailor = require('./src/models/Tailor');
const Category = require('./src/models/Category');

async function seedServices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const tailor = await Tailor.findOne({ shopName: /John Deo/i });
        if (!tailor) {
            console.error("Tailor not found");
            process.exit(1);
        }

        let category = await Category.findOne({ name: /Lehenga/i });
        if (!category) {
            category = await Category.findOne({ type: 'service' });
        }

        const services = [
            {
                title: "Sherwani For Groom",
                description: "Premium wedding sherwani with intricate embroidery and perfect fit for the big day.",
                basePrice: 15000,
                image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800",
                tags: ["WEDDING", "PREMIUM", "GROOM"],
                deliveryTime: "15-20 DAYS",
                category: category._id,
                tailor: tailor._id,
                isActive: true
            },
            {
                title: "Designer Bridal Lehenga",
                description: "Exquisite bridal lehenga stitching with customized detailing and premium finish.",
                basePrice: 25000,
                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
                tags: ["BRIDAL", "LEHENGA", "EXTREME"],
                deliveryTime: "25-30 DAYS",
                category: category._id,
                tailor: tailor._id,
                isActive: true
            }
        ];

        for (const s of services) {
            await Service.findOneAndUpdate(
                { title: s.title, tailor: s.tailor },
                s,
                { upsert: true, new: true }
            );
        }

        console.log("Sample services seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedServices();
