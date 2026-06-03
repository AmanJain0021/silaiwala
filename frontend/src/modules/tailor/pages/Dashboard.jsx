import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
    Bell,
    Settings,
    Loader2
} from 'lucide-react';
import { useTailorAuth } from '../context/AuthContext';
import api from '../../../utils/api';
const silaiwalaLogo = '/logo.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, status } = useTailorAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/tailors/dashboard');
                if (response.data.success) {
                    setDashboardData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const summary = dashboardData?.summary || {
        totalEarnings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedThisWeek: 0,
        avgDeliveryTime: 0,
        walletBalance: 0
    };

    const recentOrders = dashboardData?.recentActivity || [];

    const stats = [
        {
            label: 'Total Orders',
            value: summary.totalOrders.toString(),
            icon: <ShoppingBag size={20} />,
            change: summary.totalOrders > 0 ? '+1' : '0',
            sub: 'this week',
            accent: '#2D2F6E',
        },
        {
            label: 'Pending',
            value: summary.pendingOrders.toString(),
            icon: <Clock size={20} />,
            change: summary.pendingOrders > 0 ? `${summary.pendingOrders} active` : 'All clear',
            sub: 'needs attention',
            accent: '#F59E0B',
        },
        {
            label: 'Completed',
            value: summary.completedThisWeek.toString(),
            icon: <CheckCircle size={20} />,
            change: 'Weekly',
            sub: 'performance',
            accent: '#10B981',
        },
        {
            label: 'Earnings',
            value: `₹${(summary.totalEarnings || 0).toLocaleString()}`,
            icon: <TrendingUp size={20} />,
            change: `Bal: ₹${(summary.walletBalance || 0).toLocaleString()}`,
            sub: 'wallet',
            accent: '#2D2F6E',
        },
    ];

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'measuring': return { bg: 'bg-[#2D2F6E]/10', text: 'text-[#2D2F6E]', dot: 'bg-[#2D2F6E]' };
            case 'cutting': return { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
            case 'stitching': return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
            case 'ironing': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
            default: return { bg: 'bg-white/5', text: 'text-white/50', dot: 'bg-white/30' };
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority.toLowerCase()) {
            case 'urgent': return 'text-[#2D2F6E] font-black';
            case 'high': return 'text-amber-400 font-bold';
            default: return 'text-white/30 font-medium';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">

            {/* ── HEADER ─────────────────────── */}
            <div className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between mb-6">
                    {/* Logo + Name */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white border-2 border-[#2D2F6E]/10 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
                            <img src={silaiwalaLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Partner Panel</p>
                            <h2 className="text-[18px] font-black text-[#2D2F6E] leading-none tracking-tight">
                                {dashboardData?.shopName || user?.name || 'Partner Shop'}
                            </h2>
                        </div>
                    </div>
                    {/* Action icons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/partner/settings')}
                            className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#2D2F6E] hover:bg-white transition-all active:scale-95 shadow-sm"
                        >
                            <Settings size={18} />
                        </button>
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2D2F6E] font-black text-lg shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                    </div>
                </div>

                {/* Greeting Banner */}
                <div className="bg-[#2D2F6E] rounded-3xl p-5 relative overflow-hidden mb-1">
                    {/* Decorative circles */}
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute right-8 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute -right-2 top-8 w-12 h-12 rounded-full bg-white/8 pointer-events-none" />

                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Welcome back 👋</p>
                    <h3 className="text-[22px] font-black text-white leading-tight mb-3">
                        {dashboardData?.tailorName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Partner'}!
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-[12px] text-white/70 font-medium">
                            <span className="text-white font-black">{summary.pendingOrders} new orders</span> waiting
                        </p>
                        <button
                            onClick={() => navigate('/partner/orders')}
                            className="bg-white text-[#2D2F6E] text-[10px] font-black uppercase px-4 py-2 rounded-xl tracking-wider flex items-center gap-1"
                        >
                            View All <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── STATS GRID ─────────────────── */}
            <div className="px-4 mt-6 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-gray-100 rounded-3xl p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Accent dot */}
                            <div
                                className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-60"
                                style={{ backgroundColor: stat.accent }}
                            />

                            {/* Icon */}
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                                style={{ backgroundColor: `${stat.accent}15`, color: stat.accent }}
                            >
                                {stat.icon}
                            </div>

                            {/* Value */}
                            <p className="text-[24px] font-black text-gray-900 leading-none mb-1 tracking-tight">{stat.value}</p>
                            <p className="text-[11px] text-gray-500 font-bold mb-3">{stat.label}</p>

                            {/* Change */}
                            <div className="flex items-center gap-1 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-100">
                                <ArrowUpRight size={10} style={{ color: stat.accent }} />
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: stat.accent }}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── ACTIVE WORK ORDERS ─────────── */}
            <div className="px-4 pb-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Work Orders</h3>
                    <button
                        onClick={() => navigate('/partner/orders')}
                        className="flex items-center gap-1 text-[#2D2F6E] text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                        See all <ChevronRight size={13} />
                    </button>
                </div>

                {/* Orders List */}
                <div className="space-y-3">
                    {recentOrders.map((order) => {
                        const st = getStatusStyle(order.status);
                        return (
                            <div
                                key={order.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Status Dot Avatar */}
                                <div className={`w-10 h-10 rounded-2xl ${st.bg} flex items-center justify-center shrink-0`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-black text-gray-900 truncate leading-tight">
                                        {order.items?.[0]?.service?.title || order.items?.[0]?.product?.name || 'Custom Job'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">
                                        {order.customerName || 'Customer'} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>

                                {/* Right Side */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${st.bg} ${st.text}`}>
                                        {order.status.replace(/-/g, ' ')}
                                    </span>
                                    <span className={`text-[9px] uppercase font-bold text-gray-400`}>
                                        #{order.orderId}
                                    </span>
                                </div>

                                {/* Update Button */}
                                <button
                                    onClick={() => navigate('/partner/orders', { state: { highlightOrderTitle: order.id } })}
                                    className="shrink-0 w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#2D2F6E] hover:text-white transition-all hover:border-[#2D2F6E]"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
