import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Navigation,
    Phone,
    Camera,
    Image as ImageIcon,
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
    Power,
    CreditCard
} from 'lucide-react';
import { MdTwoWheeler } from "react-icons/md";
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useSocketStore from '../../../../store/socketStore';
import useAuthStore from '../../../../store/authStore';
import { getToken } from '../../../../utils/auth';
import { pickPhotoFromInput, ensurePhotoDataUrl } from '../../utils/pickDeliveryPhoto';
import { isPendingAcceptanceTask, isAcceptedActiveTask, getPartnerActionStage } from '../../utils/taskStatus';

const Tasks = () => {
    const user = useAuthStore((state) => state.user);
    const { socket } = useSocketStore();
    const { isOnline } = useOutletContext() || { isOnline: true };
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'available'
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [otpInput, setOtpInput] = useState('');
    const [paymentSelection, setPaymentSelection] = useState(null);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const [assignedRes, availableRes, completedRes] = await Promise.all([
                deliveryService.getAssignedOrders(null, true),
                deliveryService.getAvailableOrders(true),
                deliveryService.getAssignedOrders('completed', true)
            ]);

            if (assignedRes.success) {
                setTasks(assignedRes.data);
                // Only treat as "Active Dispatch" if this partner has already accepted
                const inProgress = assignedRes.data.find((t) => {
                    if (!isAcceptedActiveTask(t, user)) return false;
                    const stage = getPartnerActionStage(t, user);
                    return ['reached-pickup', 'picked-up', 'out-for-delivery', 'reached-dropoff', 'fabric-picked-up'].includes(stage)
                        || ['out-for-delivery', 'fabric-picked-up'].includes(t.status);
                });
                if (inProgress) {
                    setActiveTaskId(inProgress._id);
                } else {
                    // Clear stale active view if nothing is truly in progress
                    setActiveTaskId((prev) => {
                        if (!prev) return null;
                        const stillActive = assignedRes.data.find(
                            (t) => t._id === prev && isAcceptedActiveTask(t, user)
                        );
                        return stillActive ? prev : null;
                    });
                }
            }
            if (availableRes.success) {
                setAvailableTasks(availableRes.data);
            }
            if (completedRes?.success) {
                setCompletedTasks(completedRes.data);
            }
            setLoading(false);
        } catch (error) {
            if (error?.name === 'CanceledError') return;
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();

        const handleNewTask = (data) => {
            console.log('New task received:', data);
            toast.success('New delivery task available!', {
                icon: '🚚',
                duration: 5000
            });
            fetchTasks(); // Refresh lists
        };

        const handleReceiveNewOrder = (data) => {
            console.log('Broadcasted pool order received:', data);
            fetchTasks(); // Refresh lists
        };

        const handleNewNotification = (data) => {
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
        };

        const handleTaskClaimed = (data) => {
            const currentUserId = useAuthStore.getState().user?._id || useAuthStore.getState().user?.id;
            const claimedId = data?.orderId?.toString?.() || data?.orderId;
            
            if (data.claimedBy === currentUserId) {
                // We claimed it! Just remove from available, keep in tasks
                setAvailableTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
            } else {
                console.log('Task claimed by another partner:', claimedId);
                setAvailableTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
                setTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
            }
        };

        if (socket) {
            socket.on('new_task', handleNewTask);
            socket.on('receive_new_order', handleReceiveNewOrder);
            socket.on('new_notification', handleNewNotification);
            socket.on('task_claimed', handleTaskClaimed);
        }

        return () => {
            if (socket) {
                socket.off('new_task', handleNewTask);
                socket.off('receive_new_order', handleReceiveNewOrder);
                socket.off('new_notification', handleNewNotification);
                socket.off('task_claimed', handleTaskClaimed);
            }
        };
    }, [socket]);

    const activeTask = tasks.find(t => t._id === activeTaskId && isAcceptedActiveTask(t, user));

    // Awaiting Accept / Reject — NOT active dispatch
    const pendingAcceptanceTasks = tasks.filter((t) => isPendingAcceptanceTask(t, user));

    // Accepted but not yet in full-screen active execution view
    const pendingTasks = tasks.filter((t) => {
        if (!isAcceptedActiveTask(t, user)) return false;
        if (activeTask && t._id === activeTask._id) return false;
        const isStatusValid = ['pending', 'accepted', 'ready', 'ready-for-pickup', 'fabric-ready-for-pickup', 'ready-for-delivery', 'out-for-delivery', 'fabric-picked-up'].includes(t.status);
        return isStatusValid;
    });

    const handleAcceptOrder = async (orderId) => {
        try {
            const res = await deliveryService.acceptOrder(orderId);
            if (res.success) {
                toast.success('Task claimed successfully!');
                await fetchTasks();
                setActiveTab('assigned');
                // After accept, show Start Dispatch — not full Active Dispatch yet
                setActiveTaskId(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim task');
        }
    };

    const [taskProof, setTaskProof] = useState(null);
    const [photoProcessing, setPhotoProcessing] = useState(false);

    const handlePhotoSelect = (e, fromCamera) => {
        const input = e?.target;
        if (!input) return;
        try {
            pickPhotoFromInput(input, (url) => {
                setTaskProof(url);
                toast.success('Photo added');
            }, { fromCamera, onProcessing: setPhotoProcessing });
        } catch (err) {
            toast.error(err?.message || 'Could not process photo');
            if (input) input.value = '';
        }
    };

    const needsFinalPayment = (task) => {
        if (!task || task.taskType === 'fabric-pickup') return false;
        const due = Number(task.remainingPaymentAmount || 0);
        return due > 0 && task.remainingPaymentStatus !== 'paid';
    };

    const handleUpdateStatus = async (orderId, newStatus, message, proof = null, otp = null, paymentMethod = null) => {
        try {
            const isFinalComplete = newStatus === 'delivered';

            let res;
            if (isFinalComplete) {
                // Final T→C must go through /complete (payment + OTP enforced)
                await deliveryService.completeDelivery(orderId, {
                    otp,
                    deliveryProofPhoto: proof,
                    paymentMethod: paymentMethod || undefined,
                });
                res = { success: true };
            } else {
                res = await deliveryService.updateDeliveryStatus(orderId, newStatus, message, proof, otp, paymentMethod);
            }

            if (res.success || res) {
                toast.success(`Status updated to ${newStatus}`);
                if (newStatus === 'delivered' || newStatus === 'fabric-delivered' || newStatus === 'fabric-received') {
                    setActiveTaskId(null);
                    setTaskProof(null);
                    setOtpInput('');
                    setPaymentSelection(null);
                } else if (newStatus === 'out-for-delivery' || newStatus === 'fabric-picked-up') {
                    setActiveTaskId(orderId);
                }

                if (newStatus === 'fabric-picked-up' || newStatus === 'picked-up-from-tailor' || newStatus === 'reached-dropoff') {
                    setOtpInput('');
                    setTaskProof(null);
                }
                fetchTasks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleStartTask = async (taskId) => {
        if (activeTaskId) {
            toast.error('Finish the current Active Dispatch before starting another task.');
            return;
        }

        try {
            const task = tasks.find(t => t._id === taskId);
            if (!task || !isAcceptedActiveTask(task, user)) {
                toast.error('Accept the request first before starting dispatch.');
                return;
            }

            // Partner is already accepted — only mark task active in UI (no duplicate status API call)
            setActiveTaskId(taskId);
            toast.success('Dispatch started. Tap "Reached Pickup" when you arrive.');
            return;
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

        // Use partner-phase status only — never treat order.status as "accepted" before accept
        const currentStage = getPartnerActionStage(task, user);
        if (!currentStage || currentStage === 'pending') {
            return (
                <p className="text-center text-xs font-bold text-amber-600">
                    Accept this request first to start dispatch.
                </p>
            );
        }

        let actionUI = null;

        if (currentStage === 'accepted') {
            actionUI = (
                <button 
                    onClick={() => handleUpdateStatus(task._id, 'reached-pickup')} 
                    className={`${btnClass} bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 uppercase tracking-widest font-black`}
                >
                    <MapPin size={14} /> Reached Pickup Location
                </button>
            );
        } else if (currentStage === 'reached-pickup') {
            actionUI = (
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full text-center tracking-[0.5em] font-black py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none"
                        maxLength={6}
                    />
                    <button 
                        onClick={() => {
                            if (!otpInput || otpInput.length < 6) {
                                toast.error('Please enter the 6-digit OTP');
                                return;
                            }
                            handleUpdateStatus(task._id, isFabric ? 'fabric-picked-up' : 'picked-up-from-tailor', 'Picked up successfully', null, otpInput);
                        }} 
                        className={`${btnClass} bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100 uppercase tracking-widest font-black`}
                    >
                        <Package size={14} /> Confirm Item Picked Up
                    </button>
                </div>
            );
        } else if (currentStage === 'fabric-picked-up' || currentStage === 'picked-up' || currentStage === 'out-for-delivery') {
            actionUI = (
                <button 
                    onClick={() => handleUpdateStatus(task._id, 'reached-dropoff')} 
                    className={`${btnClass} bg-slate-900 text-white hover:bg-black shadow-slate-100 uppercase tracking-widest font-black`}
                >
                    <Store size={14} /> Reached Drop-off Location
                </button>
            );
        } else if (currentStage === 'reached-dropoff') {
            const duePayment = needsFinalPayment(task) ||
                (['cod', 'cash'].includes(String(task.paymentMethod || '').toLowerCase()) &&
                task.paymentStatus !== 'paid' &&
                task.remainingPaymentStatus !== 'paid');
            const amountDue = Number(task.remainingPaymentAmount || task.totalAmount || task.total || 0);
            actionUI = (
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.5em] font-black py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                        maxLength={6}
                    />
                    {!taskProof ? (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className={`${btnClass} bg-slate-100 text-slate-900 border border-slate-200 hover:bg-white`}
                            >
                                <Camera size={14} /> Camera
                            </button>
                            <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className={`${btnClass} bg-slate-100 text-slate-900 border border-slate-200 hover:bg-white`}
                            >
                                <ImageIcon size={14} /> Gallery
                            </button>
                        </div>
                    ) : (
                        <div className="h-20 w-full rounded-xl overflow-hidden border-2 border-slate-800 relative">
                            <img src={taskProof} alt="Proof" className="w-full h-full object-cover" />
                            {photoProcessing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                            <button type="button" disabled={photoProcessing} onClick={() => setTaskProof(null)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {duePayment && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1">
                                    <CreditCard size={12} /> Collect payment
                                </p>
                                <p className="text-sm font-black text-slate-900">₹{amountDue}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentSelection('cash')}
                                    className={`${btnClass} ${paymentSelection === 'cash' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                                >
                                    Cash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentSelection('qr')}
                                    className={`${btnClass} ${paymentSelection === 'qr' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                                >
                                    UPI QR
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            if (!otpInput || otpInput.length < 6) {
                                toast.error('Please enter the 6-digit OTP');
                                return;
                            }
                            if (!taskProof) {
                                toast.error('Please take a delivery photo first');
                                return;
                            }
                            if (photoProcessing) {
                                toast.error('Photo still processing — wait a moment');
                                return;
                            }
                            if (duePayment && !paymentSelection) {
                                toast.error('Collect final payment (Cash or UPI) before completing');
                                return;
                            }
                            const proof = await ensurePhotoDataUrl(taskProof);
                            if (!proof) {
                                toast.error('Photo still processing — wait a moment');
                                return;
                            }
                            handleUpdateStatus(
                                task._id,
                                isFabric ? 'fabric-delivered' : 'delivered',
                                'Order successfully delivered',
                                proof,
                                otpInput,
                                duePayment ? paymentSelection : null
                            );
                        }}
                        className={`${btnClass} bg-primary text-white hover:bg-slate-900 shadow-indigo-100`}
                    >
                        <CheckCircle2 size={14} /> Complete Delivery
                    </button>
                </div>
            );
        }

        return (
            <div>
                {actionUI}
            </div>
        );
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
                            My Tasks ({pendingAcceptanceTasks.length + pendingTasks.length})
                            {pendingAcceptanceTasks.length > 0 && (
                                <span className="ml-1 bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                    {pendingAcceptanceTasks.length} New!
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Find New ({availableTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Completed ({completedTasks.length})
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
                                    
                                    // Robust logic for determining stage:
                                    const pickupStatuses = ['pending', 'accepted', 'fabric-ready-for-pickup', 'ready-for-pickup', 'ready-for-delivery', 'reached-pickup'];
                                    const isPickupStage = pickupStatuses.includes(activeTask.status);
                                    
                                    const stopLabel = isPickupStage ? "Pickup Location" : "Drop-off Location";
                                    
                                    let address = 'Address not specified';
                                    let contactName = 'Unknown';

                                    // Robust contact and phone resolution:
                                    const custName = typeof activeTask.customer === 'string' 
                                        ? activeTask.customer 
                                        : (activeTask.customer?.name || activeTask.customerName || activeTask.deliveryAddress?.name || activeTask.shippingAddress?.name || 'Customer');

                                    const custPhone = activeTask.phone || activeTask.customerPhone || 
                                        (typeof activeTask.customer === 'object' ? (activeTask.customer?.phoneNumber || activeTask.customer?.phone) : '') || 
                                        activeTask.deliveryAddress?.phone || activeTask.deliveryAddress?.mobile || activeTask.shippingAddress?.phone || activeTask.shippingAddress?.mobile || '';

                                    const tailorName = activeTask.vendorName || activeTask.tailor?.shopName || activeTask.tailor?.name || 
                                        (typeof activeTask.tailor === 'string' ? activeTask.tailor : 'Tailor Workshop');

                                    const tailorPhone = activeTask.vendorPhone || activeTask.tailorPhone || activeTask.tailor?.phoneNumber || activeTask.tailor?.phone || '';

                                    if (isFabricPickup) {
                                        // Fabric Pickup Flow: Customer -> Tailor
                                        if (isPickupStage) {
                                            address = activeTask.deliveryAddress || activeTask.address || activeTask.shippingAddress;
                                            contactName = custName;
                                            contactPhone = custPhone;
                                        } else {
                                            address = activeTask.vendorAddress || activeTask.tailor?.location?.address || activeTask.tailor?.address;
                                            contactName = tailorName;
                                            contactPhone = tailorPhone;
                                        }
                                    } else {
                                        // Final Delivery Flow: Tailor -> Customer
                                        if (isPickupStage) {
                                            address = activeTask.vendorAddress || activeTask.tailor?.location?.address || activeTask.tailor?.address;
                                            contactName = tailorName;
                                            contactPhone = tailorPhone;
                                        } else {
                                            address = activeTask.deliveryAddress || activeTask.address || activeTask.shippingAddress;
                                            contactName = custName;
                                            contactPhone = custPhone;
                                        }
                                    }

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
                            {activeTab === 'assigned' && (
                                <>
                                    {/* Tasks awaiting acceptance (partner was notified, needs to Accept/Reject) */}
                                    {pendingAcceptanceTasks.map((task) => (
                                        <div key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-primary/30 shadow-lg relative overflow-hidden animate-pulse-border">
                                            {/* Pulsing notification dot */}
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                                                <div className="w-2 h-2 bg-green-500 rounded-full relative" />
                                                <span className="text-[8px] font-black text-green-700 uppercase tracking-widest ml-2">New Request!</span>
                                            </div>

                                            <div className="mb-3 mt-1">
                                                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest mb-1 ${task.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                                    {task.taskType === 'fabric-pickup' ? '📦 Fabric Collection' : '🛵 Final Delivery'}
                                                </div>
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">New Delivery Task</h3>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Order #{task.orderId} • Please accept or reject</p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 mb-3">
                                                <div className="flex gap-2">
                                                    <MapPin size={12} className="text-primary-dark mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup</p>
                                                        <p className="text-[11px] font-bold text-primary-dark leading-tight">
                                                            {task.taskType === 'fabric-pickup'
                                                                ? formatAddress(task.deliveryAddress)
                                                                : (task.tailor?.shopName || 'Tailor Workshop')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                                                    <Navigation size={12} className="text-green-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Drop-off</p>
                                                        <p className="text-[11px] font-bold text-slate-600 leading-tight">
                                                            {task.taskType === 'fabric-pickup'
                                                                ? (task.tailor?.shopName || 'Tailor Workshop')
                                                                : formatAddress(task.deliveryAddress)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await deliveryService.rejectOrder(task._id);
                                                            toast.success('Task rejected');
                                                            fetchTasks();
                                                        } catch (e) {
                                                            toast.error('Failed to reject task');
                                                        }
                                                    }}
                                                    className="py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
                                                >
                                                    <X size={12} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptOrder(task._id)}
                                                    className="py-2.5 bg-primary text-white rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all"
                                                >
                                                    <Check size={12} /> Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Already accepted tasks (just waiting to start) */}
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
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                                                    Accepted
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

                                    {pendingAcceptanceTasks.length === 0 && pendingTasks.length === 0 && (
                                        <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="text-slate-500 font-bold capitalize tracking-wide text-sm">No pending tasks assigned.</p>
                                            <p className="text-slate-400 text-[9px] mt-0.5">Check "Find New" for available dispatches.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {activeTab === 'available' && (
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
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-wide italic leading-none mt-0.5">Reward: ₹{task.deliveryEarnings || task.deliveryFee || 20}</p>
                                                    </div>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${task.taskType === 'fabric-pickup' ? 'bg-amber-600' : 'bg-primary'}`}>
                                                        <MdTwoWheeler size={18} />
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
                                                                    ? (task.address || formatAddress(task.deliveryAddress)) 
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
                                                                    : (task.address || formatAddress(task.deliveryAddress))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleAcceptOrder(task._id)}
                                                    className="w-full bg-slate-900 text-white rounded-xl py-3 font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                                                >
                                                    Accept Order <Check size={14} />
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
                            {activeTab === 'completed' && (
                                <>
                                    {completedTasks.map((task) => (
                                        <div key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all mb-3">
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
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                                                    {task.status.replace(/-/g, ' ')}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 pl-0.5">
                                                <div className="flex gap-2.5">
                                                    <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                        <CheckCircle2 size={12} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Delivered To</p>
                                                        <p className="text-[11px] font-bold text-slate-600 leading-tight capitalize">
                                                            {task.taskType === 'fabric-pickup'
                                                                ? formatAddress(task.tailor?.location?.address || task.tailor?.address)
                                                                : formatAddress(task.deliveryAddress)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {completedTasks.length === 0 && (
                                        <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="text-slate-500 font-bold capitalize tracking-wide text-sm">No completed tasks.</p>
                                            <p className="text-slate-400 text-[9px] mt-0.5">Your delivered orders will appear here.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                </>
            )}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, true)}
            />
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, false)}
            />
        </div>
    );
};

export default Tasks;

