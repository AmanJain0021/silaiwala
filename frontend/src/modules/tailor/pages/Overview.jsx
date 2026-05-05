import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Clock, CheckCircle, ChevronRight,
    Bell, Plus, Ruler, TrendingUp, ArrowUpRight, Menu
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
        <div className="min-h-full bg-[#F5F5F5] flex flex-col">

            {/* ── HEADER ── */}
            <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate('/partner/settings')} className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm bg-white">
                    <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </button>
                <h1 className="text-[17px] font-black text-[#2D2F6E] tracking-tight">SEWZELLA</h1>
                <button
                    onClick={() => navigate('/partner/notifications')}
                    className="relative"
                >
                    <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-[#2D2F6E] rounded-full border-2 border-white" />
                    )}
                </button>
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div className="flex-1 overflow-y-auto pb-24">

                {/* ── WELCOME SECTION ── */}
                <div className="px-5 pt-5 pb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dashboard Overview</p>
                    <h2 className="text-[24px] font-black text-gray-900 leading-tight">
                        Welcome back,<br />{user?.name || 'Ramesh Tailors'}
                    </h2>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-amber-400 text-sm">⭐</span>
                        <span className="text-[13px] font-bold text-gray-700">4.9</span>
                        <span className="text-[12px] text-gray-400 font-medium">(124 Reviews)</span>
                    </div>
                </div>

                {/* ── TOTAL EARNINGS CARD ── */}
                <div className="px-5 mb-4">
                    <div className="bg-[#2D3748] rounded-3xl p-6 relative overflow-hidden">
                        {/* Faded wallet icon */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                            <div className="w-24 h-24 border-4 border-white rounded-3xl flex items-center justify-center">
                                <TrendingUp size={40} color="white" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Total Earnings</p>
                        <p className="text-[34px] font-black text-white tracking-tight leading-none mb-3">
                            ₹{summary.totalEarnings > 0 ? summary.totalEarnings.toLocaleString('en-IN') : '42,850'}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <ArrowUpRight size={14} color="#10B981" strokeWidth={3} />
                            <span className="text-[12px] font-bold text-[#10B981]">+12% this month</span>
                        </div>
                    </div>
                </div>

                {/* ── STATS GRID ── */}
                <div className="px-5 mb-5">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* New Orders */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
                                <ShoppingBag size={20} color="#2D2F6E" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">New Orders</p>
                            <p className="text-[28px] font-black text-gray-900 leading-none">
                                {String(summary.pendingOrders || 12).padStart(2, '0')}
                            </p>
                        </div>

                        {/* In Progress */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                <Clock size={20} color="#3B82F6" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">In Progress</p>
                            <p className="text-[28px] font-black text-gray-900 leading-none">
                                {String(summary.totalOrders > 0 ? Math.max(summary.totalOrders - summary.completedThisWeek, 0) : 8).padStart(2, '0')}
                            </p>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle size={20} color="#10B981" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Completed</p>
                            <p className="text-[28px] font-black text-gray-900 leading-none">
                                {summary.completedThisWeek > 0 ? summary.completedThisWeek : 156}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="px-5 mb-5">
                    <h3 className="text-[16px] font-black text-gray-900 mb-3">Quick Actions</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/partner/orders')}
                            className="flex items-center gap-2 bg-[#2D2F6E] text-white px-5 py-3 rounded-2xl font-bold text-[13px] shadow-md shadow-[#2D2F6E]/25 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} />
                            New Order
                        </button>
                        <button
                            onClick={() => navigate('/partner/measurements')}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-bold text-[13px] shadow-sm active:scale-95 transition-all"
                        >
                            <Ruler size={16} />
                            New Measurement
                        </button>
                    </div>
                </div>

                {/* ── UPCOMING PICKUPS ── */}
                <div className="px-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[16px] font-black text-gray-900">Upcoming Pickups</h3>
                        <button
                            onClick={() => navigate('/partner/orders')}
                            className="text-[11px] font-black text-[#2D2F6E] uppercase tracking-wider"
                        >
                            VIEW ALL
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2].map(i => (
                                <div key={i} className="bg-white rounded-3xl h-20 animate-pulse border border-gray-100" />
                            ))
                        ) : recentActivity.length === 0 ? (
                            /* Fallback static cards matching Figma */
                            <>
                                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0">AS</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-black text-gray-900">Arjun Sharma</p>
                                        <p className="text-[11px] text-gray-400 font-medium">Order #ALT-2041 • 3 Items</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] text-gray-500 font-medium mb-1">Today, 4:00 PM</p>
                                        <span className="text-[9px] font-black text-[#2D2F6E] bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">RUSH</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0">PV</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-black text-gray-900">Priya Verma</p>
                                        <p className="text-[11px] text-gray-400 font-medium">Order #ALT-1988 • 1 Item</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] text-gray-500 font-medium mb-1">Tomorrow, 11:00 AM</p>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">STANDARD</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            recentActivity.slice(0, 3).map((order, i) => (
                                <button
                                    key={order._id}
                                    onClick={() => navigate('/partner/orders', { state: { highlightOrderTitle: order.orderId } })}
                                    className="w-full bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all"
                                >
                                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0">
                                        {order.customerName?.charAt(0) || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[14px] font-black text-gray-900">{order.customerName}</p>
                                        <p className="text-[11px] text-gray-400 font-medium">Order #{order.orderId?.split('-')[1]}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] text-gray-500 font-medium mb-1">₹{order.totalAmount}</p>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            order.status === 'pending'
                                                ? 'text-[#2D2F6E] bg-red-50 border border-red-100'
                                                : 'text-blue-600 bg-blue-50 border border-blue-100'
                                        }`}>
                                            {order.status === 'pending' ? 'RUSH' : 'STANDARD'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── CURRENT WORKFLOW CARD ── */}
                <div className="px-5 mb-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                        {/* Silhouette figure - decorative */}
                        <div className="absolute right-4 bottom-0 opacity-8 pointer-events-none">
                            <svg width="70" height="100" viewBox="0 0 70 100" fill="none">
                                <ellipse cx="35" cy="18" rx="12" ry="12" fill="#E5E7EB" />
                                <path d="M10 40 Q35 30 60 40 L65 90 H5 Z" fill="#E5E7EB" />
                                <rect x="5" y="40" width="14" height="40" rx="7" fill="#E5E7EB" />
                                <rect x="51" y="40" width="14" height="40" rx="7" fill="#E5E7EB" />
                            </svg>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Current Workflow</p>
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 mb-4 leading-snug">
                            3-Piece Tuxedo for<br />Mr. Kapoor
                        </h4>

                        {/* Progress bar */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] text-gray-400 font-medium">Progress</span>
                                <span className="text-[12px] font-black text-gray-700">75%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2D2F6E] rounded-full" style={{ width: '75%' }} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/partner/orders')}
                                className="flex-1 py-3 bg-white border border-gray-200 rounded-2xl text-[12px] font-black text-gray-700 uppercase tracking-wide active:scale-95 transition-all"
                            >
                                Details
                            </button>
                            <button
                                onClick={() => navigate('/partner/orders')}
                                className="flex-1 py-3 bg-[#2D2F6E] rounded-2xl text-[12px] font-black text-white uppercase tracking-wide shadow-md shadow-[#2D2F6E]/25 active:scale-95 transition-all"
                            >
                                Mark Ready
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Overview;
