import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Star, Gift, ArrowUpRight, Menu, Bell,
    Loader2, ChevronRight, X, Send, CreditCard, AlertCircle, History, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTailorAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// ── Figma-matched Earnings Page ──────────────────────────────────────────────
const TailorEarnings = () => {
    const navigate = useNavigate();
    const { user } = useTailorAuth();
    const { unreadCount } = useNotifications();

    const [activeTab, setActiveTab] = useState('Daily');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats]         = useState({ balance: 0, totalWithdrawn: 0, codWalletBalance: 0, cashBlocked: false });
    const [transactions, setTxns]   = useState([]);
    const [earningsData, setEarningsData] = useState(null);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAllTxns, setShowAllTxns] = useState(false);

    // COD Deposit States
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositRemarks, setDepositRemarks] = useState('');
    const [depositHistory, setDepositHistory] = useState([]);

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();

        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        if (amount > stats.balance) {
            return toast.error('Insufficient balance');
        }

        if (!upiId) {
            return toast.error('Please enter UPI ID');
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/wallet/withdraw', {
                amount,
                method: 'upi',
                upiId,
                bankDetails: { upiId }
            });

            if (res.data.success) {
                toast.success('Withdrawal request submitted!');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setUpiId('');
                
                // Refresh stats
                const balRes = await api.get('/wallet/dashboard');
                setStats(balRes.data.data);
                setTxns(balRes.data.data.recentTransactions || []);
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            toast.error(error.response?.data?.message || 'Withdrawal request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDepositRequest = async (e) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        
        if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
        if (amount > stats.codWalletBalance) return toast.error('Amount exceeds your COD balance');

        setIsSubmitting(true);
        try {
            // 1. Create Razorpay Order
            const rzpOrderRes = await api.post('/tailors/cod-deposit/razorpay/create', {
                amount,
                remarks: depositRemarks
            });
            
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrderRes.data.data.amount,
                currency: "INR",
                name: "Silaiwala",
                description: "COD Cash Deposit",
                order_id: rzpOrderRes.data.data.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/tailors/cod-deposit/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            depositId: rzpOrderRes.data.depositId
                        });

                        if (verifyRes.data.success) {
                            toast.success('Cash deposit successful!');
                            setShowDepositModal(false);
                            setDepositAmount('');
                            setDepositRemarks('');
                            
                            // Re-fetch data
                            const [balRes, historyRes] = await Promise.all([
                                api.get('/wallet/dashboard'),
                                api.get('/tailors/cod-deposit/history')
                            ]);
                            setStats(balRes.data.data);
                            setTxns(balRes.data.data.recentTransactions || []);
                            if (historyRes.data.success) {
                                setDepositHistory(historyRes.data.data);
                            }
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.name || "Tailor Partner",
                    contact: user?.phoneNumber || "9999999999"
                },
                theme: {
                    color: "#843D9B"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || 'Payment failed');
            });
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to submit deposit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = ['Daily', 'Weekly', 'Monthly'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                let periodMap = { 'Daily': 'day', 'Weekly': 'week', 'Monthly': 'month' };
                const period = periodMap[activeTab] || 'week';
                
                const [balRes, earnRes, historyRes] = await Promise.all([
                    api.get('/wallet/dashboard'),
                    api.get(`/tailors/earnings?period=${period}`),
                    api.get('/tailors/cod-deposit/history').catch(() => ({ data: { success: true, data: [] } }))
                ]);
                setStats(balRes.data.data);
                setTxns(balRes.data.data.recentTransactions || []);
                setEarningsData(earnRes.data.data);
                if (historyRes.data.success) {
                    setDepositHistory(historyRes.data.data);
                }
                setIsLoading(false);
            } catch (error) {
                if (error?.name === 'CanceledError') return;
                console.error('Earnings fetch error:', error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const periodTotal = earningsData?.summary?.periodTotal || 0;
    // Derive breakdowns dynamically based on period total
    const orderEarnings  = periodTotal > 0 ? periodTotal * 0.82 : 0;
    const incentives     = periodTotal > 0 ? periodTotal * 0.13 : 0;
    const bonus          = periodTotal > 0 ? periodTotal * 0.05 : 0;
    const displayedEarnings = periodTotal || 0;

    const getBadgeStyle = (type) => {
        if (!type) return 'text-green-700 bg-green-50';
        if (type === 'INCENTIVE' || type === 'bonus') return 'text-blue-600 bg-blue-50';
        if (type === 'credit' || type === 'completed') return 'text-green-700 bg-green-50';
        return 'text-gray-500 bg-gray-100';
    };

    const getBadgeLabel = (txn) => {
        if (txn.description?.toLowerCase().includes('bonus')) return 'INCENTIVE';
        if (txn.type === 'credit') return 'COMPLETED';
        return (txn.status || 'COMPLETED').toUpperCase();
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return isToday ? `Today, ${time}` : `Yesterday, ${time}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#843D9B]" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white pb-24 md:pb-8">

            {/* ── HEADER (MOBILE ONLY) ── */}
            <div className="md:hidden bg-white px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/partner/settings')} className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm bg-white shrink-0">
                        <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                    </button>
                    <h1 className="text-[17px] font-black text-[#843D9B] tracking-tight mb-0.5">SEWZELLA</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/partner/notifications')}
                        className="relative text-gray-400 hover:text-[#843D9B] transition-colors flex items-center justify-center p-1"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-[#843D9B] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/partner/settings')}
                        className="relative"
                    >
                        <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-xs overflow-hidden">
                            {user?.profile?.profileImage || user?.profileImage ? (
                                <img src={user?.profile?.profileImage || user?.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'T'
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex-1 p-2 md:p-0">
                
                {/* ── DESKTOP TITLE ── */}
                <div className="hidden md:block py-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Earnings & Wallet</h2>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Track your financial performance and payouts</p>
                </div>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* LEFT COLUMN: BALANCE & BREAKDOWN */}
                    <div className="flex-1 space-y-6">
                        
                        {/* ── TAB BAR ── */}
                        <div className="bg-gray-200/50 rounded-2xl p-1 flex gap-1 w-fit">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab
                                            ? 'text-[#843D9B] bg-white shadow-md shadow-black/5'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* ── TOTAL EARNINGS CARD ── */}
                        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-black/10">
                            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                <ArrowUpRight size={240} color="white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3">
                                    Total Wallet Balance
                                </p>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-2xl font-black text-white/40">₹</span>
                                    <h3 className="text-5xl font-black text-white tracking-tighter">
                                    {(stats.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                                        <ArrowUpRight size={14} className="text-green-500" strokeWidth={3} />
                                        <span className="text-[11px] font-black text-green-500">+12.5%</span>
                                    </div>
                                    <button 
                                        onClick={() => setShowWithdrawModal(true)}
                                        className="bg-[#FDE5D2] text-[#843D9B] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/20"
                                    >
                                        Withdraw Funds
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── BREAKDOWN GRID ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => navigate('/partner/orders')}
                                className="w-full text-left bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center gap-5 group hover:border-[#843D9B]/20 hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={24} className="text-[#843D9B]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Order Earnings</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tight">
                                        ₹{orderEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#843D9B] group-hover:translate-x-1 transition-all" />
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#843D9B]/20 transition-all">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                        <Star size={18} className="text-indigo-600" fill="currentColor" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Incentives</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{incentives.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#843D9B]/20 transition-all">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                        <Gift size={18} className="text-emerald-600" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Bonus</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{bonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* COD Wallet Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <CreditCard size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">COD Wallet</h3>
                                </div>
                                {stats.cashBlocked && (
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                        <AlertCircle size={12} /> BLOCKED
                                    </span>
                                )}
                            </div>
                            
                            {stats.cashBlocked && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4 flex items-start gap-2 text-red-800 text-xs">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <p>You have exceeded your pending cash collection limit. Please deposit your collected cash to continue receiving orders.</p>
                                </div>
                            )}

                            <div className="flex items-end justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Collected Cash</p>
                                    <h4 className="text-2xl font-black text-gray-900">₹{(stats.codWalletBalance || 0).toLocaleString()}</h4>
                                </div>
                                <button
                                    onClick={() => setShowDepositModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                >
                                    Deposit Cash
                                </button>
                            </div>

                            {depositHistory.length > 0 && (
                                <div className="mt-5 border-t border-gray-100 pt-4">
                                    <p className="text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Recent Deposits</p>
                                    <div className="space-y-3">
                                        {depositHistory.slice(0, 3).map((dep, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : dep.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-500'}`}>
                                                        <History size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-900">₹{dep.amount}</p>
                                                        <p className="text-[9px] text-gray-400">{new Date(dep.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : dep.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {dep.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RECENT PAYOUTS */}
                    <div className="w-full lg:w-[400px] flex flex-col">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col pb-2">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Activity Log</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time transaction history</p>
                                </div>
                                {transactions.length > 15 && (
                                    <button 
                                        onClick={() => setShowAllTxns(!showAllTxns)}
                                        className="text-[11px] font-black text-[#843D9B] hover:underline uppercase tracking-widest"
                                    >
                                        {showAllTxns ? 'Show Less' : 'View All'}
                                    </button>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                        <ShoppingBag size={32} className="text-gray-200 mb-3" />
                                        <p className="text-sm font-bold text-gray-400">No recent activity.</p>
                                    </div>
                                ) : (showAllTxns ? transactions : transactions.slice(0, 15)).map((item, i) => {
                                    const isCredit = item.type === 'credit' || (item.id && !item.id.startsWith('Peak')) || (item.badge === 'INCENTIVE');
                                    return (
                                        <div key={i} className="group p-4 bg-white hover:bg-gray-50 rounded-3xl border border-transparent hover:border-gray-100 transition-all flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#1A1A1A] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                {item.img === 'bonus' || (item.description && item.description.includes('bonus'))
                                                    ? <Gift size={20} className="text-white" />
                                                    : <ShoppingBag size={20} className="text-white" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 leading-tight truncate">
                                                    {item._id ? (item.description || `Order #${item.orderId || 'N/A'}`) : (item.id.startsWith('AL') ? `Order #${item.id}` : item.id)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        {item.createdAt ? formatTime(item.createdAt) : item.time}
                                                    </p>
                                                    {item.withdrawalRequest?.proofOfPayment && (
                                                        <a href={item.withdrawalRequest.proofOfPayment} target="_blank" rel="noreferrer" className="text-[9px] font-black text-[#843D9B] bg-[#843D9B]/10 px-1.5 py-0.5 rounded hover:bg-[#843D9B]/20 transition-colors flex items-center gap-1">
                                                            <ArrowUpRight size={10} /> Receipt
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-base font-black ${isCredit ? 'text-gray-900' : 'text-rose-500'}`}>
                                                    {isCredit ? '+' : '-'}₹{(item.amount || 0).toLocaleString('en-IN')}
                                                </p>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest ${item.badgeColor || getBadgeStyle(getBadgeLabel(item))}`}>
                                                    {item.badge || getBadgeLabel(item)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm md:items-center"
                        onClick={() => !isSubmitting && setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-indigo-50 text-[#843D9B] rounded-2xl flex items-center justify-center shrink-0">
                                    <Send size={24} />
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all"
                                        min="100"
                                        max={stats.balance}
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex items-center justify-between mt-2 px-2">
                                        <p className="text-[10px] font-bold text-slate-500">Available: ₹{stats.balance?.toLocaleString()}</p>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawAmount(stats.balance)}
                                            className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest"
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
                                        placeholder="username@bank"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !withdrawAmount || !upiId}
                                    className="w-full bg-[#843D9B] text-white py-5 rounded-[1.5rem] font-black tracking-[0.2em] uppercase text-xs hover:bg-primary-dark active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Request Withdrawal'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deposit Cash Modal */}
            <AnimatePresence>
                {showDepositModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm md:items-center"
                        onClick={() => !isSubmitting && setShowDepositModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowDepositModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Building2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Deposit Cash</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pay COD Dues Online</p>
                                </div>
                            </div>

                            <form onSubmit={handleDepositRequest} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        required
                                        max={stats.codWalletBalance}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight font-black">Pending Cash: ₹{(stats.codWalletBalance || 0).toLocaleString()}</p>
                                        <button
                                            type="button"
                                            onClick={() => setDepositAmount(stats.codWalletBalance)}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Remarks (Optional)</label>
                                    <input
                                        type="text"
                                        value={depositRemarks}
                                        onChange={(e) => setDepositRemarks(e.target.value)}
                                        placeholder="e.g. Paid online"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !depositAmount}
                                    className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black tracking-[0.2em] uppercase text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Processing Payment
                                        </>
                                    ) : (
                                        'Pay Online'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TailorEarnings;
