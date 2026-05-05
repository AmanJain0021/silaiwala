import React from 'react';
import { ArrowLeft, Gift, Share2, Copy, CheckCircle2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserStore from '../../../store/userStore';

const ReferEarn = () => {
    const navigate = useNavigate();
    const { fetchReferralStats, referralStats, isLoading } = useUserStore();

    React.useEffect(() => {
        fetchReferralStats();
    }, [fetchReferralStats]);

    const referralCode = referralStats?.referralCode || "GETTING_CODE...";

    const copyToClipboard = () => {
        if (referralStats?.referralCode) {
            navigator.clipboard.writeText(referralStats.referralCode);
            alert("Code copied!");
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-primary text-white px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold">Refer & Earn</h1>
            </div>

            {/* 2. Hero Section */}
            <div className="bg-primary text-white px-6 pb-12 pt-6 rounded-b-[3rem] text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20"
                >
                    <Gift size={80} className="text-yellow-400 drop-shadow-lg" />
                </motion.div>
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Refer a Friend</h2>
                <p className="text-white/80 text-sm font-medium">Earn ₹50 for every friend who places their first order. Your friend gets ₹25 welcome bonus!</p>
            </div>

            {/* 3. Referral Code Card */}
            <div className="max-w-md mx-auto px-6 -mt-8">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Your Referral Code</p>
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                        <span className="flex-1 text-xl font-black text-primary tracking-widest text-center uppercase">{referralCode}</span>
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-white rounded-xl shadow-sm text-primary hover:bg-gray-100 active:scale-90 transition-all"
                        >
                            <Copy size={20} />
                        </button>
                    </div>

                    <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/10 mt-6 flex items-center justify-center gap-3 transition-all hover:bg-primary-dark active:scale-95">
                        <Share2 size={18} />
                        Share Invitation Link
                    </button>
                </div>
            </div>

            {/* 4. How it works */}
            <div className="px-8 py-10">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">How it Works</h3>
                <div className="space-y-8">
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                            <span className="font-black text-green-600">1</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Invite Friends</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Share your unique referral link with your friends on WhatsApp or Social Media.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <span className="font-black text-primary">2</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Friend Orders</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Your friend uses your code to get ₹25 bonus on their first stitching order.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
                            <span className="font-black text-yellow-600">3</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Get Reward</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Once the order is paid, ₹50 will be credited to your Silaiwala Wallet.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. My Earnings Summary */}
            <div className="px-6 mb-10">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Ticket size={80} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Earned Credits</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">₹{referralStats?.referralEarnings || 0}</span>
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Verified
                        </span>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400">Total Referrals</p>
                            <p className="text-sm font-bold">{referralStats?.totalReferrals || 0} Friends</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 text-right">
                            <button className="text-[10px] font-bold text-white underline tracking-wider uppercase">View History</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferEarn;
