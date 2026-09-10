const mongoose = require('mongoose');
const CMSContent = require('../src/models/CMSContent');
const connectDB = require('../src/config/db');
require('dotenv').config();

const organizedFaqs = [
  {
    type: 'faq',
    slug: 'what-is-sewzella',
    title: 'What is SewZella?',
    content: '<p>SewZella is an all-in-one digital custom tailoring platform connecting you with verified master tailors, boutiques, and fashion designers. We manage doorstep fabric pickup, expert measurements, custom stitching, quality inspection, and doorstep delivery with a 100% Perfect Fit Guarantee.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'how-to-place-order',
    title: 'How do I place an order?',
    content: '<p>Placing an order is simple:</p><ol className="list-decimal ml-5 space-y-1 mt-2"><li>Select your required garment service (e.g. Kurti, Suit, Lehenga, Blouse, Shirt, Alteration).</li><li>Choose your preferred styles, neck patterns, sleeves, and upload reference photos.</li><li>Choose your measurement method (Doorstep Executive visit, Sample Garment pickup, or Saved Profile).</li><li>Confirm your pickup address and complete payment securely.</li></ol>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'track-my-order',
    title: 'How can I track my order live?',
    content: '<p>You can track every stage live in real-time under <strong>My Orders → Track Order</strong>. You will receive live status updates for: Fabric Picked Up, Received at Boutique, Cutting in Progress, Stitching, Quality Inspection, and Out for Delivery.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'doorstep-pickup-and-delivery',
    title: 'Do you offer doorstep fabric pickup and delivery?',
    content: '<p>Yes! Our dedicated delivery partner visits your home to collect your fabric and sample garments safely in a sealed bag. Once your outfit is handcrafted and quality-inspected, it is delivered back to your doorstep.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'how-do-measurements-work',
    title: 'How do I provide my measurements?',
    content: '<p>We offer 3 flexible measurement options:</p><ul className="list-disc ml-5 space-y-1 mt-2"><li><strong>Doorstep Executive:</strong> A certified measurement professional visits your home with a sanitized measuring tape.</li><li><strong>Sample Garment:</strong> Hand over your best-fitting sample garment during pickup; our tailor matches the exact fit.</li><li><strong>Saved Profile:</strong> Enter your custom dimensions once in your profile and reuse anytime.</li></ul>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'fitting-guarantee-and-alterations',
    title: 'What if the outfit does not fit properly?',
    content: '<p>Every order is backed by our <strong>100% Perfect Fit Guarantee</strong>. If any adjustment is needed, request a free alteration within 7 days of delivery. We will pick up the garment, make the adjustments, and deliver it back at zero extra cost.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'choose-own-tailor',
    title: 'Can I choose my own tailor or boutique?',
    content: '<p>Yes! You can browse tailor profiles, check their real work portfolios, customer ratings, years of experience, and specialized crafts (e.g. Bridal Lehengas, Designer Blouses, Formal Suits). You can pick your favorite tailor or use our Smart Auto-Assign feature.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'upload-custom-design',
    title: 'Can I upload my own custom design or reference photo?',
    content: '<p>Yes, absolutely! When customizing any garment, you can upload photos from Pinterest, Instagram, or sketches. You can also add voice notes or specific stitching instructions for the tailor.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'payment-methods-and-security',
    title: 'Which payment methods are accepted and is it secure?',
    content: '<p>We support all major payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Wallets. All transactions are protected with 256-bit bank-grade SSL encryption.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'cancellation-and-refund-policy',
    title: 'Can I cancel my order or request a refund?',
    content: '<p>Orders can be cancelled freely before fabric cutting begins. Once fabric cutting has started, cancellation may be subject to material processing status. Refunds are processed back to your original payment method or instant wallet credit within 3-5 business days.</p>',
    category: 'customer',
    isActive: true
  },
  {
    type: 'faq',
    slug: 'where-is-sewzella-service-available',
    title: 'Where is SewZella service available?',
    content: '<p>SewZella operates across major urban cities and suburbs. Enable location in the app or enter your pin code on the home screen to check instant availability in your area.</p>',
    category: 'customer',
    isActive: true
  }
];

const run = async () => {
  try {
    await connectDB();
    console.log('Cleaning up duplicate FAQs in MongoDB...');
    await CMSContent.deleteMany({ type: 'faq' });

    console.log('Inserting deduplicated, categorized FAQs...');
    await CMSContent.insertMany(organizedFaqs);

    const total = await CMSContent.countDocuments({ type: 'faq' });
    console.log(`✅ Success! Total clean FAQs in database: ${total}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding FAQs:', err);
    process.exit(1);
  }
};

run();
