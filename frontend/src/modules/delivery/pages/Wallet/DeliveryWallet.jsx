import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    ArrowLeft,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    History,
    Loader2,
    CheckCircle2,
    X,
    AlertCircle,
    Info,
    ChevronRight,
    Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { toast } from 'react-hot-toast';

const DeliveryWallet = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [walletData, setWalletData] = useState({
        balance: 0,
        totalWithdrawn: 0,
        currency: 'INR'
    });
    const [transactions, setTransactions] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [activeTab, setActiveTab] = useState('history'); // 'history' | 'status'

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                api.get('/wallet/balance'),
                api.get('/wallet/transactions')
            ]);

            if (balanceRes.data.success) {
                setWalletData(balanceRes.data.data);
            }
            if (transactionsRes.data.success) {
                setTransactions(transactionsRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
            toast.error('Failed to load wallet details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();

        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            return toast.error('Please enter a valid amount');
        }
        if (amount > walletData.balance) {
            return toast.error('Insufficient balance');
        }
        if (!upiId || !upiId.includes('@')) {
            return toast.error('Please enter a valid UPI ID');
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/wallet/withdraw', {
                amount,
                method: 'upi',
                bankDetails: {
                    upiId: upiId
                }
            });

            if (res.data.success) {
                toast.success('Withdrawal request submitted!');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                fetchWalletData();
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            toast.error(error.response?.data?.message || 'Withdrawal request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-[#2D2F6E] text-white p-6 pb-20 rounded-b-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Wallet size={120} />
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10 backdrop-blur-md"
                    >
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <h1 className="text-2xl font-black tracking-tight uppercase italic drop-shadow-md">Payout Wallet</h1>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.3em] italic">Available Liquidity</p>
                    <h2 className="text-6xl font-black tracking-tighter drop-shadow-2xl italic">₹{walletData.balance.toLocaleString()}</h2>
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <div className="px-3 py-1 bg-[#2D2F6E]/20 rounded-full border border-[#2D2F6E]/30">
                            <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">Settled Earnings</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats & Action */}
            <div className="px-6 -mt-12 space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-50 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Lifetime Withdrawn</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">₹{walletData.totalWithdrawn.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="relative z-10 bg-[#2D2F6E] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/10"
                    >
                        Withdraw Now
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <Info size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                        Withdrawals are processed manually via UPI within 24-48 hours. Ensure your UPI ID is correct to avoid payment failure.
                    </p>
                </div>

                {/* Tabs */}
                <div className="pt-4">
                    <div className="flex gap-4 border-b border-slate-200 mb-6">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`pb-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'status' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}
                        >
                            Requests
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Ledger...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeTab === 'history' ? (
                                transactions.filter(t => t.status === 'completed' || t.category === 'order_earnings').length > 0 ? (
                                    transactions
                                        .filter(t => t.status === 'completed' || t.category === 'order_earnings')
                                        .map((txn, idx) => (
                                            <div key={txn._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-indigo-50 text-[#2D2F6E]' : 'bg-rose-50 text-rose-600'}`}>
                                                        {txn.type === 'credit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-900">{txn.description || (txn.category === 'order_earnings' ? 'Order Earning' : 'Withdrawal')}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(txn.createdAt).toLocaleDateString()} • {txn.category.replace('_', ' ')}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-[15px] font-black ${txn.type === 'credit' ? 'text-[#2D2F6E]' : 'text-rose-600'}`}>
                                                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                                </p>
                                            </div>
                                        ))
                                ) : (
                                    <div className="py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                        <History size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transaction history</p>
                                    </div>
                                )
                            ) : (
                                transactions.filter(t => t.category === 'withdrawal' && t.status === 'pending').length > 0 ? (
                                    transactions
                                        .filter(t => t.category === 'withdrawal' && t.status === 'pending')
                                        .map((txn, idx) => (
                                            <div key={txn._id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between bg-amber-50/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center animate-pulse">
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-900">Withdrawal Request</p>
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{txn.status}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[15px] font-black text-slate-900">-₹{txn.amount}</p>
                                                    <p className="text-[9px] font-medium text-slate-400">{new Date(txn.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                        <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending requests</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isSubmitting && setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-50 text-[#2D2F6E] rounded-2xl flex items-center justify-center">
                                    <Send size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Directly to UPI</p>
                                </div>
                            </div>

                            <form onSubmit={handleWithdrawRequest} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#2D2F6E] focus:bg-white transition-all"
                                        required
                                        max={walletData.balance}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Available: ₹{walletData.balance}</p>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawAmount(walletData.balance)}
                                            className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-widest"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">UPI ID</label>
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        placeholder="yourname@upi"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] focus:bg-white transition-all uppercase placeholder:normal-case"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !withdrawAmount || !upiId}
                                    className="w-full bg-[#2D2F6E] text-white py-5 rounded-[1.5rem] font-black tracking-[0.2em] uppercase text-xs hover:bg-primary-dark active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Submitting Request
                                        </>
                                    ) : (
                                        'Request Withdrawal'
                                    )}
                                </button>

                                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                                    Funds will be transferred to your upi id <br /> after admin review
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryWallet;
