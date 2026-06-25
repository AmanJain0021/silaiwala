const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/silaiwala');
        
        const Tailor = mongoose.model('Tailor', new mongoose.Schema({ location: { coordinates: [Number] } }));
        const Product = mongoose.model('Product', new mongoose.Schema({ name: String, title: String, tailor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor' } }));
        
        const products = await Product.find().populate('tailor');
        for (const p of products) {
            console.log(`Product: ${p.title || p.name}, Tailor coords:`, p.tailor?.location?.coordinates);
        }
        
        const Service = mongoose.model('Service', new mongoose.Schema({ title: String, tailor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor' } }));
        const services = await Service.find().populate('tailor');
        for (const s of services) {
            console.log(`Service: ${s.title}, Tailor coords:`, s.tailor?.location?.coordinates);
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}
run();
