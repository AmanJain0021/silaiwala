const mongoose = require('mongoose');
const CMSContent = require('./src/models/CMSContent');
require('dotenv').config();

const seedCMS = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const existing = await CMSContent.countDocuments();
        if (existing > 0) {
            console.log('CMS already has content');
            process.exit();
        }

        const docs = [
            {
                type: 'legal',
                slug: 'privacy-policy',
                title: 'Privacy Policy',
                content: '<h1>Privacy Policy</h1><p>We value your privacy. Your data is protected.</p><ul><li>Data encryption</li><li>No third-party sharing</li></ul>',
                category: 'customer',
                isActive: true
            },
            {
                type: 'legal',
                slug: 'terms-of-service',
                title: 'Terms of Service',
                content: '<h1>Terms of Service</h1><p>By using our app, you agree to these terms.</p>',
                category: 'customer',
                isActive: true
            },
            {
                type: 'faq',
                slug: 'fitting-guarantee',
                title: 'Perfect Fit Guarantee',
                content: 'We offer free alterations within 7 days of delivery if the fit is not perfect.',
                category: 'customer',
                isActive: true
            }
        ];

        await CMSContent.insertMany(docs);
        console.log('CMS Seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCMS();
