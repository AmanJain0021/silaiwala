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
import { SOCKET_URL } from '../../../../config/constants';
import useAuthStore from '../../../../store/authStore';
import { getToken } from '../../../../utils/auth';
import deliveryService from '../../services/deliveryService';
import { io } from 'socket.io-client';
import { Power } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
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

        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });

        socket.emit('join', 'delivery_partners');
        const userId = user?._id || user?.id;
        if (userId) {
            socket.emit('join', `user_${userId}`);
        }

        socket.on('new_task', () => {
            toast.success('New delivery task available!', { icon: '🚚' });
            fetchDashboardData();
        });

        socket.on('new_notification', (data) => {
            toast(data.message, { icon: '🔔' });
            fetchDashboardData();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

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
        const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
        return parts.join(', ') || 'Address not specified';
    };

    const getTaskType = (task) => {
        if (task.taskType === 'fabric-pickup') return 'Fabric Collection';
        if (task.taskType === 'order-delivery') return 'Final Delivery';
        if (task.status?.includes('fabric')) return 'Fabric Pickup';
        return 'Dispatch Task';
    };

    const handleAccept = async (orderId) => {
        try {
            const res = await deliveryService.acceptOrder(orderId);
            if (res.success) {
                toast.success('Task claimed successfully!');
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim task');
        }
    };

    const handleReject = async (orderId) => {
        try {
            await deliveryService.rejectOrder(orderId);
            toast.success('Task rejected');
            fetchDashboardData();
        } catch (e) {
            toast.error('Failed to reject task');
        }
    };

    const pendingRequests = activeOrders.filter(t => {
        const dpId = typeof t.deliveryPartner === 'object' ? t.deliveryPartner?._id : t.deliveryPartner;
        const ppId = typeof t.pickupPartner === 'object' ? t.pickupPartner?._id : t.pickupPartner;
        const dopId = typeof t.dropoffPartner === 'object' ? t.dropoffPartner?._id : t.dropoffPartner;
        const uid = user?._id || user?.id;

        const isLegacyDelivery = !!dpId && dpId === uid && t.deliveryStatus === 'pending';
        const isPickupAssigned = !!ppId && ppId === uid && t.pickupDeliveryStatus === 'pending';
        const isDropoffAssigned = !!dopId && dopId === uid && t.dropoffDeliveryStatus === 'pending';
        
        return isLegacyDelivery || isPickupAssigned || isDropoffAssigned;
    });

    const activeTasksList = activeOrders.filter(t => !pendingRequests.find(p => p._id === t._id));
    const currentTask = activeTasksList.length > 0 ? activeTasksList[0] : (pendingRequests.length > 0 ? pendingRequests[0] : null);
    const isPendingTask = pendingRequests.some(p => p._id === currentTask?._id);

    return (
        <div className="animate-in fade-in duration-700 bg-slate-50 min-h-screen pb-24 w-full pt-4">
            <div className="px-5 space-y-6">
                {/* Main Earnings Card */}
                <div className="bg-gradient-to-br from-[#6b2c80] to-[#843D9B] rounded-[24px] p-6 shadow-xl relative overflow-hidden mb-2">
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

                {/* Active Dispatch / Tasks */}
                {currentTask ? (
                    <div 
                        className={`bg-white rounded-[2rem] p-5 border shadow-sm relative overflow-hidden ${isPendingTask ? 'border-amber-200 shadow-amber-900/5' : 'border-slate-100 cursor-pointer'}`}
                        onClick={() => {
                            if (!isPendingTask) {
                                navigate(`/delivery/orders/${currentTask.orderId || currentTask._id}`);
                            }
                        }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 ${isPendingTask ? 'bg-amber-500' : 'bg-[#843D9B]'} rounded-full animate-pulse`}></div>
                                <span className={`text-[10px] font-black ${isPendingTask ? 'text-amber-600 bg-amber-50' : 'text-[#843D9B] bg-indigo-50'} uppercase tracking-widest px-2 py-1 rounded-md`}>
                                    {isPendingTask ? 'Pending Acceptance' : 'Active Dispatch'}
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

                        {isPendingTask ? (
                            <div className="flex gap-3 mt-6">
                                <button onClick={(e) => { e.stopPropagation(); handleReject(currentTask._id); }} className="flex-1 bg-rose-50 text-rose-600 rounded-2xl py-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all shadow-sm">
                                    Reject <X size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleAccept(currentTask._id); }} className="flex-1 bg-[#843D9B] text-white rounded-2xl py-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20">
                                    Accept <Check size={14} />
                                </button>
                            </div>
                        ) : (
                            <button className="w-full bg-[#843D9B] text-white rounded-2xl py-4 mt-6 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-indigo-900/10">
                                View Dispatch Details <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                            <Package size={32} />
                        </div>
                        {availableOrders?.length > 0 ? (
                            <>
                                <p className="text-slate-600 font-bold mb-4">You have no active tasks, but there {availableOrders.length === 1 ? 'is' : 'are'} <span className="text-[#843D9B]">{availableOrders.length} live order{availableOrders.length === 1 ? '' : 's'}</span> waiting!</p>
                                <button
                                    onClick={() => navigate('/delivery/tasks')}
                                    className="px-6 py-3 bg-[#843D9B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                                >
                                    View Live Pool
                                </button>
                            </>
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
