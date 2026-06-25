const mongoose = require('mongoose');
const SubscriptionPlan = require('./src/models/SubscriptionPlan');
require('dotenv').config();

const plans = [
  {
    name: 'Basic (Starter)',
    price: 0,
    billingCycle: 'Monthly',
    commissionRange: '15% - 20% Commission',
    features: ['Standard shop listing', 'Basic support', 'Limited orders per month'],
    isPopular: false,
    theme: 'basic'
  },
  {
    name: 'Premium Plus',
    price: 999,
    billingCycle: 'Monthly',
    commissionRange: '5% - 10% Commission',
    features: ['Highlighted shop profile', 'More order capacity', 'Standard support'],
    isPopular: true,
    theme: 'premium'
  },
  {
    name: 'Pro Elite',
    price: 2999,
    billingCycle: 'Monthly',
    commissionRange: '0% - 2% Commission',
    features: ['Top priority listing', 'Unlimited orders', '24/7 dedicated support', 'Featured marketing'],
    isPopular: false,
    theme: 'elite'
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await SubscriptionPlan.deleteMany({});
    console.log('Old plans deleted');
    await SubscriptionPlan.insertMany(plans);
    console.log('New plans seeded successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding plans:', err);
    process.exit(1);
  });
