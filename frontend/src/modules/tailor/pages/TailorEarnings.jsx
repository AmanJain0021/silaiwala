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
    const [earningsData, setEarningsData] = useState(null);

    const tabs = ['Daily', 'Weekly', 'Monthly'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                let periodMap = { 'Daily': 'day', 'Weekly': 'week', 'Monthly': 'month' };
                const period = periodMap[activeTab] || 'week';
                
                const [balRes, txRes, earnRes] = await Promise.all([
                    api.get('/wallet/balance'),
                    api.get('/wallet/transactions'),
                    api.get(`/tailors/earnings?period=${period}`)
                ]);
                setStats(balRes.data.data);
                setTxns(txRes.data.data || []);
                setEarningsData(earnRes.data.data);
            } catch (e) {
                console.error('Earnings fetch error:', e);
            } finally {
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
                <Loader2 size={32} className="animate-spin text-[#2D2F6E]" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#2D2F6E] selection:text-white">

            {/* ── MOBILE HEADER ── */}
            <div className="md:hidden bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => navigate('/partner/settings')} className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm bg-white">
                    <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </button>
                <h1 className="text-[17px] font-black text-[#2D2F6E] tracking-tight">SEWZELLA</h1>
                <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'T'}
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
                                            ? 'text-[#2D2F6E] bg-white shadow-md shadow-black/5'
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
                                    Current Balance • {activeTab}
                                </p>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-2xl font-black text-white/40">₹</span>
                                    <h3 className="text-5xl font-black text-white tracking-tighter">
                                    {displayedEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                                        <ArrowUpRight size={14} className="text-green-500" strokeWidth={3} />
                                        <span className="text-[11px] font-black text-green-500">+12.5%</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/partner/withdraw')}
                                        className="bg-[#FDE5D2] text-[#2D2F6E] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/20"
                                    >
                                        Withdraw Funds
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── BREAKDOWN GRID ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center gap-5 group hover:border-[#2D2F6E]/20 transition-all">
                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={24} className="text-[#2D2F6E]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Order Earnings</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tight">
                                        ₹{orderEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-200" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#2D2F6E]/20 transition-all">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                        <Star size={18} className="text-indigo-600" fill="currentColor" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Incentives</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{incentives.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#2D2F6E]/20 transition-all">
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
                    </div>

                    {/* RIGHT COLUMN: RECENT PAYOUTS */}
                    <div className="w-full lg:w-[400px] flex flex-col">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Activity Log</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time transaction history</p>
                                </div>
                                <button className="text-[11px] font-black text-[#2D2F6E] hover:underline uppercase tracking-widest">View All</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {(transactions.length === 0 ? [
                                    { id: 'AL-9302', time: 'Today, 2:45 PM',    amount: '85.00',  badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'suit'  },
                                    { id: 'AL-9298', time: 'Today, 11:20 AM',   amount: '120.00', badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'fabric'},
                                    { id: 'Peak Hour Bonus', time: 'Today, 9:00 AM', amount: '15.00', badge: 'INCENTIVE', badgeColor: 'text-blue-600 bg-blue-50', img: 'bonus' },
                                    { id: 'AL-9285', time: 'Yesterday, 5:15 PM', amount: '75.00', badge: 'COMPLETED', badgeColor: 'text-green-700 bg-green-50',  img: 'shirt' },
                                ] : transactions.slice(0, 15)).map((item, i) => {
                                    const isCredit = item.type === 'credit' || !item.id.startsWith('Peak');
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
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                                                    {item.createdAt ? formatTime(item.createdAt) : item.time}
                                                </p>
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
        </div>
    );
};

export default TailorEarnings;
