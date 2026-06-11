const mongoose = require('mongoose');
const CMSContent = require('./src/models/CMSContent');
require('dotenv').config();

const seedLandingPages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const docs = [
            {
                type: 'legal',
                slug: 'privacy-policy',
                title: 'Privacy Policy',
                content: '<h1>Privacy Policy</h1><p>We value your privacy. Your data is protected. At SewZella, we ensure that your information is kept secure and used solely for providing you with the best bespoke tailoring experience.</p><h2>Information Collection</h2><p>We collect essential information to process your orders and measurements securely.</p>',
                category: 'customer',
                isActive: true
            },
            {
                type: 'legal',
                slug: 'terms-of-service',
                title: 'Terms of Service',
                content: '<h1>Terms of Service</h1><p>By using our app and website, you agree to these terms. SewZella provides bespoke tailoring services. All measurements and garment choices are final once production begins.</p><h2>Refund Policy</h2><p>As items are custom-made, we do not offer refunds, but we guarantee a perfect fit and will provide free alterations if needed.</p>',
                category: 'customer',
                isActive: true
            },
            {
                type: 'legal',
                slug: 'contact-us',
                title: 'Contact Us',
                content: '<h1>Get In Touch</h1><p>We would love to hear from you. For any inquiries regarding our bespoke services, scheduling a consultation, or tracking an order, please reach out using the information below:</p><ul><li><strong>Email:</strong> concierge@sewzella.com</li><li><strong>Phone:</strong> +1 (800) 555-0199</li><li><strong>Studio Location:</strong> 123 Tailor Lane, Fashion District, NY 10001</li></ul><p>Our artisans are available Monday to Friday, 9:00 AM to 6:00 PM.</p>',
                category: 'general',
                isActive: true
            }
        ];

        for (const doc of docs) {
            const existing = await CMSContent.findOne({ slug: doc.slug });
            if (!existing) {
                await CMSContent.create(doc);
                console.log(`Seeded: ${doc.title}`);
            } else {
                console.log(`Already exists: ${doc.title}`);
            }
        }

        console.log('Landing Pages Seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedLandingPages();
