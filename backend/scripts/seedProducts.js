const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const User = require('./src/models/User');

dotenv.config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // 1. Get a Tailor (User) to associate products with
    const tailor = await User.findOne({ role: 'tailor' });
    if (!tailor) {
      console.error('No tailor found in database. Please register a tailor first.');
      process.exit(1);
    }

    // 2. Get or Create Categories
    const categoriesData = [
      { name: 'Kurtis', description: 'Traditional and modern kurtis' },
      { name: 'Suits', description: 'Complete suit sets' },
      { name: 'Dresses', description: 'Western and fusion dresses' },
      { name: 'Sarees', description: 'Elegant silk and cotton sarees' },
      { name: 'Festive', description: 'Heavy party and bridal wear' }
    ];

    const categories = {};
    for (const cat of categoriesData) {
      let doc = await Category.findOne({ name: cat.name });
      if (!doc) {
        doc = await Category.create({ ...cat, type: 'product' });
      }
      categories[cat.name] = doc._id;
    }

    const products = [
      {
        name: 'Embroidered Anarkali Kurti',
        title: 'Embroidered Anarkali Kurti',
        description: 'Premium Rayon with Gold Print. Perfect for festive occasions.',
        price: 1499,
        originalPrice: 2999,
        discount: 50,
        category: categories['Kurtis'],
        tailor: tailor._id,
        image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
        images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: [{ name: "Ruby Red", hex: "#e11d48" }],
        details: [
            { title: "Fabric", content: "Premium Rayon" },
            { title: "Care", content: "Hand Wash" }
        ],
        isFeatured: true
      },
      {
        name: 'Cotton Printed Suit Set',
        title: 'Cotton Printed Suit Set',
        description: 'Pure Cotton 60-60. Includes Kurta, Pant & Dupatta.',
        price: 2199,
        originalPrice: 3500,
        discount: 37,
        category: categories['Suits'],
        tailor: tailor._id,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
        sizes: ["M", "L", "XL"],
        colors: [{ name: "Purple", hex: "#7e22ce" }],
        details: [{ title: "Fabric", content: "Pure Cotton" }],
        isFeatured: true
      }
    ];

    await Product.deleteMany({ tailor: tailor._id });
    await Product.insertMany(products);

    console.log('Store Products Seeded Successfully! 🛍️');
    process.exit();
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
};

seedProducts();
