import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    Scissors,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    Truck,
    CreditCard
} from 'lucide-react';
import api from '../../../utils/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState({
        totalRevenue: '₹0',
        activeOrders: 0,
        totalTailors: 0,
        pendingPayouts: '₹0',
    });
    const [liveOrders, setLiveOrders] = useState([]);
    const [topTailorsData, setTopTailorsData] = useState([]);
    const [revenueChartData, setRevenueChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/admin/dashboard');
                const { stats, recentOrders: apiRecentOrders, topTailors: apiTopTailors, revenueChart } = response.data;
                const { totalRevenue, activeOrdersCount, totalTailors, pendingTailorsCount, pendingPayouts } = stats;

                setStatsData({
                    totalRevenue: `₹${totalRevenue.toLocaleString()}`,
                    activeOrders: activeOrdersCount,
                    totalTailors: totalTailors,
                    pendingTailorsCount: pendingTailorsCount || 0,
                    pendingPayouts: `₹${(pendingPayouts || 0).toLocaleString()}`,
                });

                if (apiRecentOrders && apiRecentOrders.length > 0) {
                    const formatted = apiRecentOrders.map(o => ({
                        id: o.orderId || o._id.substring(0, 8),
                        service: o.items?.[0]?.service?.title || o.items?.[0]?.product?.name || 'Custom Job',
                        customer: o.customer?.name || 'Customer',
                        tailor: o.tailor?.name || 'Unassigned',
                        amount: `₹${(o.totalAmount || 0).toLocaleString()}`,
                        status: o.status
                    }));
                    setLiveOrders(formatted);
                }

                if (apiTopTailors && apiTopTailors.length > 0) {
                    setTopTailorsData(apiTopTailors);
                }

                if (revenueChart && revenueChart.length > 0) {
                    setRevenueChartData(revenueChart);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

        // Socket setup for real-time updates
        const socket = io(SOCKET_URL);

        socket.on('new_order', () => {
            fetchDashboardData();
        });

        socket.on('order_status_updated', () => {
            fetchDashboardData();
        });

        socket.on('task_claimed', () => {
            fetchDashboardData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const stats = [
        { label: 'Total Revenue', value: statsData.totalRevenue, icon: <TrendingUp size={20} /> },
        { label: 'Platform Orders', value: statsData.activeOrders, icon: <ShoppingBag size={20} /> },
        { label: 'Total Tailors', value: statsData.totalTailors, icon: <Scissors size={20} /> },
        { label: 'Pending Payouts', value: statsData.pendingPayouts, icon: <CreditCard size={20} /> },
    ];

    const getStatusStyle = (status) => {
        if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
        const s = status.toLowerCase();
        if (s === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (s === 'cancelled' || s === 'failed-delivery') return 'bg-red-100 text-red-700 border-red-200';
        if (s.includes('progress') || s.includes('production') || s.includes('stitching')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (s.includes('ready')) return 'bg-purple-100 text-purple-700 border-purple-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const maxRevenue = revenueChartData.length > 0 ? Math.max(...revenueChartData.map(d => d.revenue)) : 0;

    return (
        <div className="space-y-6 lg:space-y-10">
            {/* Header section is in layout, just need page content here */}
            {isLoading && (
                <div className="w-full h-1 bg-gray-100 overflow-hidden rounded-full absolute top-0 left-0 z-50">
                    <div className="h-full bg-primary animate-pulse w-1/3 rounded-full"></div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group overflow-hidden relative"
                    >
                        <div className="absolute -right-2 -top-2 h-16 w-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div className="p-3 bg-gray-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                {stat.icon}
                            </div>
                            {stat.change && (
                                <div className={`flex items-center gap-1 text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg ${stat.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {stat.change}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 lg:mt-5 relative z-10">
                            <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{stat.label}</h3>
                            <p className="text-xl lg:text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

                {/* Left Column (Wider) */}
                <div className="xl:col-span-2 space-y-6 lg:space-y-8">

                    {/* Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-5 lg:p-8 rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight">Revenue Overview</h3>
                                <p className="text-[10px] lg:text-xs text-gray-400 mt-1 font-medium">Weekly transaction volume across marketplace</p>
                            </div>
                            <select className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 outline-none">
                                <option>This Week</option>
                                <option>Last Week</option>
                                <option>This Month</option>
                            </select>
                        </div>

                        {/* Custom Bar Chart built with Tailwind */}
                        <div className="h-48 lg:h-64 flex items-end justify-between gap-2 lg:gap-4 mt-8 pb-4 border-b border-gray-50 relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-full border-b border-gray-50 flex items-end pb-1">
                                        <span className="text-[8px] lg:text-[10px] text-gray-300 font-bold -translate-y-2">{(maxRevenue - (maxRevenue / 3) * i).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>

                            {revenueChartData.map((data, idx) => (
                                <div key={idx} className="flex flex-col items-center flex-1 z-10 group">
                                    <div className="relative w-full max-w-[40px] flex justify-center flex-1 items-end">
                                        <div
                                            className="w-full bg-indigo-100/50 rounded-t-lg group-hover:bg-[#2D2F6E] transition-all duration-300 relative"
                                            style={{ height: `${(data.revenue / (maxRevenue || 1)) * 100}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap transition-all z-20">
                                                ₹{data.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 mt-3 uppercase tracking-tighter">{data.name}</span>
                                </div>
                            ))}
                            {revenueChartData.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No Revenue Data Yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Orders Table */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 lg:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight">Recent Orders</h3>
                                <p className="text-[10px] lg:text-xs text-gray-400 mt-1 font-medium">Live marketplace activity</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 lg:p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl transition-all border border-gray-100">
                                    <Search size={16} className="lg:w-[18px] lg:h-[18px]" />
                                </button>
                                <button className="p-2 lg:p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl transition-all border border-gray-100">
                                    <Filter size={16} className="lg:w-[18px] lg:h-[18px]" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                                        <th className="px-5 lg:px-8 py-4">Order Details</th>
                                        <th className="px-5 lg:px-8 py-4">Assigned Tailor</th>
                                        <th className="px-5 lg:px-8 py-4">Amount</th>
                                        <th className="px-5 lg:px-8 py-4">Status</th>
                                        <th className="px-5 lg:px-8 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-5 lg:px-8 py-4 lg:py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] lg:text-xs font-black text-primary uppercase">{order.id}</span>
                                                    <span className="text-xs lg:text-sm font-bold text-gray-900 mt-0.5">{order.service}</span>
                                                    <span className="text-[9px] lg:text-[10px] text-gray-400 font-medium">Customer: {order.customer}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 lg:h-7 lg:w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                        {order.tailor.charAt(0)}
                                                    </div>
                                                    <span className="text-[10px] lg:text-xs font-bold text-gray-700">{order.tailor}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm font-black text-gray-900">{order.amount}</td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5">
                                                <span className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                                    {order.status.replace(/-/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 lg:px-8 py-4 lg:py-5 text-right">
                                                <button className="text-gray-300 hover:text-primary transition-colors p-1.5 lg:p-2 hover:bg-gray-50 rounded-lg">
                                                    <MoreHorizontal size={18} className="lg:w-[20px] lg:h-[20px]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {liveOrders.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                No recent orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 lg:p-6 border-t border-gray-50 bg-gray-50/50 text-center">
                            <button className="text-[10px] lg:text-xs font-black text-primary uppercase tracking-[0.1em] hover:underline">
                                View Full Marketplace Ledger
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar Widgets) */}
                <div className="space-y-6 lg:space-y-8">

                    {/* Action Widget */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#2D2F6E] p-6 lg:p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group border border-pink-400/20"
                    >
                        <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
                            <Scissors size={120} />
                        </div>
                        <h4 className="text-lg lg:text-xl font-black tracking-tight relative z-10">Tailor Applications</h4>
                        <div className="mt-3 space-y-1 relative z-10">
                            <p className="text-white font-bold text-xs">Verification Needed</p>
                            <p className="text-indigo-100/80 text-[11px] font-medium leading-relaxed max-w-[200px]">
                                You have <span className="text-white font-black underline decoration-white/30 underline-offset-4">{statsData.pendingTailorsCount || 0} applications</span> waiting for document KYC verification.
                            </p>
                        </div>
                        <Link to="/admin/tailors" className="mt-8 w-full py-4 bg-white text-[#2D2F6E] font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-indigo-50 hover:shadow-xl transition-all active:scale-95 relative z-10 flex items-center justify-center shadow-lg shadow-indigo-900/10">
                            Review Applications
                        </Link>
                    </motion.div>

                    {/* Top Tailors */}
                    <div className="bg-white border border-gray-100 p-6 lg:p-8 rounded-[2rem] shadow-sm">
                        <h4 className="text-base lg:text-lg font-black text-gray-900 tracking-tight flex items-center justify-between">
                            Top Tailors
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest cursor-pointer hover:text-primary">View All</span>
                        </h4>
                        <div className="mt-6 space-y-4">
                            {topTailorsData.map((tailor, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-primary font-bold text-xs lg:text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                            {tailor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-bold text-gray-900">{tailor.name}</p>
                                            <p className="text-[9px] lg:text-[10px] text-gray-400 font-medium">{tailor.completedOrders} Orders</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-600 font-bold text-[10px]">
                                        ★ {tailor.rating}
                                    </div>
                                </div>
                            ))}
                            {topTailorsData.length === 0 && !isLoading && (
                                <p className="text-center text-[10px] font-bold text-gray-400 py-4 uppercase tracking-widest">No top performers yet</p>
                            )}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-white border border-gray-100 p-6 lg:p-8 rounded-[2rem] shadow-sm">
                        <h4 className="text-base lg:text-lg font-black text-gray-900 tracking-tight">System Health</h4>
                        <div className="mt-6 space-y-3 lg:space-y-4">
                            {[
                                { label: 'Payment Gateway', status: 'Healthy', color: 'bg-green-500' },
                                { label: 'Partner APIs', status: 'Healthy', color: 'bg-green-500' },
                                { label: 'Cloud DB', status: 'Maintenance', color: 'bg-orange-500' },
                                { label: 'Push Notifications', status: 'Degraded', color: 'bg-yellow-500' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-xl lg:rounded-2xl border border-gray-100/50">
                                    <span className="text-[10px] lg:text-xs font-bold text-gray-600 flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-gray-400" />
                                        {item.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full ${item.color} shadow-sm`}></span>
                                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
