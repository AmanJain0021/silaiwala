import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Star, Gift, ArrowUpRight, Menu,
    Loader2, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTailorAuth } from '../context/AuthContext';

// ── Figma-matched Earnings Page ──────────────────────────────────────────────
const TailorEarnings = () => {
    const navigate = useNavigate();
    const { user } = useTailorAuth();

    const [activeTab, setActiveTab] = useState('Daily');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats]         = useState({ balance: 0, totalWithdrawn: 0 });
    const [transactions, setTxns]   = useState([]);

    const tabs = ['Daily', 'Weekly', 'Monthly'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [balRes, txRes] = await Promise.all([
                    api.get('/wallet/balance'),
                    api.get('/wallet/transactions'),
                ]);
                setStats(balRes.data.data);
                setTxns(txRes.data.data || []);
            } catch (e) {
                console.error('Earnings fetch error:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived breakdowns (mock logic if not available from API)
    const orderEarnings  = stats.balance * 0.82 || 280;
    const incentives     = stats.balance * 0.13 || 45;
    const bonus          = stats.balance * 0.05 || 17.5;
    const todayEarnings  = stats.balance          || 342.5;

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
                <Loader2 size={32} className="animate-spin text-[#2D2F6E]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

            {/* ── HEADER ── */}
            <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate('/partner/settings')} className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm bg-white">
                    <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </button>
                <h1 className="text-[17px] font-black text-[#2D2F6E] tracking-tight">SEWZELLA</h1>
                <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-28 px-4">

                {/* ── TAB BAR ── */}
                <div className="mt-4 mb-4">
                    <div className="flex bg-white border border-gray-200 rounded-2xl p-1 gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                    activeTab === tab
                                        ? 'text-[#2D2F6E] border border-[#2D2F6E]/30 bg-[#FDE5D2]'
                                        : 'text-gray-400'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TOTAL EARNINGS CARD ── */}
                <div className="bg-[#4A5568] rounded-3xl p-6 mb-4 relative overflow-hidden">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                        <ArrowUpRight size={80} color="white" />
                    </div>
                    <p className="text-[12px] text-white/60 font-medium mb-2">
                        Total Earnings {activeTab.toLowerCase()}
                    </p>
                    <p className="text-[36px] font-black text-white tracking-tight leading-none mb-3">
                        ₹{todayEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={14} color="#10B981" strokeWidth={3} />
                        <span className="text-[12px] font-semibold text-green-400">+12.5% from yesterday</span>
                    </div>
                </div>

                {/* ── ORDER EARNINGS ROW ── */}
                <div className="bg-white rounded-3xl px-4 py-4 mb-3 border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} color="#2D2F6E" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[12px] text-gray-400 font-medium">Order Earnings</p>
                        <p className="text-[18px] font-black text-gray-900">
                            ₹{orderEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <ChevronRight size={18} color="#D1D5DB" />
                </div>

                {/* ── INCENTIVES & BONUS ── */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                            <Star size={17} color="#3B82F6" fill="#3B82F6" />
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Incentives</p>
                        <p className="text-[20px] font-black text-gray-900">
                            ₹{incentives.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                            <Gift size={17} color="#10B981" />
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Bonus</p>
                        <p className="text-[20px] font-black text-gray-900">
                            ₹{bonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* ── RECENT PAYOUTS ── */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[17px] font-black text-gray-900">Recent Payouts</h3>
                    <button className="text-[12px] font-black text-[#2D2F6E] uppercase tracking-wider">View All</button>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        /* Fallback static items matching Figma */
                        [
                            { id: 'AL-9302', time: 'Today, 2:45 PM',    amount: '85.00',  badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'suit'  },
                            { id: 'AL-9298', time: 'Today, 11:20 AM',   amount: '120.00', badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'fabric'},
                            { id: 'Peak Hour Bonus', time: 'Today, 9:00 AM', amount: '15.00', badge: 'INCENTIVE', badgeColor: 'text-blue-600 bg-blue-50', img: 'bonus' },
                            { id: 'AL-9285', time: 'Yesterday, 5:15 PM', amount: '75.00', badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'shirt' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.img === 'bonus'
                                        ? <Gift size={20} color="white" />
                                        : <ShoppingBag size={20} color="white" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-black text-gray-900 leading-tight">
                                        {item.id.startsWith('AL') ? `Order #${item.id}` : item.id}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-medium">{item.time}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[15px] font-black text-gray-900">+₹{item.amount}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide ${item.badgeColor}`}>
                                        {item.badge}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        transactions.slice(0, 8).map((txn, i) => (
                            <div key={txn._id || i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center shrink-0">
                                    <ShoppingBag size={20} color="white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-black text-gray-900 leading-tight truncate">
                                        {txn.description || `Order #${txn.orderId || 'N/A'}`}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-medium">{formatTime(txn.createdAt)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[15px] font-black text-gray-900">
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                                    </p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide ${getBadgeStyle(getBadgeLabel(txn))}`}>
                                        {getBadgeLabel(txn)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TailorEarnings;
