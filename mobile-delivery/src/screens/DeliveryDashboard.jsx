import { Bike as MdTwoWheeler } from 'lucide-react-native';
// Port of modules/delivery/pages/Dashboard/DeliveryDashboard.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { Package, IndianRupee, ArrowUpRight, MapPin, Clock, ChevronRight, TrendingUp, CheckCircle2, Check, X, Navigation, Loader2, Store, AlertCircle, User, ChevronLeft, ShieldCheck, PhoneCall, Info, Bell, Wallet, Star, Box as BoxIcon, ScanLine, Headset, FileText, ShieldAlert } from "lucide-react-native";
import { useNavigate, useOutletContext } from '../lib/nav';
import useAuthStore from "../store/authStore";
import useSocketStore from "../store/socketStore";
import deliveryService from "../lib/deliveryService";
import { Power } from "lucide-react-native";
import toast from '../lib/toast';
import { isPendingAcceptanceTask, isAcceptedActiveTask } from "../utils/taskStatus";
import { Box, Txt, Btn, I, Scroll } from '../components/ui/primitives';
const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const {
    socket
  } = useSocketStore();
  const {
    isLoaded,
    isOnline
  } = useOutletContext() || {
    isOnline: true,
    isLoaded: false
  };
  const {
    user
  } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    activeOrders: [],
    availableOrders: [],
    stats: {
      activeTasks: 0,
      earnings: 0,
      totalPickups: 0
    }
  });
  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, availableRes] = await Promise.all([deliveryService.getStats(), deliveryService.getAssignedOrders(), deliveryService.getAvailableOrders()]);
      if (statsRes.success && ordersRes.success && availableRes.success) {
        setDashboardData({
          profile: {
            rating: statsRes.data.rating,
            isAvailable: statsRes.data.isAvailable,
            totalDeliveries: statsRes.data.totalDeliveries
          },
          activeOrders: ordersRes.data,
          availableOrders: availableRes.data,
          stats: {
            activeTasks: statsRes.data.activeDeliveries || ordersRes.data.length,
            earnings: statsRes.data.walletBalance || 0,
            totalPickups: statsRes.data.totalDeliveries,
            todayEarnings: statsRes.data.todayEarnings || 0,
            todayCount: statsRes.data.todayCount || 0,
            growth: statsRes.data.growth || 0
          }
        });
      }
    } catch (error) {
      import('axios').then(({
        default: axios
      }) => {
        if (!axios.isCancel(error)) {
          console.error('Error fetching dashboard data:', error);
        }
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardData();
    const handleNewTask = () => {
      toast.success('New delivery task available!', {
        icon: '🚚'
      });
      fetchDashboardData();
    };
    const handleNewNotification = data => {
      if (data?.message) {
        toast.success(data.message, {
          icon: '🔔'
        });
      }
      fetchDashboardData();
    };
    const handleTaskClaimed = () => fetchDashboardData();
    if (socket) {
      socket.on('new_task', handleNewTask);
      socket.on('new_order', handleNewTask);
      socket.on('receive_new_order', handleNewTask);
      socket.on('new_notification', handleNewNotification);
      socket.on('task_claimed', handleTaskClaimed);
    }
    return () => {
      if (socket) {
        socket.off('new_task', handleNewTask);
        socket.off('new_order', handleNewTask);
        socket.off('receive_new_order', handleNewTask);
        socket.off('new_notification', handleNewNotification);
        socket.off('task_claimed', handleTaskClaimed);
      }
    };
    // isOnline: the tab stays mounted, so reload when the partner goes online/offline
  }, [socket, isOnline]);
  if (loading) {
    return <Box className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Txt className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</Txt>
            </Box>;
  }
  const {
    stats: dashboardStats,
    activeOrders,
    availableOrders,
    profile
  } = dashboardData;
  const formatAddress = addr => {
    if (!addr) return 'Address not specified';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      if (typeof addr.address === 'string' && addr.address) return addr.address;
      const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
      if (addr.receiverName || addr.name) return `${addr.receiverName || addr.name}${addr.phone ? ' (' + addr.phone + ')' : ''}`;
    }
    return 'Address not specified';
  };
  const getTaskType = task => {
    if (task.taskType === 'fabric-pickup') return 'Fabric Collection';
    if (task.taskType === 'order-delivery') return 'Final Delivery';
    if (task.status?.includes('fabric')) return 'Fabric Pickup';
    return 'Dispatch Task';
  };

  // Home card: ONLY after Accept. Pending requests use the swipe popup only.
  const activeTasksList = activeOrders.filter(t => isAcceptedActiveTask(t, user));
  const currentTask = activeTasksList[0] || null;
  const hasPendingPopupOnly = activeOrders.some(t => isPendingAcceptanceTask(t, user)) || availableOrders?.length > 0;
  return <Box className="animate-in fade-in duration-700 bg-slate-50 min-h-screen pb-24 w-full pt-4">
            <Box className="px-5 space-y-6">
                {/* Main Earnings Card */}
                <Box className="bg-gradient-to-br from-[#6B2F7E] to-[#843D9B] rounded-[24px] p-6 shadow-xl relative overflow-hidden mb-2">
                    {/* Decorative Elements */}
                    <Box className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <Box className="absolute left-10 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl -mb-10" />
                    
                    <Box className="relative z-10">
                        <Txt className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Today's Amount</Txt>
                        <Txt className="text-5xl font-black text-white mb-2 tracking-tighter">₹{dashboardStats.todayEarnings || 0}</Txt>
                        <Txt className="text-[11px] font-medium text-white/80 mb-6 max-w-[200px] leading-relaxed">
                            Earnings will update once you complete a delivery task immediately.
                        </Txt>
                        
                        <Btn onPress={() => navigate('/delivery/wallet')} className="bg-white text-[#843D9B] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full flex items-center gap-1 w-fit shadow-lg shadow-black/10 active:scale-95 transition-transform">
                            VIEW DETAILS <I icon={ChevronRight} size={14} />
                        </Btn>
                    </Box>

                    {/* Floating accents */}
                    <Box className="absolute right-6 bottom-6 w-24 h-24 bg-[#5a246b] rounded-2xl rotate-12 opacity-50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        <Box className="w-4 h-4 rounded-full border-2 border-white/20" />
                    </Box>
                    <Box className="absolute right-24 bottom-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg rotate-12">
                        ₹
                    </Box>
                    <Box className="absolute right-4 bottom-20 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-[10px] shadow-lg -rotate-12">
                        ₹
                    </Box>
                </Box>

                {/* Quick Stats Grid */}
                <Box className="grid grid-cols-4 gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                    <Box className="flex flex-col items-center justify-center text-center space-y-1">
                        <Box className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-2xl flex items-center justify-center mb-1 border border-indigo-100">
                            <I icon={BoxIcon} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today</Txt>
                        <Txt className="text-sm font-black text-slate-900">{dashboardStats.todayCount || 0}</Txt>
                        <Txt className="text-[8px] text-slate-500">Deliveries</Txt>
                    </Box>
                    
                    <Box className="flex flex-col items-center justify-center text-center space-y-1">
                        <Box className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-1 border border-amber-100">
                            <I icon={Wallet} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wallet</Txt>
                        <Txt className="text-sm font-black text-slate-900">₹{dashboardStats.earnings || 0}</Txt>
                        <Txt className="text-[8px] text-slate-500">Balance</Txt>
                    </Box>

                    <Box className="flex flex-col items-center justify-center text-center space-y-1">
                        <Box className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-1 border border-emerald-100">
                            <I icon={Package} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</Txt>
                        <Txt className="text-sm font-black text-slate-900">{profile?.totalDeliveries || 0}</Txt>
                        <Txt className="text-[8px] text-slate-500">Deliveries</Txt>
                    </Box>

                    <Box className="flex flex-col items-center justify-center text-center space-y-1">
                        <Box className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-1 border border-blue-100">
                            <I icon={Star} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rating</Txt>
                        <Txt className="text-sm font-black text-slate-900">{profile?.rating || '4.8'}</Txt>
                        <Txt className="text-[8px] text-emerald-500 font-bold">Excellent</Txt>
                    </Box>
                </Box>

                {/* Active Dispatch — only after Accept (pending = swipe popup only) */}
                {currentTask ? <Btn className="block bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm relative overflow-hidden cursor-pointer" onPress={() => navigate(`/delivery/orders/${currentTask.orderId || currentTask._id}`)}>
                        <Box className="flex justify-between items-start mb-4">
                            <Box className="flex items-center gap-2">
                                <Box className="w-2 h-2 bg-[#843D9B] rounded-full animate-pulse"></Box>
                                <Txt className="text-[10px] font-black text-[#843D9B] bg-indigo-50 uppercase tracking-widest px-2 py-1 rounded-md">
                                    Active Dispatch
                                </Txt>
                            </Box>
                            <Box className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-xl flex items-center justify-center border border-indigo-100">
                                <I icon={MdTwoWheeler} size={20} />
                            </Box>
                        </Box>

                        <Txt className="text-xl font-black text-slate-900 tracking-tight capitalize mb-6">{getTaskType(currentTask)}</Txt>

                        <Box className="relative pl-6 space-y-6">
                            <Box className="absolute left-2.5 top-2 bottom-2 w-px bg-indigo-100 border-l border-dashed border-[#843D9B]/20"></Box>
                            
                            {/* Source */}
                            <Box className="relative">
                                <Box className="absolute -left-[30px] top-1 w-4 h-4 bg-white border-2 border-[#843D9B] rounded-full flex items-center justify-center z-10 shadow-sm">
                                    <Box className="w-1.5 h-1.5 bg-[#843D9B] rounded-full"></Box>
                                </Box>
                                <Box className="flex justify-between items-start gap-4">
                                    <Box>
                                        <Txt className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest mb-1">Pickup (Source)</Txt>
                                        <Txt className="text-sm font-medium text-slate-600 leading-snug">
                                            {(() => {
                    const isFabric = currentTask.taskType === 'fabric-pickup';
                    return isFabric ? formatAddress(currentTask.deliveryAddress) : formatAddress(currentTask.tailor?.location?.address);
                  })()}
                                        </Txt>
                                    </Box>
                                    <Box className="bg-indigo-50 px-2 py-1 rounded text-[9px] font-black text-[#843D9B] shrink-0 uppercase tracking-widest">
                                        Pickup
                                    </Box>
                                </Box>
                            </Box>

                            {/* Destination */}
                            <Box className="relative">
                                <Box className="absolute -left-[30px] top-1 w-4 h-4 bg-white border-2 border-[#843D9B] rounded-full flex items-center justify-center z-10 shadow-sm"></Box>
                                <Box className="flex justify-between items-start gap-4">
                                    <Box>
                                        <Txt className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest mb-1">Drop-off (Destination)</Txt>
                                        <Txt className="text-sm font-black text-slate-900 leading-snug mb-1">
                                            {(() => {
                    const isFabric = currentTask.taskType === 'fabric-pickup';
                    return isFabric ? currentTask.tailor?.shopName : currentTask.customer?.name;
                  })()}
                                        </Txt>
                                        <Txt className="text-[11px] text-slate-500 font-medium leading-snug">
                                            {(() => {
                    const isFabric = currentTask.taskType === 'fabric-pickup';
                    return isFabric ? formatAddress(currentTask.tailor?.location?.address) : formatAddress(currentTask.deliveryAddress);
                  })()}
                                        </Txt>
                                    </Box>
                                    <Box className="bg-indigo-50 px-2 py-1 rounded text-[9px] font-black text-[#843D9B] shrink-0 uppercase tracking-widest">
                                        Drop-off
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Btn className="w-full bg-[#843D9B] text-white rounded-2xl py-4 mt-6 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-indigo-900/10">
                            View Dispatch Details <I icon={ChevronRight} size={14} />
                        </Btn>
                    </Btn> : <Box className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <Box className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                            <I icon={Package} size={32} />
                        </Box>
                        {hasPendingPopupOnly ? <Txt className="text-slate-500 font-bold text-sm">
                                New request waiting — swipe to accept on the popup.
                            </Txt> : <Txt className="text-slate-500 font-bold text-sm">No active tasks at the moment.</Txt>}
                    </Box>}
            </Box>
        </Box>;
};
export default DeliveryDashboard;