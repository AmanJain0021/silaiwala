import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Clock, CheckCircle, ChevronRight,
    Bell, Plus, Ruler, TrendingUp, ArrowUpRight, Menu, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTailorAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';

const Overview = () => {
    const { user } = useTailorAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/tailors/dashboard');
            if (response.data.success) setDashboardData(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const socket = io(SOCKET_URL);
        if (user?._id) socket.emit('join', `user_${user._id}`);
        socket.on('new_order', () => fetchDashboardData());
        return () => socket.disconnect();
    }, [user?._id]);

    const summary = dashboardData?.summary || {
        totalEarnings: 0, totalOrders: 0, pendingOrders: 0,
        completedThisWeek: 0, avgDeliveryTime: 0, walletBalance: 0
    };

    const recentActivity = dashboardData?.recentActivity || [];

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#2D2F6E] selection:text-white">
            {/* ── HEADER (MOBILE ONLY) ── */}
            <div className="md:hidden bg-white px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate('/partner/settings')} className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm bg-white">
                    <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </button>
                <h1 className="text-[16px] font-black text-[#2D2F6E] tracking-tight">SEWZELLA</h1>
                <button
                    onClick={() => navigate('/partner/notifications')}
                    className="relative"
                >
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-xs">
                        {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 bg-[#2D2F6E] rounded-full border-2 border-white" />
                    )}
                </button>
            </div>

            {/* ── CONTENT AREA ── */}
            <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
                
                {/* ── WELCOME SECTION ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Dashboard Overview</p>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                            Welcome back, {dashboardData?.tailorName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Partner'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm self-start md:self-auto">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                                <span className="text-amber-400 text-xs">⭐</span>
                                <span className="text-sm font-black text-gray-900">4.9</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">124 Reviews</span>
                        </div>
                        <div className="h-8 w-px bg-gray-100 mx-1"></div>
                        <button 
                            onClick={() => navigate('/partner/notifications')}
                            className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-[#2D2F6E] transition-colors relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#2D2F6E] rounded-full border-2 border-white"></span>}
                        </button>
                    </div>
                </div>

                {/* ── VERIFICATION STATUS BANNER ── */}
                {(dashboardData?.registrationStatus === 'pending' || dashboardData?.registrationStatus === 'rejected') && (
                    <div className={`rounded-2xl p-4 border flex items-start gap-4 ${
                        dashboardData.registrationStatus === 'rejected' 
                            ? 'bg-red-500/10 border-red-500/20' 
                            : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                        <div className={`p-2 rounded-xl mt-0.5 ${
                            dashboardData.registrationStatus === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                            <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-sm font-black ${
                                dashboardData.registrationStatus === 'rejected' ? 'text-red-700' : 'text-amber-700'
                            }`}>
                                {dashboardData.registrationStatus === 'rejected' ? 'Profile Rejected' : 'Profile Under Review'}
                            </h3>
                            <p className={`text-xs font-medium mt-1 ${
                                dashboardData.registrationStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'
                            }`}>
                                {dashboardData.registrationStatus === 'rejected' 
                                    ? dashboardData.rejectionReason || 'There were issues with your documents. Please review and update them.'
                                    : 'Your documents are currently being verified by the admin. You will be notified once approved.'
                                }
                            </p>
                        </div>
                        {dashboardData.registrationStatus === 'rejected' && (
                            <button
                                onClick={() => navigate('/partner/under-review')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                            >
                                Update Documents
                            </button>
                        )}
                    </div>
                )}

                {/* ── KEY METRICS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Total Earnings */}
                    <div className="bg-gray-900 rounded-[2rem] p-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#2D2F6E]/20 rounded-full blur-3xl group-hover:bg-[#2D2F6E]/40 transition-all"></div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Earnings</p>
                        <p className="text-3xl font-black text-white tracking-tight leading-none mb-2">
                            ₹{summary.totalEarnings.toLocaleString('en-IN') || '0'}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500">
                                <ArrowUpRight size={12} strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-black text-emerald-500">View Details</span>
                        </div>
                    </div>

                    {/* New Orders */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-[#2D2F6E]">
                            <ShoppingBag size={20} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">New Orders</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">
                            {String(summary.pendingOrders || 0).padStart(2, '0')}
                        </p>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                            <Clock size={20} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">In Progress</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">
                            {String(Math.max(summary.totalOrders - summary.completedThisWeek, 0)).padStart(2, '0')}
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Completed</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">
                            {summary.completedThisWeek || 0}
                        </p>
                    </div>
                </div>

                {/* ── BOTTOM SECTION: TWO COLUMNS ON DESKTOP ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* LEFT COLUMN (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upcoming Pickups */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Upcoming Pickups</h3>
                                <button
                                    onClick={() => navigate('/partner/orders')}
                                    className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full hover:bg-[#2D2F6E] hover:text-white transition-all"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="bg-white rounded-3xl h-20 animate-pulse border border-gray-100" />
                                    ))
                                ) : (() => {
                                    const activePickups = recentActivity.filter(o => o.status !== 'pending');
                                    if (activePickups.length === 0) {
                                        return (
                                            <div className="col-span-full p-8 text-center text-gray-400 text-sm font-bold bg-white rounded-3xl border border-gray-100 border-dashed">
                                                No recent pickups available.
                                            </div>
                                        );
                                    }
                                    return activePickups.slice(0, 4).map((order) => (
                                        <button
                                            key={order._id}
                                            onClick={() => navigate('/partner/orders', { state: { highlightOrderTitle: order.orderId } })}
                                            className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-[#2D2F6E]/20 transition-all text-left group"
                                        >
                                            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                                {order.customer?.name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900">{order.customer?.name || 'Customer'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Order #{order.orderId}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-[#2D2F6E] font-black mb-1">₹{order.totalAmount || 0}</p>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${
                                                    order.status === 'pending'
                                                        ? 'text-rose-600 bg-rose-50 border-rose-100'
                                                        : 'text-blue-600 bg-blue-50 border-blue-100'
                                                }`}>
                                                    {order.status === 'pending' ? 'NEW' : order.status.replace(/-/g, ' ')}
                                                </span>
                                            </div>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3) */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-5 tracking-tight">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => navigate('/partner/orders')}
                                    className="flex items-center gap-4 bg-[#2D2F6E] text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2D2F6E]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Plus size={18} strokeWidth={3} />
                                    </div>
                                    New Order
                                </button>
                                <button
                                    onClick={() => navigate('/partner/measurements')}
                                    className="flex items-center gap-4 bg-gray-50 border border-gray-100 text-gray-900 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#2D2F6E]">
                                        <Ruler size={18} />
                                    </div>
                                    Measurement
                                </button>
                            </div>
                        </div>

                        {/* Current Workflow */}
                        {recentActivity.find(o => ['accepted', 'cutting', 'stitching'].includes(o.status)) ? (() => {
                            const activeOrder = recentActivity.find(o => ['accepted', 'cutting', 'stitching'].includes(o.status));
                            let progress = 25;
                            if (activeOrder.status === 'cutting') progress = 50;
                            if (activeOrder.status === 'stitching') progress = 75;

                            return (
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-3 bottom-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                                        <svg width="60" height="80" viewBox="0 0 70 100" fill="none">
                                            <ellipse cx="35" cy="18" rx="12" ry="12" fill="#2D2F6E" />
                                            <path d="M10 40 Q35 30 60 40 L65 90 H5 Z" fill="#2D2F6E" />
                                        </svg>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-[#2D2F6E] rounded-full animate-ping" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Workflow</p>
                                    </div>
                                    
                                    <h4 className="text-base font-black text-gray-900 mb-6 leading-tight">
                                        Order #{activeOrder.orderId}<br />
                                        <span className="text-sm font-bold text-gray-500">for {activeOrder.customer?.name || 'Customer'}</span>
                                    </h4>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{activeOrder.status.replace(/-/g, ' ')}</span>
                                            <span className="text-xs font-black text-[#2D2F6E]">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#2D2F6E] rounded-full shadow-[0_0_10px_rgba(45,47,110,0.3)] transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate('/partner/orders', { state: { highlightOrderTitle: activeOrder.orderId } })}
                                            className="w-full py-3 bg-gray-50 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:bg-gray-100 transition-all"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 border-dashed shadow-sm flex flex-col items-center justify-center text-center h-48">
                                <Clock size={24} className="text-gray-300 mb-3" />
                                <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">No Active<br/>Workflows</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
