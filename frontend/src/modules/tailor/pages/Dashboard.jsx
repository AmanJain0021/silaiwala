import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
    Bell,
    Settings
} from 'lucide-react';
import { useTailorAuth } from '../context/AuthContext';
const silaiwalaLogo = '/logo.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, status } = useTailorAuth();

    const stats = [
        {
            label: 'Total Orders',
            value: '48',
            icon: <ShoppingBag size={20} />,
            change: '+12%',
            sub: 'from last month',
            accent: '#2D2F6E',
        },
        {
            label: 'Pending',
            value: '12',
            icon: <Clock size={20} />,
            change: '4 overdue',
            sub: 'needs attention',
            accent: '#F59E0B',
        },
        {
            label: 'Completed',
            value: '32',
            icon: <CheckCircle size={20} />,
            change: '+5',
            sub: 'today',
            accent: '#10B981',
        },
        {
            label: 'Earnings',
            value: '₹14.5K',
            icon: <TrendingUp size={20} />,
            change: '₹450',
            sub: 'avg / order',
            accent: '#2D2F6E',
        },
    ];

    const recentOrders = [
        { id: 'ORD-7214', customer: 'Priya Sharma', service: 'Anarkali Suit', date: '21 Feb 2024', status: 'Measuring', priority: 'High' },
        { id: 'ORD-7215', customer: 'Rahul Verma', service: 'Sherwani Stitching', date: '22 Feb 2024', status: 'Cutting', priority: 'Normal' },
        { id: 'ORD-7216', customer: 'Sneha Patel', service: 'Blouse Alteration', date: '22 Feb 2024', status: 'Stitching', priority: 'Urgent' },
        { id: 'ORD-7217', customer: 'Amit Gupta', service: 'Suit Fitting', date: '23 Feb 2024', status: 'Ironing', priority: 'Normal' },
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
        <div className="min-h-screen bg-[#0A0A0A]">

            {/* ── HEADER ─────────────────────── */}
            <div className="px-5 pt-6 pb-4 bg-[#0A0A0A]">
                <div className="flex items-center justify-between mb-6">
                    {/* Logo + Name */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#161616] border border-[#2A2A2A] rounded-2xl flex items-center justify-center p-1.5 overflow-hidden">
                            <img src={silaiwalaLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">Partner Panel</p>
                            <h2 className="text-[17px] font-black text-white leading-none tracking-tight">
                                {user?.name || 'Royal Stitches'}
                            </h2>
                        </div>
                    </div>
                    {/* Action icons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/partner/settings')}
                            className="w-10 h-10 bg-[#161616] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        >
                            <Settings size={17} />
                        </button>
                        <div className="w-10 h-10 bg-[#2D2F6E] rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#2D2F6E]/30">
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
                        {user?.name?.split(' ')[0] || 'Royal Stitches'}!
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-[12px] text-white/70 font-medium">
                            <span className="text-white font-black">3 new orders</span> waiting
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
            <div className="px-5 mb-5">
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-4 relative overflow-hidden"
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
                            <p className="text-[26px] font-black text-white leading-none mb-1">{stat.value}</p>
                            <p className="text-[11px] text-white/40 font-medium mb-2">{stat.label}</p>

                            {/* Change */}
                            <div className="flex items-center gap-1">
                                <ArrowUpRight size={11} style={{ color: stat.accent }} />
                                <span className="text-[10px] font-bold" style={{ color: stat.accent }}>
                                    {stat.change}
                                </span>
                                <span className="text-[10px] text-white/25 font-medium">{stat.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── ACTIVE WORK ORDERS ─────────── */}
            <div className="px-5 pb-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-black text-white">Active Work Orders</h3>
                    <button
                        onClick={() => navigate('/partner/orders')}
                        className="flex items-center gap-1 text-[#2D2F6E] text-[11px] font-bold"
                    >
                        See all <ChevronRight size={13} />
                    </button>
                </div>

                {/* Orders List */}
                <div className="space-y-2.5">
                    {recentOrders.map((order) => {
                        const st = getStatusStyle(order.status);
                        return (
                            <div
                                key={order.id}
                                className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-4 flex items-center gap-3"
                            >
                                {/* Status Dot Avatar */}
                                <div className={`w-10 h-10 rounded-2xl ${st.bg} flex items-center justify-center shrink-0`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-black text-white truncate leading-tight">{order.service}</p>
                                    <p className="text-[10px] text-white/35 font-medium mt-0.5 truncate">{order.customer} · {order.date}</p>
                                </div>

                                {/* Right Side */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${st.bg} ${st.text}`}>
                                        {order.status}
                                    </span>
                                    <span className={`text-[9px] uppercase font-bold ${getPriorityStyle(order.priority)}`}>
                                        {order.priority}
                                    </span>
                                </div>

                                {/* Update Button */}
                                <button
                                    onClick={() => navigate('/partner/orders', { state: { highlightOrderTitle: order.id } })}
                                    className="shrink-0 w-8 h-8 bg-[#2D2F6E]/10 rounded-xl flex items-center justify-center text-[#2D2F6E] hover:bg-[#2D2F6E] hover:text-white transition-all"
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
