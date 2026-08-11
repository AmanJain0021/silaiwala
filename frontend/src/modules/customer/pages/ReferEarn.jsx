import React from 'react';
import { ArrowLeft, Gift, Share2, Copy, CheckCircle2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import useUserStore from '../../../store/userStore';
import useBrandingStore from '../../../store/brandingStore';

const ReferEarn = () => {
    const navigate = useNavigate();
    const { fetchReferralStats, referralStats } = useUserStore();
    const appName = useBrandingStore(state => state.appName);

    React.useEffect(() => {
        fetchReferralStats();
    }, [fetchReferralStats]);

    const cfg = referralStats?.referralConfig || {};
    const referrerPts = cfg.referrerPointsOnFirstAdvance ?? 50;
    const refereePts = cfg.refereePointsOnFirstAdvance ?? 25;
    const referralCode = referralStats?.referralCode || 'GETTING_CODE...';

    const copyToClipboard = () => {
        if (referralStats?.referralCode) {
            navigator.clipboard.writeText(referralStats.referralCode);
            toast.success('Code copied!');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            <div className="sticky top-0 z-50 bg-primary text-white px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold">Refer & Earn</h1>
            </div>

            <div className="bg-primary text-white px-6 pb-12 pt-6 rounded-b-[3rem] text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20"
                >
                    <Gift size={80} className="text-yellow-400 drop-shadow-lg" />
                </motion.div>
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Refer a Friend</h2>
                <p className="text-white/80 text-sm font-medium">
                    Earn {referrerPts} loyalty points when your friend pays the advance on their first order.
                    They get {refereePts} points welcome bonus (1 point = ₹1).
                </p>
            </div>

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

                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `Join ${appName}`,
                                    text: `Use my referral code ${referralCode} — get ${refereePts} loyalty points after your first advance payment!`,
                                    url: window.location.origin,
                                }).catch(console.error);
                            } else {
                                copyToClipboard();
                            }
                        }}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/10 mt-6 flex items-center justify-center gap-3 transition-all hover:bg-primary-dark active:scale-95"
                    >
                        <Share2 size={18} />
                        Share Invitation Link
                    </button>
                </div>
            </div>

            <div className="px-8 py-10">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">How it Works</h3>
                <div className="space-y-8">
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                            <span className="font-black text-green-600">1</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Invite Friends</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">Share your code on WhatsApp or social media.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <span className="font-black text-primary">2</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Friend pays advance</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                When they pay the advance (or full amount) on their first order, rewards unlock — not at signup alone.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
                            <span className="font-black text-yellow-600">3</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Get points</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                You receive {referrerPts} points; your friend gets {refereePts} points in loyalty balance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mb-10">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Ticket size={80} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Referral points earned</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{referralStats?.referralEarnings || 0}</span>
                        <span className="text-sm text-gray-300 font-bold">pts</span>
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1 ml-2">
                            <CheckCircle2 size={12} /> Loyalty
                        </span>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400">Total Referrals</p>
                            <p className="text-sm font-bold">{referralStats?.totalReferrals || 0} Friends</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 text-right">
                            <p className="text-[10px] text-gray-400">Your balance</p>
                            <p className="text-sm font-bold">{referralStats?.loyaltyPoints ?? 0} pts</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferEarn;
