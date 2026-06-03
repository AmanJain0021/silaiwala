import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Package,
    Navigation,
    Phone,
    Camera,
    CheckCircle2,
    Check,
    Store,
    MapPin,
    AlertCircle,
    User,
    Loader2,
    Search,
    RefreshCw,
    X,
    Power
} from 'lucide-react';
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { SOCKET_URL } from '../../../../config/constants';
import useAuthStore from '../../../../store/authStore';

const Tasks = () => {
    const { isOnline } = useOutletContext() || { isOnline: true };
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'available'
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [activeTaskId, setActiveTaskId] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const [assignedRes, availableRes] = await Promise.all([
                deliveryService.getAssignedOrders(),
                deliveryService.getAvailableOrders()
            ]);

            if (assignedRes.success) {
                setTasks(assignedRes.data);
                // Check if any task is already "active" (not just pending)
                const inProgress = assignedRes.data.find(t => ['out-for-delivery', 'fabric-picked-up'].includes(t.status));
                if (inProgress) setActiveTaskId(inProgress._id);
            }
            if (availableRes.success) {
                setAvailableTasks(availableRes.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();

        const socket = io(SOCKET_URL);
        
        // Join general delivery fleet room and personal room
        socket.emit('join', 'delivery_partners');
        const user = useAuthStore.getState().user;
        if (user?._id) {
            socket.emit('join', `user_${user._id}`);
        }

        socket.on('new_task', (data) => {
            console.log('New task received:', data);
            toast.success('New delivery task available!', {
                icon: '🚚',
                duration: 5000
            });
            fetchTasks(); // Refresh lists
        });

        socket.on('new_notification', (data) => {
             if (data.type === 'TASK_ASSIGNED' || data.type === 'NEW_DELIVERY_TASK') {
                 toast.success(data.message || 'New delivery task available!', {
                    icon: '🚚',
                    duration: 6000
                 });
             } else {
                 toast(data.message, {
                    icon: '🔔',
                 });
             }
             fetchTasks();
        });

        socket.on('task_claimed', (data) => {
            console.log('Task claimed by another partner:', data.orderId);
            setAvailableTasks(prev => prev.filter(t => t._id !== data.orderId));
            setTasks(prev => prev.filter(t => t._id !== data.orderId)); // Also remove if it was assigned to them but then revoked/claimed?
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const activeTask = tasks.find(t => t._id === activeTaskId);
    const pendingTasks = tasks.filter(t => ['pending', 'accepted', 'ready-for-pickup', 'fabric-ready-for-pickup'].includes(t.status));

    const handleAcceptOrder = async (orderId) => {
        try {
            const res = await deliveryService.acceptOrder(orderId);
            if (res.success) {
                toast.success('Task claimed successfully!');
                fetchTasks();
                setActiveTab('assigned');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim task');
        }
    };

    const [taskProof, setTaskProof] = useState(null);

    const handleUpdateStatus = async (orderId, newStatus, message, proof = null) => {
        try {
            const res = await deliveryService.updateDeliveryStatus(orderId, newStatus, message, proof);
            if (res.success) {
                toast.success(`Status updated to ${newStatus}`);
                if (newStatus === 'delivered') {
                    setActiveTaskId(null);
                    setTaskProof(null);
                } else if (newStatus === 'out-for-delivery') {
                    setActiveTaskId(orderId);
                }
                fetchTasks();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleStartTask = async (taskId) => {
        if (activeTaskId) {
            toast.error('Finish the current Active Dispatch before starting another task.');
            return;
        }

        try {
            // Find the task in our local list to check current status
            const task = tasks.find(t => t._id === taskId);
            
            // Determine the next status based on current status
            let nextStatus;
            if (task.status === 'fabric-ready-for-pickup') {
                nextStatus = 'accepted'; // Start heading for fabric pickup
            } else if (task.status === 'ready-for-pickup') {
                nextStatus = 'accepted'; // Start heading for order pickup
            } else {
                nextStatus = task.status;
            }

            // Sync with backend that we are starting this specific dispatch
            const res = await deliveryService.updateDeliveryStatus(taskId, nextStatus, "Starting dispatch flow");
            
            if (res.success) {
                setActiveTaskId(taskId);
                toast.success("Dispatch Started! Navigating to destination.");
                fetchTasks();
            }
        } catch (error) {
            console.error('Error starting task:', error);
            toast.error('Failed to start dispatch. Please try again.');
        }
    };

    // Helper to format addresses
    const formatAddress = (addr) => {
        if (!addr) return 'Address not available';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
        return parts.join(', ') || 'Address not available';
    };

    const getTaskType = (task) => {
        if (task.taskType === 'fabric-pickup') return 'Fabric Collection (C → T)';
        if (task.taskType === 'order-delivery') return 'Final Delivery (T → C)';
        return task.status.replace(/-/g, ' ').toUpperCase();
    };

    // Renders the bottom action area for the Active Task based on its current type and status
    const renderActiveTaskActions = (task) => {
        const btnClass = "w-full rounded-xl py-3 font-black tracking-[0.12em] text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-95";
        const isFabric = task.taskType === 'fabric-pickup';

        // Use deliveryStatus if available for granular tracking, fallback to main status
        const currentStage = task.deliveryStatus || task.status;

        if (currentStage === 'accepted' || currentStage === 'fabric-ready-for-pickup' || currentStage === 'ready-for-pickup') {
            return (
                <button 
                    onClick={() => handleUpdateStatus(task._id, 'reached-pickup')} 
                    className={`${btnClass} bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 uppercase tracking-widest font-black`}
                >
                    <MapPin size={14} /> Reached Pickup Location
                </button>
            );
        }

        if (currentStage === 'reached-pickup') {
            return (
                <button 
                    onClick={() => handleUpdateStatus(task._id, isFabric ? 'fabric-picked-up' : 'picked-up-from-tailor')} 
                    className={`${btnClass} bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100 uppercase tracking-widest font-black`}
                >
                    <Package size={14} /> Confirm Item Picked Up
                </button>
            );
        }

        if (currentStage === 'picked-up' || currentStage === 'fabric-picked-up' || currentStage === 'out-for-delivery') {
            return (
                <button 
                    onClick={() => handleUpdateStatus(task._id, 'reached-dropoff')} 
                    className={`${btnClass} bg-primary-dark text-white hover:bg-black shadow-slate-100 uppercase tracking-widest font-black`}
                >
                    <Store size={14} /> Reached Drop-off Location
                </button>
            );
        }

        if (currentStage === 'reached-dropoff') {
            return (
                <div className="space-y-3">
                    {!taskProof && !isFabric ? (
                        <button
                            onClick={() => {
                                setTaskProof("https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=400&auto=format&fit=crop");
                                toast.success("Photo captured!");
                            }}
                            className={`${btnClass} bg-slate-100 text-primary-dark border border-slate-200 hover:bg-white`}
                        >
                            <Camera size={14} /> Take Delivery Photo
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {taskProof && (
                                <div className="h-20 w-full rounded-xl overflow-hidden border-2 border-primary relative">
                                    <img src={taskProof} alt="Proof" className="w-full h-full object-cover" />
                                    <button onClick={() => setTaskProof(null)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => handleUpdateStatus(task._id, isFabric ? 'fabric-delivered' : 'delivered', 'Order successfully delivered', taskProof)}
                                className={`${btnClass} bg-primary text-white hover:bg-primary-dark shadow-indigo-100`}
                            >
                                <CheckCircle2 size={14} /> Complete Delivery
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Scanning Dispatches...</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 -mt-2">
            {/* Page Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                        {activeTask ? 'Active Dispatch' : 'My Orders'}
                    </h1>
                </div>
                {!activeTask && (
                    <button onClick={fetchTasks} className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-primary transition-all active:rotate-180 duration-500">
                        <RefreshCw size={16} />
                    </button>
                )}
            </div>

            {/* Online/Offline Block */}
            {!isOnline && (
                <div className="bg-white p-6 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-center space-y-3 shadow-sm animate-in fade-in zoom-in duration-500 mx-1">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mx-auto">
                        <Power size={24} className="opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Currently Offline</h3>
                        <p className="text-slate-500 text-[10px] font-medium tracking-wide leading-relaxed">You must be online to receive new <br/> delivery requests and manage your tasks.</p>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/delivery/profile'}
                        className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-indigo-50 px-5 py-2.5 rounded-lg hover:bg-indigo-100 transition-all active:scale-95"
                    >
                        Go To Availability Settings
                    </button>
                </div>
            )}

            {isOnline && (
                <>
                {/* Tab Switcher */}
                {!activeTask && (
                    <div className="flex p-1 bg-slate-100 rounded-xl gap-1 mx-1">
                        <button
                            onClick={() => setActiveTab('assigned')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            My Tasks ({tasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Find New ({availableTasks.length})
                        </button>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {/* ACTIVE TASK VIEW */}
                    {activeTask && (
                        <motion.div
                            key="active-task-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[1.25rem] border border-slate-100 shadow-md overflow-hidden relative mx-1"
                        >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[80px] -z-0"></div>
                        <div className="p-4 relative z-10 space-y-3">

                            {/* Header Info */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${activeTask.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                        <div className="w-1 h-1 rounded-full bg-current animate-pulse"></div>
                                        {getTaskType(activeTask)}
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight capitalize">Task #{activeTask._id.slice(-6)}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-wider leading-none">Status</p>
                                    <p className="text-[11px] font-black text-primary-dark tracking-tight mt-0.5 capitalize leading-none">{activeTask.status}</p>
                                </div>
                            </div>

                            {/* Address details */}
                            <div className="bg-slate-50 p-3 rounded-xl space-y-2.5 border border-slate-100">
                                {(() => {
                                    const isFabricPickup = activeTask.taskType === 'fabric-pickup';
                                    const isPickupStage = ['fabric-ready-for-pickup', 'ready-for-pickup'].includes(activeTask.status);
                                    
                                    const stopLabel = isPickupStage ? "Pickup Location" : "Delivery Location";
                                    
                                    // RECOVERY LOGIC: Determine actual address based on Task Type and Current Stage
                                    let address = 'Address not specified';
                                    if (isPickupStage) {
                                        address = isFabricPickup ? activeTask.deliveryAddress : (activeTask.tailor?.location?.address || activeTask.tailor?.address);
                                    } else {
                                        address = isFabricPickup ? (activeTask.tailor?.location?.address || activeTask.tailor?.address) : activeTask.deliveryAddress;
                                    }
                                    
                                    const contactName = isPickupStage
                                        ? (isFabricPickup ? activeTask.customer?.name : activeTask.tailor?.shopName)
                                        : (isFabricPickup ? activeTask.tailor?.shopName : activeTask.customer?.name);
                                    
                                    const contactPhone = isPickupStage
                                        ? (isFabricPickup ? activeTask.customer?.phoneNumber : activeTask.tailor?.phone)
                                        : (isFabricPickup ? activeTask.tailor?.phone : activeTask.customer?.phoneNumber);

                                    return (
                                        <>
                                            <div className="flex gap-2.5">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-primary-dark flex items-center justify-center shrink-0">
                                                    <MapPin size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-wider leading-none mb-0.5">{stopLabel}</p>
                                                    <p className="text-[12px] font-bold text-slate-700 leading-tight capitalize">{formatAddress(address)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-center pt-2 border-t border-slate-200/60 mt-0.5">
                                                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <User size={12} className="text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <p className="text-[11px] font-black text-slate-800 capitalize leading-none truncate">{contactName || 'Contact'}</p>
                                                        <span className="text-[6px] font-black bg-slate-100 text-primary-dark px-1 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 tracking-wide leading-none">{contactPhone || 'No Phone'}</p>
                                                </div>
                                                <a href={`tel:${contactPhone}`} className="w-7 h-7 bg-slate-50 text-primary-dark rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
                                                    <Phone size={11} />
                                                </a>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Execution Area */}
                            <div className="pt-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-px w-4 bg-slate-200"></div>
                                    <span className="text-[8px] font-bold text-slate-400 capitalize tracking-wider">Execute Action</span>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                </div>
                                {renderActiveTaskActions(activeTask)}
                            </div>

                        </div>
                        </motion.div>
                    )}

                    {/* TAB CONTENT */}
                    {!activeTask && (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: activeTab === 'assigned' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: activeTab === 'assigned' ? 20 : -20 }}
                            className="space-y-3 px-1"
                        >
                            {activeTab === 'assigned' ? (
                                <>
                                    {pendingTasks.map((task) => (
                                        <div key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all hover:border-slate-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-slate-800 tracking-tight capitalize">{getTaskType(task)}</p>
                                                        <span className="text-[9px] font-black text-primary bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">#{task._id.slice(-6)}</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-500 capitalize tracking-wide">
                                                        {task.taskType === 'fabric-pickup' ? `From: ${task.customer?.name}` : `From: ${task.tailor?.shopName}`}
                                                    </p>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                                    Standard
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 mb-4 pl-0.5">
                                                <div className="flex gap-2.5">
                                                    <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-primary-dark">
                                                        <MapPin size={12} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                                                        <p className="text-[11px] font-bold text-primary-dark leading-tight capitalize">
                                                            {task.taskType === 'fabric-pickup' 
                                                                ? formatAddress(task.deliveryAddress) 
                                                                : formatAddress(task.tailor?.location?.address || task.tailor?.address)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleStartTask(task._id)}
                                                className="w-full bg-slate-900 text-white rounded-lg py-3 font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary-dark active:scale-95 transition-all shadow-md"
                                            >
                                                Start Dispatch <Navigation size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {pendingTasks.length === 0 && (
                                        <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="text-slate-500 font-bold capitalize tracking-wide text-sm">No pending tasks assigned.</p>
                                            <p className="text-slate-400 text-[9px] mt-0.5">Check "Find New" for available dispatches.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {availableTasks.map((task) => (
                                        <div key={task._id} className="bg-white p-4 rounded-[1.5rem] border-2 border-slate-100 shadow-lg relative overflow-hidden group">
                                             <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -z-0 group-hover:bg-indigo-100 transition-all"></div>
                                            
                                            <div className="relative z-10 space-y-3">
                                                <div className="flex justify-between items-start">
                                                     <div className="space-y-0.5">
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest mb-0.5 ${task.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                                            {task.taskType === 'fabric-pickup' ? 'Fabric Collection' : 'Final Delivery'}
                                                        </div>
                                                        <p className="text-sm font-black text-slate-900 tracking-tight capitalize">Available Dispatch</p>
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-wide italic leading-none mt-0.5">Reward: ₹20</p>
                                                    </div>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${task.taskType === 'fabric-pickup' ? 'bg-amber-600' : 'bg-primary'}`}>
                                                        <Truck size={18} />
                                                    </div>
                                                </div>

                                                 <div className="bg-slate-50 p-3 rounded-xl space-y-2.5 border border-slate-100">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                                                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Pickup</span>
                                                        </div>
                                                        <div className="flex gap-2 pl-2">
                                                            <MapPin size={11} className="text-primary-dark mt-0.5 shrink-0" />
                                                            <p className="text-[10px] font-bold text-primary-dark leading-snug">
                                                                {task.taskType === 'fabric-pickup' 
                                                                    ? formatAddress(task.deliveryAddress) 
                                                                    : (task.tailor?.shopName || 'Tailor Workshop')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Drop-off</span>
                                                        </div>
                                                        <div className="flex gap-2 pl-2">
                                                            <Store size={11} className="text-primary-dark mt-0.5 shrink-0" />
                                                            <p className="text-[10px] font-bold text-primary-dark leading-snug opacity-80">
                                                                {task.taskType === 'fabric-pickup'
                                                                    ? (task.tailor?.shopName || 'Tailor Workshop')
                                                                    : formatAddress(task.deliveryAddress)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleAcceptOrder(task._id)}
                                                    className="w-full bg-primary-dark text-white rounded-xl py-3 font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                                                >
                                                    Claim Task <Check size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {availableTasks.length === 0 && (
                                        <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-slate-500 font-bold capitalize tracking-wide text-sm">Searching for dispatches...</p>
                                            <p className="text-slate-400 text-[9px] mt-0.5">Try again in a few minutes.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default Tasks;

