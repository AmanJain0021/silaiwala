import React, { useState, useEffect } from 'react';
import {
    Package,
    IndianRupee,
    ArrowUpRight,
    MapPin,
    Clock,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    Check,
    X,
    Navigation,
    Loader2,
    Store,
    AlertCircle,
    User,
    ChevronLeft,
    ShieldCheck,
    PhoneCall,
    Info,
    Bell,
    Wallet,
    Star,
    Box,
    ScanLine,
    Headset,
    FileText,
    ShieldAlert
} from 'lucide-react';
import { MdTwoWheeler } from "react-icons/md";
import { useNavigate, useOutletContext } from 'react-router-dom';
import useAuthStore from '../../../../store/authStore';
import useSocketStore from '../../../../store/socketStore';
import deliveryService from '../../services/deliveryService';
import { Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isPendingAcceptanceTask, isAcceptedActiveTask } from '../../utils/taskStatus';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const { socket } = useSocketStore();
    const { isLoaded } = useOutletContext() || { isOnline: true, isLoaded: false };
    const { user } = useAuthStore();
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
            const [statsRes, ordersRes, availableRes] = await Promise.all([
                deliveryService.getStats(),
                deliveryService.getAssignedOrders(),
                deliveryService.getAvailableOrders()
            ]);

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
            import('axios').then(({ default: axios }) => {
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
            toast.success('New delivery task available!', { icon: '🚚' });
            fetchDashboardData();
        };

        const handleNewNotification = (data) => {
            if (data?.message) {
                toast.success(data.message, { icon: '🔔' });
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
    }, [socket]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
            </div>
        );
    }

    const { stats: dashboardStats, activeOrders, availableOrders, profile } = dashboardData;

    const formatAddress = (addr) => {
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

    const getTaskType = (task) => {
        if (task.taskType === 'fabric-pickup') return 'Fabric Collection';
        if (task.taskType === 'order-delivery') return 'Final Delivery';
        if (task.status?.includes('fabric')) return 'Fabric Pickup';
        return 'Dispatch Task';
    };

    // Home card: ONLY after Accept. Pending requests use the swipe popup only.
    const activeTasksList = activeOrders.filter((t) => isAcceptedActiveTask(t, user));
    const currentTask = activeTasksList[0] || null;
    const hasPendingPopupOnly =
        activeOrders.some((t) => isPendingAcceptanceTask(t, user)) || (availableOrders?.length > 0);

    return (
        <div className="animate-in fade-in duration-700 bg-slate-50 min-h-screen pb-24 w-full pt-4">
            <div className="px-5 space-y-6">
                {/* Main Earnings Card */}
                <div className="bg-gradient-to-br from-[#6B2F7E] to-[#843D9B] rounded-[24px] p-6 shadow-xl relative overflow-hidden mb-2">
                    {/* Decorative Elements */}
                    <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute left-10 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl -mb-10" />
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Today's Amount</p>
                        <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">₹{dashboardStats.todayEarnings || 0}</h3>
                        <p className="text-[11px] font-medium text-white/80 mb-6 max-w-[200px] leading-relaxed">
                            Earnings will update once you complete a delivery task immediately.
                        </p>
                        
                        <button onClick={() => navigate('/delivery/wallet')} className="bg-white text-[#843D9B] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full flex items-center gap-1 w-fit shadow-lg shadow-black/10 active:scale-95 transition-transform">
                            VIEW DETAILS <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Floating accents */}
                    <div className="absolute right-6 bottom-6 w-24 h-24 bg-[#5a246b] rounded-2xl rotate-12 opacity-50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    </div>
                    <div className="absolute right-24 bottom-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg rotate-12">
                        ₹
                    </div>
                    <div className="absolute right-4 bottom-20 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-[10px] shadow-lg -rotate-12">
                        ₹
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-2xl flex items-center justify-center mb-1 border border-indigo-100">
                            <Box size={18} />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today</span>
                        <span className="text-sm font-black text-slate-900">{dashboardStats.todayCount || 0}</span>
                        <span className="text-[8px] text-slate-500">Deliveries</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-1 border border-amber-100">
                            <Wallet size={18} />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wallet</span>
                        <span className="text-sm font-black text-slate-900">₹{dashboardStats.earnings || 0}</span>
                        <span className="text-[8px] text-slate-500">Balance</span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-1 border border-emerald-100">
                            <Package size={18} />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-black text-slate-900">{profile?.totalDeliveries || 0}</span>
                        <span className="text-[8px] text-slate-500">Deliveries</span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-1 border border-blue-100">
                            <Star size={18} />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rating</span>
                        <span className="text-sm font-black text-slate-900">{profile?.rating || '4.8'}</span>
                        <span className="text-[8px] text-emerald-500 font-bold">Excellent</span>
                    </div>
                </div>

                {/* Active Dispatch — only after Accept (pending = swipe popup only) */}
                {currentTask ? (
                    <div 
                        className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm relative overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/delivery/orders/${currentTask.orderId || currentTask._id}`)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#843D9B] rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-[#843D9B] bg-indigo-50 uppercase tracking-widest px-2 py-1 rounded-md">
                                    Active Dispatch
                                </span>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-xl flex items-center justify-center border border-indigo-100">
                                <MdTwoWheeler size={20} />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize mb-6">{getTaskType(currentTask)}</h3>

                        <div className="relative pl-6 space-y-6">
                            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-indigo-100 border-l border-dashed border-[#843D9B]/20"></div>
                            
                            {/* Source */}
                            <div className="relative">
                                <div className="absolute -left-[30px] top-1 w-4 h-4 bg-white border-2 border-[#843D9B] rounded-full flex items-center justify-center z-10 shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-[#843D9B] rounded-full"></div>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest mb-1">Pickup (Source)</p>
                                        <p className="text-sm font-medium text-slate-600 leading-snug">
                                            {(() => {
                                                const isFabric = currentTask.taskType === 'fabric-pickup';
                                                return isFabric ? formatAddress(currentTask.deliveryAddress) : formatAddress(currentTask.tailor?.location?.address);
                                            })()}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 px-2 py-1 rounded text-[9px] font-black text-[#843D9B] shrink-0 uppercase tracking-widest">
                                        Pickup
                                    </div>
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="relative">
                                <div className="absolute -left-[30px] top-1 w-4 h-4 bg-white border-2 border-[#843D9B] rounded-full flex items-center justify-center z-10 shadow-sm"></div>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest mb-1">Drop-off (Destination)</p>
                                        <p className="text-sm font-black text-slate-900 leading-snug mb-1">
                                            {(() => {
                                                const isFabric = currentTask.taskType === 'fabric-pickup';
                                                return isFabric ? currentTask.tailor?.shopName : currentTask.customer?.name;
                                            })()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium leading-snug">
                                            {(() => {
                                                const isFabric = currentTask.taskType === 'fabric-pickup';
                                                return isFabric ? formatAddress(currentTask.tailor?.location?.address) : formatAddress(currentTask.deliveryAddress);
                                            })()}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 px-2 py-1 rounded text-[9px] font-black text-[#843D9B] shrink-0 uppercase tracking-widest">
                                        Drop-off
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-[#843D9B] text-white rounded-2xl py-4 mt-6 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-indigo-900/10">
                            View Dispatch Details <ChevronRight size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                            <Package size={32} />
                        </div>
                        {hasPendingPopupOnly ? (
                            <p className="text-slate-500 font-bold text-sm">
                                New request waiting — swipe to accept on the popup.
                            </p>
                        ) : (
                            <p className="text-slate-500 font-bold text-sm">No active tasks at the moment.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryDashboard;
