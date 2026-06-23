const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Payout = require('./src/models/Payout');
const User = require('./src/models/User');
const Tailor = require('./src/models/Tailor');
const WalletTransaction = require('./src/models/WalletTransaction');

const seedFinance = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Get the System Tailor
        const systemTailorProfile = await Tailor.findOne({ shopName: /Silaiwala Central Store/i });
        if (!systemTailorProfile) {
            console.log('System Tailor not found. Run seedStore.js first.');
            process.exit(1);
        }

        // 2. Create Wallet Transactions
        console.log('Creating Wallet Transactions...');
        const transactions = [
            {
                user: systemTailorProfile.user,
                amount: 5000,
                type: 'credit',
                category: 'order_earnings',
                status: 'completed',
                description: 'Payment for Order ORD-543210'
            },
            {
                user: systemTailorProfile.user,
                amount: 1500,
                type: 'debit',
                category: 'withdrawal',
                status: 'completed',
                description: 'Withdrawal to Bank Account'
            }
        ];

        for (const txn of transactions) {
            await WalletTransaction.create(txn);
        }

        // 3. Create Payouts
        console.log('Creating Payouts...');
        const payouts = [
            {
                payoutId: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
                tailor: systemTailorProfile.user,
                amount: 1500,
                method: 'bank_transfer',
                bankDetails: {
                    accountName: 'Silaiwala Admin',
                    bankName: 'HDFC Bank',
                    accountNumber: 'XXXXXX5432',
                    ifscCode: 'HDFC0001234'
                },
                status: 'completed',
                processedAt: new Date()
            },
            {
                payoutId: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
                tailor: systemTailorProfile.user,
                amount: 3200,
                method: 'upi',
                bankDetails: {
                    upiId: 'admin@okaxis'
                },
                status: 'pending'
            }
        ];

        for (const payout of payouts) {
            await Payout.findOneAndUpdate({ payoutId: payout.payoutId }, payout, { upsert: true });
        }

        console.log('Finance data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding finance failed:', error);
        process.exit(1);
    }
};

seedFinance();
