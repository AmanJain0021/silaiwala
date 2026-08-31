const mongoose = require('mongoose');
const CMSContent = require('../src/models/CMSContent');
require('dotenv').config();

const faqs = [
    {
        type: 'faq',
        slug: 'what-is-sewzella',
        title: 'What is SewZella?',
        content: '<p>SewZella is an all-in-one digital tailoring marketplace that connects customers with verified expert tailors, boutiques, and fashion designers. We handle fabric pickup, professional body measurements, custom stitching, quality checks, and doorstep delivery — bringing premium tailor-made clothing directly to your home with a Perfect Fit Guarantee.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'can-i-choose-my-own-tailor',
        title: 'Can I choose my own tailor?',
        content: '<p>Yes, absolutely! SewZella allows you to browse verified local tailors and boutiques, view their ratings, specialized craftsmanship (e.g., Suits, Sarees, Lehengas, Alterations), pricing, and portfolio before making a selection. You can pick your preferred tailor or let our smart system automatically match you with the highest-rated expert near you.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'can-i-track-my-order',
        title: 'Can I track my order?',
        content: '<p>Yes, real-time order tracking is available! Once your order is placed, you can follow every stage of the process under <strong>My Orders</strong> — from pickup by our executive, fabric arrival at the workshop, cutting, stitching, quality inspection, to final delivery to your doorstep.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'can-i-upload-my-own-design',
        title: 'Can I upload my own design?',
        content: '<p>Yes! You can upload reference images, sketches, or photos from Pinterest/Instagram when customizing your service. You can also specify neck designs, sleeve styles, linings, and special stitching preferences directly in the app.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'do-you-offer-pickup-and-delivery',
        title: 'Do you offer pickup and delivery?',
        content: '<p>Yes! We provide convenient doorstep pickup and delivery services. Our trained Measurement Executive visits your address to collect your fabric and reference garments, and delivers the finished, custom-stitched outfit back to your door once completed.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'how-do-i-create-an-account',
        title: 'How do I create an account?',
        content: '<p>Creating an account is fast and easy. Simply enter your mobile phone number on the login screen, enter the OTP sent via SMS, and complete your basic profile with your name and address. You are ready to start placing orders!</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'how-do-i-place-an-order',
        title: 'How do I place an order?',
        content: '<p>Placing an order takes just a few steps:</p><ol className="list-decimal ml-5 space-y-1"><li>Select a service category (e.g., Kurti, Lehenga, Suit, Alteration).</li><li>Customize style details and upload reference designs.</li><li>Select your preferred tailor or opt for auto-assign.</li><li>Choose your measurement method (at-home executive visit or sample garment pickup).</li><li>Confirm address and make payment.</li></ol>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'how-do-i-provide-my-measurements',
        title: 'How do I provide my measurements?',
        content: '<p>You have three flexible options:</p><ul className="list-disc ml-5 space-y-1"><li><strong>Doorstep Executive Visit:</strong> Schedule a visit by a professional SewZella measurement executive.</li><li><strong>Sample Garment Pickup:</strong> Send a perfect-fitting sample garment along with your fabric during pickup.</li><li><strong>Saved Profile:</strong> Save and manage your custom body measurements directly in your app profile.</li></ul>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'is-my-payment-secure',
        title: 'Is my payment secure?',
        content: '<p>Yes, 100% secure! All payments are processed through trusted PCI-DSS compliant payment gateways (UPI, Cards, Netbanking, Wallets). We use end-to-end SSL encryption to safeguard all transaction details.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'where-is-sewzella-available',
        title: 'Where is SewZella available?',
        content: '<p>SewZella is rapidly expanding across major cities. Enter your pin code or enable location services in the app to see all tailors and pickup services active in your area.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'which-payment-methods-are-accepted',
        title: 'Which payment methods are accepted?',
        content: '<p>We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across major banks, Wallet payments, and Cash on Delivery (COD) for eligible locations.</p>',
        category: 'customer',
        isActive: true
    },
    {
        type: 'faq',
        slug: 'fitting-guarantee',
        title: 'What if the outfit does not fit properly?',
        content: '<p>Every order is covered by our <strong>Perfect Fit Guarantee</strong>! If your outfit needs adjustments, request a free alteration within 7 days of delivery, and our team will pick it up, refine the fit, and deliver it back to you at zero extra charge.</p>',
        category: 'customer',
        isActive: true
    }
];

const seedFaqs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const item of faqs) {
            await CMSContent.findOneAndUpdate(
                { slug: item.slug },
                item,
                { upsert: true, new: true, runValidators: true }
            );
        }

        console.log('Successfully seeded/updated all detailed FAQs!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding FAQs:', err);
        process.exit(1);
    }
};

seedFaqs();
