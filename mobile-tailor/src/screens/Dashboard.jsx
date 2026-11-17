// Port of modules/tailor/pages/Dashboard.jsx (converted with scripts/web2rn.js, then reviewed)
import { alert } from '../lib/alert';
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { ShoppingBag, Clock, CheckCircle, TrendingUp, ChevronRight, ArrowUpRight, Bell, Settings, Loader2 } from "lucide-react-native";
import { useTailorAuth } from "../context/tailor/AuthContext";
import api from "../lib/api";
import useBrandingStore from "../store/brandingStore";
import { formatOrderItemsTitle } from "../utils/orderItems";
import { I, Box, Img, Txt, Btn, Scroll } from '../components/ui/primitives';
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    status
  } = useTailorAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    appName,
    logos
  } = useBrandingStore();
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
  const stats = [{
    label: 'Total Orders',
    value: summary.totalOrders.toString(),
    icon: <I icon={ShoppingBag} size={20} />,
    change: summary.totalOrders > 0 ? '+1' : '0',
    sub: 'this week',
    accent: '#843D9B'
  }, {
    label: 'Pending',
    value: summary.pendingOrders.toString(),
    icon: <I icon={Clock} size={20} />,
    change: summary.pendingOrders > 0 ? `${summary.pendingOrders} active` : 'All clear',
    sub: 'needs attention',
    accent: '#F59E0B'
  }, {
    label: 'Completed',
    value: summary.completedThisWeek.toString(),
    icon: <I icon={CheckCircle} size={20} />,
    change: 'Weekly',
    sub: 'performance',
    accent: '#10B981'
  }, {
    label: 'Earnings',
    value: `₹${(summary.totalEarnings || 0).toLocaleString()}`,
    icon: <I icon={TrendingUp} size={20} />,
    change: `Bal: ₹${(summary.walletBalance || 0).toLocaleString()}`,
    sub: 'wallet',
    accent: '#843D9B'
  }];
  const getStatusStyle = status => {
    switch (status.toLowerCase()) {
      case 'measuring':
        return {
          bg: 'bg-[#843D9B]/10',
          text: 'text-[#843D9B]',
          dot: 'bg-[#843D9B]'
        };
      case 'cutting':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          dot: 'bg-amber-400'
        };
      case 'stitching':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          dot: 'bg-blue-400'
        };
      case 'ironing':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400'
        };
      default:
        return {
          bg: 'bg-white/5',
          text: 'text-white/50',
          dot: 'bg-white/30'
        };
    }
  };
  const getPriorityStyle = priority => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-[#843D9B] font-black';
      case 'high':
        return 'text-amber-400 font-bold';
      default:
        return 'text-white/30 font-medium';
    }
  };
  return <Box className="min-h-screen bg-gray-50 pb-32 md:pb-12 font-sans text-gray-900">

            {/* ── HEADER ─────────────────────── */}
            <Box className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <Box className="flex items-center justify-between mb-6">
                    {/* Logo + Name */}
                    <Box className="flex items-center gap-3">
                        <Box className="w-12 h-12 bg-white border-2 border-[#843D9B]/10 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
                            <Img src={logos.tailor} alt={appName} className="w-full h-full object-contain" />
                        </Box>
                        <Box>
                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Partner Panel</Txt>
                            <Txt className="text-[18px] font-black text-[#843D9B] leading-none tracking-tight">
                                {dashboardData?.shopName || user?.name || 'Partner Shop'}
                            </Txt>
                        </Box>
                    </Box>
                    {/* Action icons */}
                    <Box className="flex items-center gap-2">
                        <Btn onPress={async () => {
            try {
              const { testPushToThisDevice } = await import('../lib/push');
              await testPushToThisDevice();
              alert('Test push sent to this device!');
            } catch (err) {
              alert('Error: ' + err.message);
            }
          }} className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm">
                            <I icon={Bell} size={18} />
                        </Btn>
                        <Btn onPress={() => navigate('/partner/settings')} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#843D9B] hover:bg-white transition-all active:scale-95 shadow-sm">
                            <I icon={Settings} size={18} />
                        </Btn>
                        <Box className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#843D9B] font-black text-lg shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </Box>
                    </Box>
                </Box>

                {/* Greeting Banner */}
                <Box className="bg-[#843D9B] rounded-3xl p-5 relative overflow-hidden mb-1">
                    {/* Decorative circles */}
                    <Box className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
                    <Box className="absolute right-8 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                    <Box className="absolute -right-2 top-8 w-12 h-12 rounded-full bg-white/8 pointer-events-none" />

                    <Txt className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Welcome back 👋</Txt>
                    <Txt className="text-[22px] font-black text-white leading-tight mb-3">
                        {dashboardData?.tailorName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Partner'}!
                    </Txt>
                    <Box className="flex items-center justify-between">
                        <Txt className="text-[12px] text-white/70 font-medium">
                            <Txt className="text-white font-black">{summary.pendingOrders} new orders</Txt> waiting
                        </Txt>
                        <Btn onPress={() => navigate('/partner/orders')} className="bg-white text-[#843D9B] text-[10px] font-black uppercase px-4 py-2 rounded-xl tracking-wider flex items-center gap-1">
                            View All <I icon={ChevronRight} size={13} />
                        </Btn>
                    </Box>
                </Box>
            </Box>

            {/* ── STATS GRID ─────────────────── */}
            <Box className="px-4 mt-6 mb-6">
                <Box className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => <Box key={idx} className="bg-white border border-gray-100 rounded-3xl p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Accent dot */}
                            <Box className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-60" style={{
            backgroundColor: stat.accent
          }} />

                            {/* Icon */}
                            <Box className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{
            backgroundColor: `${stat.accent}15`,
            color: stat.accent
          }}>
                                {stat.icon}
                            </Box>

                            {/* Value */}
                            <Txt className="text-[24px] font-black text-gray-900 leading-none mb-1 tracking-tight">{stat.value}</Txt>
                            <Txt className="text-[11px] text-gray-500 font-bold mb-3">{stat.label}</Txt>

                            {/* Change */}
                            <Box className="flex items-center gap-1 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-100">
                                <I icon={ArrowUpRight} size={10} style={{
              color: stat.accent
            }} />
                                <Txt className="text-[9px] font-black uppercase tracking-widest" style={{
              color: stat.accent
            }}>
                                    {stat.change}
                                </Txt>
                            </Box>
                        </Box>)}
                </Box>
            </Box>

            {/* ── ACTIVE WORK ORDERS ─────────── */}
            <Box className="px-4 pb-6">
                {/* Section Header */}
                <Box className="flex items-center justify-between mb-4">
                    <Txt className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Work Orders</Txt>
                    <Btn onPress={() => navigate('/partner/orders')} className="flex items-center gap-1 text-[#843D9B] text-[10px] font-black uppercase tracking-widest hover:underline">
                        See all <I icon={ChevronRight} size={13} />
                    </Btn>
                </Box>

                {/* Orders List */}
                <Box className="space-y-3">
                    {recentOrders.map(order => {
          const st = getStatusStyle(order.status);
          return <Box key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Status Dot Avatar */}
                                <Box className={`w-10 h-10 rounded-2xl ${st.bg} flex items-center justify-center shrink-0`}>
                                    <Txt className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                                </Box>

                                {/* Info */}
                                <Box className="flex-1 min-w-0">
                                    <Txt className="text-[13px] font-black text-gray-900 truncate leading-tight">
                                        {formatOrderItemsTitle(order.items, {
                  fallback: 'Custom Job'
                })}
                                    </Txt>
                                    <Txt className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">
                                        {order.customerName || 'Customer'} · {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short'
                })}
                                    </Txt>
                                </Box>

                                {/* Right Side */}
                                <Box className="flex flex-col items-end gap-1.5 shrink-0">
                                    <Txt className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${st.bg} ${st.text}`}>
                                        {order.status.replace(/-/g, ' ')}
                                    </Txt>
                                    <Txt className={`text-[9px] uppercase font-bold text-gray-400`}>
                                        #{order.orderId}
                                    </Txt>
                                </Box>

                                {/* Update Button */}
                                <Btn onPress={() => navigate('/partner/orders', {
              state: {
                highlightOrderTitle: order.id
              }
            })} className="shrink-0 w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#843D9B] hover:text-white transition-all hover:border-[#843D9B]">
                                    <I icon={ChevronRight} size={14} />
                                </Btn>
                            </Box>;
        })}
                </Box>
            </Box>
        </Box>;
};
export default Dashboard;