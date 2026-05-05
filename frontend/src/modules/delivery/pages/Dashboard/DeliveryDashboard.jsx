import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Package,
    IndianRupee,
    ArrowUpRight,
    MapPin,
    Clock,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
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
    Bell
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { SOCKET_URL } from '../../../../config/constants';
import useAuthStore from '../../../../store/authStore';
import deliveryService from '../../services/deliveryService';
import { io } from 'socket.io-client';
import { Power, MapPin as MapPinIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeliveryTracking } from "../../../../shared/hooks/useDeliveryTracking";
import DashboardMap from '../../components/DashboardMap';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const { isOnline, isLoaded } = useOutletContext() || { isOnline: true, isLoaded: false };
    const { user } = useAuthStore();
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedAvailableTask, setSelectedAvailableTask] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);
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

    // --- Real-time Delivery Tracking ---
    const activeTasksList = dashboardData.activeOrders || [];
    const primaryOrder = activeTasksList[0];
    const currentLocation = useDeliveryTracking(user?._id, activeTasksList);

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
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        const socket = io(SOCKET_URL);

        // Join delivery fleet and personal room
        socket.emit('join', 'delivery_partners');
        if (user?._id) {
            socket.emit('join', `user_${user._id}`);
        }

        socket.on('new_task', (data) => {
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

    const handleAcceptTask = async (orderId) => {
        setIsAccepting(true);
        try {
            const res = await deliveryService.acceptOrder(orderId);
            if (res.success) {
                toast.success('Task accepted successfully!');
                setSelectedAvailableTask(null);
                fetchDashboardData();
            } else {
                toast.error(res.message || 'Failed to accept task');
            }
        } catch (error) {
            console.error('Error accepting task:', error);
            toast.error('Failed to accept task');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleOpenMap = (task) => {
        if (!task) return;

        // Logic to determine destination address
        const isFabricPickup = task.taskType === 'fabric-pickup';
        const isPickupStage = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(task.status);

        let destination;
        if (isPickupStage) {
            destination = isFabricPickup ? task.deliveryAddress : task.tailor?.address;
        } else {
            destination = isFabricPickup ? task.tailor?.address : task.deliveryAddress;
        }

        if (!destination) {
            toast.error("Destination address not found");
            return;
        }

        const addressStr = typeof destination === 'string'
            ? destination
            : `${destination.street || ''}, ${destination.city || ''}, ${destination.state || ''} ${destination.zipCode || ''}`;

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressStr)}`;
        window.open(mapsUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
            </div>
        );
    }

    const { stats: dashboardStats, activeOrders, availableOrders, profile } = dashboardData;

    const stats = [
        { label: 'Active Tasks', value: dashboardStats.activeTasks.toString().padStart(2, '0'), icon: Truck, color: 'bg-primary', trend: 'In Progress' },
        { label: 'Wallet Balance', value: `₹${dashboardStats.earnings}`, icon: IndianRupee, color: 'bg-primary', trend: 'Earnings' },
        { label: 'Total Deliveries', value: dashboardStats.totalPickups.toString().padStart(2, '0'), icon: Package, color: 'bg-slate-900', trend: 'Completed' },
    ];

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

    const getTaskLabel = (status) => {
        if (status === 'fabric-ready-for-pickup') return 'PICKUP FROM CUSTOMER';
        if (status === 'ready-for-pickup') return 'PICKUP FROM TAILOR';
        if (status === 'out-for-delivery') return 'DROP TO CUSTOMER';
        return status.replace(/-/g, ' ').toUpperCase();
    };

    const getTaskAddress = (task) => {
        const isFabricPickup = task.taskType === 'fabric-pickup';
        const isPickupStage = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(task.status);

        if (isPickupStage) {
            // Where to pick up
            return isFabricPickup
                ? formatAddress(task.deliveryAddress) // Customer house
                : (task.tailor?.shopName || 'Tailor Workshop');
        } else {
            // Where to drop off
            return isFabricPickup
                ? (task.tailor?.shopName || 'Tailor Workshop')
                : formatAddress(task.deliveryAddress); // Customer house
        }
    };

    const currentTask = activeOrders.length > 0 ? activeOrders[0] : null;
    const upcomingTasks = activeOrders.slice(1);

    return (
        <div className="animate-in fade-in duration-700 relative w-full h-full">
            {/* Operational Map - Full Viewport Background (Starts below header) */}
            <div className="fixed inset-x-0 bottom-0 top-[80px] z-0 bg-slate-100 pointer-events-auto">
                <DashboardMap 
                    currentLocation={currentLocation} 
                    activeOrder={currentTask}
                    isOnline={isOnline} 
                    isLoaded={isLoaded}
                    height="100%"
                    hideHeader={true}
                />
            </div>

            <div className="relative z-10 w-full pt-[calc(100vh-250px)] pb-10 pointer-events-none">
                <div className="space-y-4 pointer-events-auto px-4">
                    {/* Today's Stats Hero Card */}
                    <div className="bg-white rounded-[2.5rem] p-7 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0 opacity-50"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Today's Earnings</p>
                        <button onClick={() => navigate('/delivery/wallet')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Details</button>
                    </div>

                    <div className="flex items-end gap-2 mb-6">
                        <h3 className="text-[40px] font-black text-slate-900 tracking-tighter leading-none">
                            ₹{dashboardStats.todayEarnings || 0}
                        </h3>
                        {dashboardStats.growth !== 0 && (
                            <div className={`flex items-center gap-1 ${dashboardStats.growth >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} px-1.5 py-0.5 rounded-full mb-1 border scale-90`}>
                                <TrendingUp
                                    size={11}
                                    strokeWidth={3}
                                    className={dashboardStats.growth < 0 ? 'rotate-180' : ''}
                                />
                                <span className="text-[9px] font-black">
                                    {dashboardStats.growth >= 0 ? '+' : ''}{dashboardStats.growth}%
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                        <div className="text-center space-y-2">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Package size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                            <p className="text-sm font-black text-slate-900">{dashboardStats.todayCount || 0}</p>
                        </div>
                        <div className="text-center space-y-2 relative">
                            <div className="absolute inset-y-0 left-0 w-px bg-slate-100"></div>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <TrendingUp size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wallet</p>
                            <p className="text-sm font-black text-slate-900">₹{dashboardStats.earnings || 0}</p>
                            <div className="absolute inset-y-0 right-0 w-px bg-slate-100"></div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Package size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-sm font-black text-slate-900">{profile?.totalDeliveries || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Task Hero Card */}
            {currentTask ? (
                <div className="relative group w-[calc(100%+2rem)] -mx-4 md:w-full md:mx-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-[2.5rem] blur-lg opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-white rounded-[2.5rem] overflow-hidden text-slate-900 shadow-xl mx-2 border border-slate-100">
                        <div className="p-6 lg:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-100">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black tracking-widest text-primary uppercase">Active Dispatch</span>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-1 capitalize">{getTaskType(currentTask)}</h2>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mt-1">
                                    <Truck size={24} className="text-slate-400" />
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col mt-2">
                                <div className="flex gap-4 mb-6 relative">
                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-white z-10 shadow-sm flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                        </div>
                                        <div className="w-0.5 h-14 bg-slate-100 border-dashed border-l-2 border-slate-200 -my-0.5"></div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="w-3.5 h-3.5 rounded-full bg-primary z-10 border-2 border-white shadow-md flex items-center justify-center"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                        </motion.div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-4">
                                        {/* Source */}
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                                                Pickup (Source)
                                            </span>
                                            <p className="text-[14px] font-black text-slate-900 truncate leading-tight">
                                                {(() => {
                                                    const isFabric = currentTask.taskType === 'fabric-pickup';
                                                    const isPickup = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(currentTask.status);
                                                    if (isPickup) {
                                                        return isFabric ? currentTask.customer?.name : currentTask.tailor?.shopName;
                                                    } else {
                                                        return isFabric ? currentTask.tailor?.shopName : currentTask.customer?.name;
                                                    }
                                                })()}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold truncate leading-tight mt-0.5">
                                                {(() => {
                                                    const isFabric = currentTask.taskType === 'fabric-pickup';
                                                    const isPickup = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(currentTask.status);
                                                    if (isPickup) {
                                                        return isFabric ? formatAddress(currentTask.deliveryAddress) : formatAddress(currentTask.tailor?.address);
                                                    } else {
                                                        return isFabric ? formatAddress(currentTask.tailor?.address) : formatAddress(currentTask.deliveryAddress);
                                                    }
                                                })()}
                                            </p>
                                        </div>

                                        {/* Destination */}
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1.5">
                                                Drop-off (Destination)
                                            </span>
                                            <p className="text-[14px] font-black text-slate-900 truncate leading-tight">
                                                {(() => {
                                                    const isFabric = currentTask.taskType === 'fabric-pickup';
                                                    const isPickup = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(currentTask.status);
                                                    if (isPickup) {
                                                        return isFabric ? currentTask.tailor?.shopName : currentTask.customer?.name;
                                                    } else {
                                                        return isFabric ? currentTask.customer?.name : currentTask.tailor?.shopName;
                                                    }
                                                })()}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold truncate leading-tight mt-0.5">
                                                {(() => {
                                                    const isFabric = currentTask.taskType === 'fabric-pickup';
                                                    const isPickup = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(currentTask.status);
                                                    if (isPickup) {
                                                        return isFabric ? formatAddress(currentTask.tailor?.address) : formatAddress(currentTask.deliveryAddress);
                                                    } else {
                                                        return isFabric ? formatAddress(currentTask.deliveryAddress) : formatAddress(currentTask.tailor?.address);
                                                    }
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Clock size={16} />
                                        </div>
                                        <span className="text-[11px] font-bold tracking-wider text-slate-400 capitalize">Arriving Soon</span>
                                    </div>
                                    <button
                                        onClick={() => handleOpenMap(currentTask)}
                                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/10"
                                    >
                                        Open Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.25rem] p-8 text-center overscroll-none">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-sm">
                        <Package size={24} />
                    </div>
                    {availableOrders.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-slate-600 font-bold text-sm">You have no active tasks, but there are <span className="text-primary">{availableOrders.length} live orders</span> waiting!</p>
                            <button
                                onClick={() => navigate('/delivery/tasks')}
                                className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-indigo-900/20"
                            >
                                View Live Pool
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 font-bold text-sm">No active tasks at the moment.</p>
                            <p className="text-slate-400 text-xs mt-1">Check back later for new dispatches.</p>
                        </>
                    )}
                </div>
            )}

            {/* Live Orders Available section (Horizontal scroll) */}
            {availableOrders.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <h2 className="text-lg font-black text-white tracking-tight capitalize">Live <span className="text-white">Available</span> Tasks</h2>
                        </div>
                        <button onClick={() => navigate('/delivery/tasks')} className="text-[10px] font-black text-white uppercase tracking-widest hover:underline">See All</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 -mx-1">
                        {availableOrders.slice(0, 5).map((order) => (
                            <motion.div
                                key={order._id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedAvailableTask(order)}
                                className="min-w-[240px] bg-gradient-to-br from-white to-slate-50/50 p-4 rounded-[1.25rem] border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer group hover:border-indigo-200 hover:shadow-md transition-all"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-black bg-indigo-100 text-primary px-2 py-0.5 rounded uppercase tracking-wider">{getTaskType(order)}</span>
                                        <span className="text-[9px] font-bold text-slate-400">₹{order.totalAmount || '--'}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup From</p>
                                        <p className="text-xs font-bold text-slate-800 truncate">{order.taskType === 'fabric-pickup' ? order.customer?.name : order.tailor?.shopName}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                        <Navigation size={12} className="text-primary" /> Nearby
                                    </div>
                                    <span className="text-[10px] font-black text-primary group-hover:translate-x-1 transition-transform">View Details →</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* Available Task Detail Modal */}
            <AnimatePresence>
                {selectedAvailableTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedAvailableTask(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setSelectedAvailableTask(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all z-20"
                            >
                                <X size={16} />
                            </button>

                            <div className="mb-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAvailableTask.taskType === 'fabric-pickup' ? 'bg-indigo-50 text-primary border border-indigo-100' : 'bg-indigo-50 text-primary border border-indigo-100'}`}>
                                        {getTaskType(selectedAvailableTask)}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900">₹{selectedAvailableTask.totalAmount}</h2>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Order #{selectedAvailableTask.orderId?.slice(-6) || selectedAvailableTask._id.slice(-6)}</h3>
                                <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase">Dispatch Available Now</p>
                            </div>

                            <div className="space-y-6 mb-8">
                                {/* Route Info */}
                                <div className="relative pl-6 space-y-6">
                                    <div className="absolute left-[7px] top-[10px] bottom-[10px] w-0.5 border-l-2 border-dashed border-slate-100"></div>

                                    <div className="relative">
                                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup From ({selectedAvailableTask.taskType === 'fabric-pickup' ? 'Customer' : 'Artisan'})</p>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {selectedAvailableTask.taskType === 'fabric-pickup'
                                                        ? selectedAvailableTask.customer?.name
                                                        : selectedAvailableTask.tailor?.shopName}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 italic">
                                                    {selectedAvailableTask.taskType === 'fabric-pickup'
                                                        ? formatAddress(selectedAvailableTask.deliveryAddress)
                                                        : formatAddress(selectedAvailableTask.tailor?.address)}
                                                </p>
                                            </div>
                                            {(selectedAvailableTask.status.includes('fabric') ? selectedAvailableTask.customer?.phoneNumber : selectedAvailableTask.tailor?.phone) && (
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Contact</p>
                                                    <p className="text-[10px] font-bold text-slate-600">
                                                        {selectedAvailableTask.taskType === 'fabric-pickup' ? selectedAvailableTask.customer?.phoneNumber : selectedAvailableTask.tailor?.phone}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drop To ({selectedAvailableTask.taskType === 'fabric-pickup' ? 'Artisan' : 'Customer'})</p>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {selectedAvailableTask.taskType === 'fabric-pickup'
                                                        ? selectedAvailableTask.tailor?.shopName
                                                        : selectedAvailableTask.customer?.name}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 italic">
                                                    {selectedAvailableTask.taskType === 'fabric-pickup'
                                                        ? formatAddress(selectedAvailableTask.tailor?.address)
                                                        : formatAddress(selectedAvailableTask.deliveryAddress)}
                                                </p>
                                            </div>
                                            {(selectedAvailableTask.status.includes('fabric') ? selectedAvailableTask.tailor?.phone : selectedAvailableTask.customer?.phoneNumber) && (
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Contact</p>
                                                    <p className="text-[10px] font-bold text-slate-600">
                                                        {selectedAvailableTask.taskType === 'fabric-pickup' ? selectedAvailableTask.tailor?.phone : selectedAvailableTask.customer?.phoneNumber}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Content */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Package size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Content</span>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedAvailableTask.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-800">
                                                <span>{item.service?.title || item.product?.name || 'Item'}</span>
                                                <span className="text-slate-400 font-medium">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Swipe to Accept - Rapido Style */}
                            <div className="relative h-16 bg-slate-100 rounded-2xl border border-slate-200 p-1.5 overflow-hidden mb-4">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        Swipe to Accept <ArrowUpRight size={12} />
                                    </span>
                                </div>

                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 260 }}
                                    dragElastic={0.1}
                                    onDragEnd={(e, info) => {
                                        if (info.offset.x > 180) {
                                            handleAcceptTask(selectedAvailableTask._id);
                                        }
                                    }}
                                    className="w-13 h-13 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl cursor-grab active:cursor-grabbing z-10"
                                >
                                    {isAccepting ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={24} />}
                                </motion.div>
                            </div>

                            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                Please reach pickup location within 15 mins.<br />Earnings will be credited after delivery.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map Preview Modal */}
            <AnimatePresence>
                {showMapModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-white flex flex-col"
                    >
                        <div className="p-4 flex items-center justify-between border-b bg-white relative z-10">
                            <button onClick={() => setShowMapModal(false)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Task Route</h2>
                            <div className="w-10 h-10" />
                        </div>

                        <div className="flex-1 bg-slate-50 relative overflow-hidden">
                            {/* Detailed Map View - Currently Placeholder */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-primary mb-4">
                                    <Navigation size={40} className="animate-bounce" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Live Navigation</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                                    Calculating fastest route to <br />
                                    {getTaskAddress(currentTask)}
                                </p>

                                <button
                                    onClick={() => {
                                        handleOpenMap(currentTask);
                                        setShowMapModal(false);
                                    }}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3"
                                >
                                    Launch External Map
                                    <ArrowUpRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};

export default DeliveryDashboard;

