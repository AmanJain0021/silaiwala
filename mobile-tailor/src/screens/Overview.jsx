// Port of modules/tailor/pages/Overview.jsx (converted with scripts/web2rn.js, then reviewed)
import Svg, { Path, Ellipse } from 'react-native-svg';
import React, { useState, useEffect } from "react";
import { ShoppingBag, Clock, CheckCircle, ChevronRight, Bell, Plus, Ruler, TrendingUp, ArrowUpRight, Menu, ShieldAlert, Star } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import { useTailorAuth } from "../context/tailor/AuthContext";
import { useNotifications } from "../context/tailor/NotificationContext";
import api from "../lib/api";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import { getToken } from "../lib/auth";
import toast from '../lib/toast';
import { Box, Txt, I, Btn, Scroll } from '../components/ui/primitives';
const Overview = () => {
  const {
    user
  } = useTailorAuth();
  const {
    unreadCount
  } = useNotifications();
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
    const socket = io(SOCKET_URL, {
      auth: {
        token: getToken()
      }
    });
    const userId = user?._id || user?.id;
    if (userId) socket.emit('join', `user_${userId}`);
    socket.on('new_order', data => {
      fetchDashboardData();
      if (data?.orderId) {
        toast.success(`New Order Received: #${data.orderId}`, {
          icon: '👕',
          style: {
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
      } else {
        toast.success('You have received a new order!');
      }
    });
    return () => {
      socket.off('new_order');
    };
  }, [user?._id]);
  const summary = dashboardData?.summary || {
    totalEarnings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedThisWeek: 0,
    avgDeliveryTime: 0,
    walletBalance: 0
  };
  const recentActivity = dashboardData?.recentActivity || [];
  return <Box className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white">
            {/* ── CONTENT AREA ── */}
            <Box className="flex-1 p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-24 md:pb-12">
                
                {/* ── WELCOME SECTION (DESKTOP & MOBILE) ── */}
                <Box className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-2">
                    <Box>
                        <Txt className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest md:tracking-[0.2em] mb-0.5 md:mb-1">Dashboard Overview</Txt>
                        <Txt className="text-xl md:text-3xl font-black text-gray-900 leading-tight truncate">
                            Welcome back, {dashboardData?.tailorName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Partner'}
                        </Txt>
                    </Box>
                    <Box className="hidden md:flex items-center gap-4 bg-gray-900 px-5 py-3 rounded-[1.25rem] shadow-xl shadow-[#843D9B]/10 border border-[#843D9B]/30 self-start md:self-auto">
                        <Box className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <I icon={Star} size={20} className="text-amber-400 fill-amber-400" />
                        </Box>
                        <Box className="flex flex-col">
                            <Txt className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">Your Rating</Txt>
                            <Box className="flex items-baseline gap-1.5">
                                <Txt className="text-xl font-black text-white leading-none">{(summary.rating || 0).toFixed(1)}</Txt>
                                <Txt className="text-xs font-bold text-amber-400 leading-none">/ 5.0</Txt>
                            </Box>
                        </Box>
                        <Box className="h-10 w-px bg-white/10 mx-1"></Box>
                        <Box className="flex flex-col items-end">
                            <Txt className="text-lg font-black text-white leading-none">{summary.totalReviews || 0}</Txt>
                            <Txt className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Reviews</Txt>
                        </Box>
                        <Box className="h-10 w-px bg-white/10 mx-1"></Box>
                        <Btn onPress={() => navigate('/partner/notifications')} className="p-2.5 bg-white/10 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all relative border border-white/5 flex items-center justify-center">
                            <I icon={Bell} size={20} />
                            {unreadCount > 0 && <Txt className="absolute -top-2 -right-2 h-5 w-5 bg-rose-500 rounded-full border-[2px] border-gray-900 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Txt>}
                        </Btn>
                    </Box>
                </Box>

                {/* ── MOBILE RATING BAR ── */}
                <Box className="md:hidden w-full flex items-center justify-between bg-gradient-to-r from-gray-900 to-[#843D9B] p-3 rounded-2xl shadow-lg shadow-[#843D9B]/10 border border-[#843D9B]/30 text-white mb-2">
                    <Box className="flex items-center gap-3">
                        <Box className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <I icon={Star} size={20} className="text-amber-400 fill-amber-400" />
                        </Box>
                        <Box className="flex flex-col">
                            <Txt className="text-[9px] font-black text-white/60 uppercase tracking-widest">Your Rating</Txt>
                            <Box className="flex items-end gap-1 leading-none mt-0.5">
                                <Txt className="text-xl font-black text-white">{(summary.rating || 0).toFixed(1)}</Txt>
                                <Txt className="text-[10px] font-bold text-amber-400 pb-0.5">/ 5.0</Txt>
                            </Box>
                        </Box>
                    </Box>
                    <Box className="h-8 w-px bg-white/10 mx-2"></Box>
                    <Box className="flex flex-col items-end pr-1">
                        <Txt className="text-sm font-black text-white leading-none">{summary.totalReviews || 0}</Txt>
                        <Txt className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">Total Reviews</Txt>
                    </Box>
                </Box>

                {/* ── VERIFICATION STATUS BANNER ── */}
                {(dashboardData?.registrationStatus === 'pending' || dashboardData?.registrationStatus === 'rejected') && <Box className={`rounded-xl md:rounded-2xl p-3 md:p-4 border flex items-start gap-3 md:gap-4 ${dashboardData.registrationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <Box className={`p-1.5 md:p-2 rounded-lg md:rounded-xl mt-0.5 ${dashboardData.registrationStatus === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                            <I icon={ShieldAlert} size={16} className="md:w-5 md:h-5" />
                        </Box>
                        <Box className="flex-1">
                            <Txt className={`text-xs md:text-sm font-black ${dashboardData.registrationStatus === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                                {dashboardData.registrationStatus === 'rejected' ? 'Profile Rejected' : 'Profile Under Review'}
                            </Txt>
                            <Txt className={`text-[10px] md:text-xs font-medium mt-0.5 md:mt-1 ${dashboardData.registrationStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                                {dashboardData.registrationStatus === 'rejected' ? dashboardData.rejectionReason || 'There were issues with your documents. Please review and update them.' : 'Your documents are currently being verified by the admin. You will be notified once approved.'}
                            </Txt>
                        </Box>
                        {dashboardData.registrationStatus === 'rejected' && <Btn onPress={() => navigate('/partner/under-review')} className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl transition-colors shrink-0">
                                Update Documents
                            </Btn>}
                    </Box>}

                {/* ── KEY METRICS ── */}
                <Box className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {/* Total Earnings */}
                    <Btn onPress={() => navigate('/partner/wallet')} className="block bg-gray-900 rounded-2xl md:rounded-[2rem] p-4 md:p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-gray-900/20 active:scale-95 transition-all duration-300 flex flex-col justify-between">
                        <Box className="absolute -right-4 -bottom-4 w-16 h-16 md:w-24 md:h-24 bg-[#843D9B]/20 rounded-full blur-2xl md:blur-3xl group-hover:bg-[#843D9B]/40 transition-all"></Box>
                        <Txt className="text-[8px] md:text-[10px] font-black text-white/50 uppercase tracking-wider md:tracking-widest mb-1 md:mb-2 truncate">Total Earnings</Txt>
                        <Txt className="text-lg md:text-3xl font-black text-white tracking-tight leading-none mb-2 md:mb-2 truncate">
                            ₹{summary.totalEarnings.toLocaleString('en-IN') || '0'}
                        </Txt>
                        <Box className="flex items-center gap-1 md:gap-1.5 mt-auto">
                            <Box className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform shrink-0">
                                <I icon={ArrowUpRight} size={10} className="md:w-3 md:h-3" strokeWidth={3} />
                            </Box>
                            <Txt className="text-[8px] md:text-[11px] font-black text-emerald-500 truncate">View Details</Txt>
                        </Box>
                    </Btn>

                    {/* New Orders */}
                    <Btn onPress={() => navigate('/partner/orders', {
          state: {
            status: 'pending'
          }
        })} className="block bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 active:scale-95 transition-all duration-300 group flex flex-col">
                        <Box className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 text-[#843D9B] group-hover:scale-110 group-hover:bg-[#843D9B] group-hover:text-white transition-all shrink-0">
                            <I icon={ShoppingBag} size={16} className="md:w-5 md:h-5" />
                        </Box>
                        <Box className="mt-auto">
                            <Txt className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-wider md:tracking-widest mb-1 truncate">New Orders</Txt>
                            <Txt className="text-xl md:text-3xl font-black text-gray-900 leading-none truncate">
                                {String(summary.pendingOrders || 0).padStart(2, '0')}
                            </Txt>
                        </Box>
                    </Btn>

                    {/* In Progress */}
                    <Btn onPress={() => navigate('/partner/orders', {
          state: {
            status: 'in-progress'
          }
        })} className="block bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-100 active:scale-95 transition-all duration-300 group flex flex-col">
                        <Box className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <I icon={Clock} size={16} className="md:w-5 md:h-5" />
                        </Box>
                        <Box className="mt-auto">
                            <Txt className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-wider md:tracking-widest mb-1 truncate">In Progress</Txt>
                            <Txt className="text-xl md:text-3xl font-black text-gray-900 leading-none truncate">
                                {String(Math.max(summary.totalOrders - summary.completedThisWeek, 0)).padStart(2, '0')}
                            </Txt>
                        </Box>
                    </Btn>

                    {/* Completed */}
                    <Btn onPress={() => navigate('/partner/orders', {
          state: {
            status: 'completed'
          }
        })} className="block bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-100 active:scale-95 transition-all duration-300 group flex flex-col">
                        <Box className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                            <I icon={CheckCircle} size={16} className="md:w-5 md:h-5" />
                        </Box>
                        <Box className="mt-auto">
                            <Txt className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-wider md:tracking-widest mb-1 truncate">Completed</Txt>
                            <Txt className="text-xl md:text-3xl font-black text-gray-900 leading-none truncate">
                                {summary.completedThisWeek || 0}
                            </Txt>
                        </Box>
                    </Btn>
                </Box>

                {/* ── BOTTOM SECTION: TWO COLUMNS ON DESKTOP ── */}
                <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* LEFT COLUMN (2/3) */}
                    <Box className="lg:col-span-2 space-y-6">
                        {/* Upcoming Pickups */}
                        <Box>
                            <Box className="flex items-center justify-between mb-4 px-2">
                                <Txt className="text-lg font-black text-gray-900 tracking-tight">Upcoming Pickups</Txt>
                                <Btn onPress={() => navigate('/partner/orders')} className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full hover:bg-[#843D9B] hover:text-white transition-all">
                                    View All
                                </Btn>
                            </Box>

                            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoading ? [1, 2].map(i => <Box key={i} className="bg-white rounded-3xl h-20 animate-pulse border border-gray-100" />) : (() => {
                const activePickups = dashboardData?.upcomingPickups || [];
                if (activePickups.length === 0) {
                  return <Box className="col-span-full p-8 text-center text-gray-400 text-sm font-bold bg-white rounded-3xl border border-gray-100 border-dashed">
                                                No upcoming pickups scheduled.
                                            </Box>;
                }
                return activePickups.map(order => <Btn key={order._id} onPress={() => navigate('/partner/orders', {
                  state: {
                    highlightOrderTitle: order.orderId
                  }
                })} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-[#843D9B]/20 transition-all text-left group">
                                            <Box className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                                {order.customer?.name?.charAt(0) || 'C'}
                                            </Box>
                                            <Box className="flex-1 min-w-0">
                                                <Txt className="text-sm font-black text-gray-900">{order.customer?.name || 'Customer'}</Txt>
                                                <Txt className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Order #{order.orderId}</Txt>
                                            </Box>
                                            <Box className="text-right">
                                                <Txt className="text-[10px] text-[#843D9B] font-black mb-1">₹{Math.round(Number(order.tailorEarning) || (order.items || []).reduce((s, it) => s + ((Number(it.price) || 0) + (it.styleAddons || []).reduce((t, a) => t + (Number(a?.price) || 0), 0)) * (Number(it.quantity) || 1), 0))}</Txt>
                                                <Txt className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${order.status === 'pending' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                                    {order.status === 'pending' ? 'NEW' : order.status.replace(/-/g, ' ')}
                                                </Txt>
                                            </Box>
                                        </Btn>);
              })()}
                            </Box>
                        </Box>
                    </Box>

                    {/* RIGHT COLUMN (1/3) */}
                    <Box className="space-y-6">
                        {/* Quick Actions */}
                        <Box className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-gray-100 shadow-sm">
                            <Txt className="text-sm md:text-lg font-black text-gray-900 mb-3 md:mb-5 tracking-tight">Quick Actions</Txt>
                            <Box className="grid grid-cols-1 gap-2 md:gap-3">
                                <Btn onPress={() => navigate('/partner/orders')} className="flex items-center gap-3 bg-[#843D9B] text-white px-4 py-2.5 md:p-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-[#843D9B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                    <Box className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                                        <I icon={Plus} size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={3} />
                                    </Box>
                                    New Order
                                </Btn>
                                <Btn onPress={() => navigate('/partner/measurements')} className="flex items-center gap-3 bg-gray-50 border border-gray-100 text-gray-900 px-4 py-2.5 md:p-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all">
                                    <Box className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm text-[#843D9B] shrink-0">
                                        <I icon={Ruler} size={16} className="md:w-[18px] md:h-[18px]" />
                                    </Box>
                                    Measurement
                                </Btn>
                            </Box>
                        </Box>

                        {/* Current Workflow */}
                        {recentActivity.find(o => ['accepted', 'cutting', 'stitching'].includes(o.status)) ? (() => {
            const activeOrder = recentActivity.find(o => ['accepted', 'cutting', 'stitching'].includes(o.status));
            let progress = 25;
            if (activeOrder.status === 'cutting') progress = 50;
            if (activeOrder.status === 'stitching') progress = 75;
            return <Box className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <Box className="absolute right-3 bottom-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                                        <Svg width={70} height={100} viewBox="0 0 70 100" fill="none"><Ellipse cx="35" cy="18" rx="12" ry="12" fill="#843D9B" /><Path d="M10 40 Q35 30 60 40 L65 90 H5 Z" fill="#843D9B" /></Svg>
                                    </Box>

                                    <Box className="flex items-center gap-2 mb-4">
                                        <Box className="w-2 h-2 bg-[#843D9B] rounded-full animate-ping" />
                                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Workflow</Txt>
                                    </Box>
                                    
                                    <Txt className="text-base font-black text-gray-900 mb-6 leading-tight">
                                        Order #{activeOrder.orderId}

                                        <Txt className="text-sm font-bold text-gray-500">for {activeOrder.customer?.name || 'Customer'}</Txt>
                                    </Txt>

                                    <Box className="mb-6">
                                        <Box className="flex justify-between items-center mb-2">
                                            <Txt className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{activeOrder.status.replace(/-/g, ' ')}</Txt>
                                            <Txt className="text-xs font-black text-[#843D9B]">{progress}%</Txt>
                                        </Box>
                                        <Box className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <Box className="h-full bg-[#843D9B] rounded-full shadow-[0_0_10px_rgba(45,47,110,0.3)] transition-all" style={{
                    width: `${progress}%`
                  }} />
                                        </Box>
                                    </Box>

                                    <Box className="flex gap-3">
                                        <Btn onPress={() => navigate('/partner/orders', {
                  state: {
                    highlightOrderTitle: activeOrder.orderId
                  }
                })} className="w-full py-3 bg-gray-50 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:bg-gray-100 transition-all">
                                            View Details
                                        </Btn>
                                    </Box>
                                </Box>;
          })() : <Box className="bg-white rounded-[2rem] p-6 border border-gray-100 border-dashed shadow-sm flex flex-col items-center justify-center text-center h-48">
                                <I icon={Clock} size={24} className="text-gray-300 mb-3" />
                                <Txt className="text-[12px] font-black text-gray-400 uppercase tracking-widest">No Active
Workflows</Txt>
                            </Box>}
                    </Box>
                </Box>
            </Box>
        </Box>;
};
export default Overview;
