const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./src/models/Service');
const Category = require('./src/models/Category');

dotenv.config();

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // 1. Get or Create a Service Category
    let category = await Category.findOne({ name: 'Stitching', type: 'service' });
    if (!category) {
      category = await Category.create({
        name: 'Stitching',
        description: 'Professional tailoring and stitching services',
        type: 'service'
      });
    }

    const services = [
      {
        title: 'Custom Kurti Stitching',
        description: 'Perfect fit with your choice of neck & sleeve design. Includes lining.',
        basePrice: 499,
        deliveryTime: '3-15 Days',
        category: category._id,
        tags: ['Popular', 'Express'],
        image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800'
      },
      {
        title: 'Designer Blouse',
        description: 'Intricate embroidery, padding options, and latkan customization.',
        basePrice: 899,
        deliveryTime: '5-7 Days',
        category: category._id,
        tags: ['Wedding', 'Handwork'],
        image: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=800'
      },
      {
        title: 'Anarkali Suit',
        description: 'Flowy floor-length Anarkali stitching with custom flair.',
        basePrice: 1800,
        deliveryTime: '6-8 Days',
        category: category._id,
        tags: ['Trending'],
        image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'
      }
    ];

    await Service.deleteMany({ category: category._id });
    await Service.insertMany(services);

    console.log('Services Seeded Successfully! ✅');
    process.exit();
  } catch (err) {
    console.error('Error seeding services:', err);
    process.exit(1);
  }
};

seedServices();
