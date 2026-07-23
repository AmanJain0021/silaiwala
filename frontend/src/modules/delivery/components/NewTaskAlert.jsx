import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, X, ArrowRight, Check, Package } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useSocketStore from '../../../store/socketStore';
import { getToken } from '../../../utils/auth';
import deliveryService from '../services/deliveryService';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { isPendingAcceptanceTask } from '../utils/taskStatus';

// Web Audio API Buzzer Audio Context & Nodes
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let intervalId = null;

const startBuzzer = () => {
    try {
        stopBuzzer(); // Safety cleanup before starting new context
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioCtx = new AudioContext();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        // Sawtooth wave sounds like a digital vehicle buzzer
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(140, audioCtx.currentTime); // Low buzz

        // Low volume to prevent discomfort
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();

        // Pulsing pattern (0.5s sound, 0.5s silence)
        let isBeeping = true;
        intervalId = setInterval(() => {
            if (gainNode && audioCtx) {
                isBeeping = !isBeeping;
                gainNode.gain.setValueAtTime(isBeeping ? 0.18 : 0, audioCtx.currentTime);
            }
        }, 500);

        // Resume Audio Context if suspended by browser autoplay policy
        if (audioCtx.state === 'suspended') {
            const resumeHandler = () => {
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                document.removeEventListener('click', resumeHandler);
            };
            document.addEventListener('click', resumeHandler);
        }
    } catch (error) {
        console.warn("Autoplay policy or audio device issue blocked buzzer:", error.message);
    }
};

const stopBuzzer = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (oscillator) {
        try {
            oscillator.stop();
            oscillator.disconnect();
        } catch (e) {}
        oscillator = null;
    }
    if (gainNode) {
        try {
            gainNode.disconnect();
        } catch (e) {}
        gainNode = null;
    }
    if (audioCtx) {
        try {
            audioCtx.close();
        } catch (e) {}
        audioCtx = null;
    }
};

const NewTaskAlert = ({ onTaskAccepted }) => {
    const [newTask, setNewTask] = useState(null);
    const { user } = useAuthStore();
    const [isAccepting, setIsAccepting] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const { socket } = useSocketStore();
    const dismissedTasksRef = useRef(new Set());
    const isBusyRef = useRef(false); // Ref to track if delivery partner has an active task
    const newTaskRef = useRef(null);

    useEffect(() => {
        newTaskRef.current = newTask;
    }, [newTask]);

    // Swipe interaction setup
    const x = useMotionValue(0);
    const xInput = [0, 200]; 
    const opacity = useTransform(x, xInput, [1, 0.4]);
    const scale = useTransform(x, xInput, [1, 0.95]);
    const textOpacity = useTransform(x, [0, 50], [1, 0]);
    const checkOpacity = useTransform(x, [150, 190], [0, 1]);
    const checkScale = useTransform(x, [150, 200], [0.5, 1.2]);

    // Browser Audio Autoplay Unlock
    useEffect(() => {
        const unlockAudio = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const tempCtx = new AudioContext();
                    if (tempCtx.state === 'suspended') {
                        tempCtx.resume().then(() => {
                            tempCtx.close();
                            console.log("🔊 Browser audio context unlocked successfully.");
                        });
                    } else {
                        tempCtx.close();
                        console.log("🔊 Browser audio context already unlocked.");
                    }
                }
            } catch (e) {
                console.warn("Failed to unlock audio context:", e.message);
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    // Handle Buzzer Audio Lifecycle
    useEffect(() => {
        if (newTask) {
            startBuzzer();
        } else {
            stopBuzzer();
        }
        return () => {
            stopBuzzer();
        };
    }, [newTask]);

    // Handle popup timeout (30s) — dismiss only, do NOT permanently reject.
    // Permanent reject was hiding the order forever via rejectedBy.
    useEffect(() => {
        if (!newTask) return;

        const timer = setTimeout(() => {
            console.log('Task alert timed out. Dismissing popup (order stays available).');
            const orderId = newTask?._id || newTask?.orderId;
            if (orderId) dismissedTasksRef.current.add(orderId.toString());
            setNewTask(null);
            toast('Request moved to Tasks — accept it anytime.', {
                icon: '📋',
                duration: 4000,
            });
        }, 30000);

        return () => {
            clearTimeout(timer);
        };
    }, [newTask]);

    // Fetch Full Order Details for Address and Earnings Context
    useEffect(() => {
        const fetchOrderDetails = async () => {
            const orderId = newTask?._id || newTask?.orderId;
            if (!orderId || newTask.fullDetailsLoaded) return;
            
            setIsLoadingDetails(true);
            try {
                const res = await api.get(`/deliveries/orders/${orderId}`);
                if (res.data.success && res.data.data) {
                    setNewTask(prev => {
                        // Prevent overriding if user rejected it while fetching
                        if (!prev || (prev._id !== orderId && prev.orderId !== orderId)) return prev;
                        return { ...prev, ...res.data.data, fullDetailsLoaded: true };
                    });
                }
            } catch (err) {
                console.error("Failed to load full task details:", err);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        if (newTask && !newTask.fullDetailsLoaded) {
            fetchOrderDetails();
        }
    }, [newTask]);

    useEffect(() => {
        const handleNewTask = (taskData) => {
            if (isBusyRef.current) {
                console.log('Ignored new task alert because partner is busy');
                return;
            }
            console.log('New task alert received via socket:', taskData);
            const payload = taskData.data || taskData;
            const orderMongoId = payload.orderId || taskData._id || payload._id;
            setNewTask({
                ...payload,
                _id: taskData._id || payload._id || orderMongoId,
                orderId_str: payload.orderId_str || taskData.orderId,
                assignedByAdmin: !!(taskData.assignedByAdmin || payload.assignedByAdmin),
                message: taskData.message || payload.message,
            });
        };

        const handleReceiveNewOrder = (taskData) => {
            if (isBusyRef.current) {
                console.log('Ignored broadcasted order because partner is busy');
                return;
            }
            console.log('Broadcasted order received via socket:', taskData);
            const payload = taskData.data || taskData;
            setNewTask({
                ...payload,
                message: taskData.message || payload.message || "New Task Available in Pool!"
            });
        };

        const handleNewNotification = (data) => {
            if (isBusyRef.current) return;
            console.log('New notification received on delivery partner app:', data);
            if (data.type === 'NEW_DELIVERY_TASK' || data.type === 'TASK_ASSIGNED') {
                const payload = data.data || {};
                let resolvedTaskType = payload.taskType;
                if (!resolvedTaskType) {
                    const statusVal = payload.type || '';
                    resolvedTaskType = (statusVal === 'fabric-ready-for-pickup' || statusVal === 'pending') 
                        ? 'fabric-pickup' 
                        : 'order-delivery';
                }

                const orderMongoId = payload.orderId || payload._id;
                setNewTask({
                    ...payload,
                    _id: orderMongoId,
                    orderId_str: payload.orderId_str,
                    taskType: resolvedTaskType,
                    assignedByAdmin: !!payload.assignedByAdmin,
                    message: data.message || payload.message,
                });
            }
        };

        const handleFCMMessage = (event) => {
            if (isBusyRef.current) return;
            const payload = event.detail;
            console.log('FCM Message received in NewTaskAlert:', payload);
            const data = payload.data || {};
            if (data.type === 'NEW_DELIVERY_TASK' || data.type === 'TASK_ASSIGNED' || data.type === 'new_task') {
                let resolvedTaskType = data.taskType;
                if (!resolvedTaskType) {
                    const statusVal = data.status || data.type || '';
                    resolvedTaskType = (statusVal === 'fabric-ready-for-pickup' || statusVal === 'pending') 
                        ? 'fabric-pickup' 
                        : 'order-delivery';
                }
                setNewTask({
                    ...data,
                    _id: data.orderId || data._id,
                    orderId_str: data.orderId_str,
                    taskType: resolvedTaskType,
                    assignedByAdmin: data.assignedByAdmin === 'true' || data.assignedByAdmin === true,
                    message: payload.notification?.body || data.message || "New Task Available!",
                });
            }
        };

        const handleTaskClaimed = (data) => {
            const assignedTo = data?.assignedTo?.toString?.();
            const myId = (user?._id || user?.id)?.toString?.();
            if (assignedTo && myId && assignedTo === myId) {
                return;
            }
            const claimedId = data?.orderId?.toString?.() || data?.orderId;
            const current = newTaskRef.current;
            const currentId = current?._id?.toString?.() || current?.orderId?.toString?.() || current?._id || current?.orderId;
            if (claimedId) {
                dismissedTasksRef.current.add(claimedId);
            }
            if (claimedId && currentId && claimedId === currentId.toString()) {
                console.log('Dismissing alert — task claimed by another partner');
                setNewTask(null);
            }
        };

        const handleAdminTaskAssigned = (data) => {
            if (isBusyRef.current) return;
            setNewTask({
                ...data,
                _id: data._id,
                orderId_str: data.orderId,
                assignedByAdmin: true,
                message: data.message || `Admin assigned order ${data.orderId} to you.`,
            });
        };

        if (socket) {
            socket.on('new_task', handleNewTask);
            socket.on('new_order', handleNewTask);
            socket.on('receive_new_order', handleReceiveNewOrder);
            socket.on('new_notification', handleNewNotification);
            socket.on('admin_task_assigned', handleAdminTaskAssigned);
            socket.on('task_claimed', handleTaskClaimed);
        }
        window.addEventListener('fcm_message', handleFCMMessage);

        return () => {
            if (socket) {
                socket.off('new_task', handleNewTask);
                socket.off('new_order', handleNewTask);
                socket.off('receive_new_order', handleReceiveNewOrder);
                socket.off('new_notification', handleNewNotification);
                socket.off('admin_task_assigned', handleAdminTaskAssigned);
                socket.off('task_claimed', handleTaskClaimed);
            }
            window.removeEventListener('fcm_message', handleFCMMessage);
        };
    }, [socket, user]);

    // Polling fallback mechanism
    useEffect(() => {
        const pollForTasks = async () => {
            if (newTask || isAccepting || !user) return; // Don't interrupt or poll if not logged in

            try {
                const [assignedRes, availableRes] = await Promise.all([
                    deliveryService.getAssignedOrders(null, true),
                    deliveryService.getAvailableOrders(true)
                ]);

                console.log('Polling raw responses:', { assigned: assignedRes?.data?.length, available: availableRes?.data?.length });

                const allPending = [];

                if (assignedRes?.success && assignedRes.data) {
                    // Check if delivery partner is currently busy with an active order
                    const hasActiveOrder = assignedRes.data.some(t => {
                        if (t.isOffline) {
                            return t.deliveryPartnerStatus === 'accepted' && t.status !== 'delivered';
                        }
                        const uid = user?._id || user?.id;
                        const dpId = typeof t.deliveryPartner === 'object' ? t.deliveryPartner?._id : t.deliveryPartner;
                        const ppId = typeof t.pickupPartner === 'object' ? t.pickupPartner?._id : t.pickupPartner;
                        const dopId = typeof t.dropoffPartner === 'object' ? t.dropoffPartner?._id : t.dropoffPartner;
                        
                        const isLegacyActive = !!dpId && dpId === uid && ['accepted', 'picked-up', 'out-for-delivery'].includes(t.deliveryStatus);
                        const isPickupActive = !!ppId && ppId === uid && ['accepted', 'picked-up', 'out-for-delivery'].includes(t.pickupDeliveryStatus);
                        const isDropoffActive = !!dopId && dopId === uid && ['accepted', 'picked-up', 'out-for-delivery'].includes(t.dropoffDeliveryStatus);
                        
                        const isActiveStatus = ['accepted', 'picked_up', 'picked-up', 'out_for_delivery', 'out-for-delivery', 'fabric-picked-up', 'picked-up-from-tailor'].includes(t.status);
                        const isAssignedToMe = dpId === uid || ppId === uid || dopId === uid;
                        
                        return isLegacyActive || isPickupActive || isDropoffActive || (isActiveStatus && isAssignedToMe);
                    });

                    isBusyRef.current = hasActiveOrder;
                    
                    if (hasActiveOrder) {
                        return; // Stop polling for new tasks if busy
                    }

                    const targeted = assignedRes.data.filter(t => {
                        // Only surface tasks that still need Accept/Reject
                        return isPendingAcceptanceTask(t, user);
                    });
                    allPending.push(...targeted);
                }

                if (availableRes?.success && availableRes.data) {
                    const poolOrders = availableRes.data.filter(t => !allPending.some(p => p._id === t._id));
                    allPending.push(...poolOrders);
                }

                console.log('Polling allPending length:', allPending.length);

                // Find first task not dismissed in this session
                const taskToShow = allPending.find(t => !dismissedTasksRef.current.has(t._id));
                
                console.log('taskToShow found:', !!taskToShow, 'dismissedTasks count:', dismissedTasksRef.current.size);

                if (taskToShow) {
                    console.log('Polling found a pending/available task:', taskToShow);
                    setNewTask({
                        ...taskToShow,
                        orderId_str: taskToShow.orderId,
                        message: "New Task Available!"
                    });
                }
            } catch (error) {
                console.error("Failed to poll for new tasks:", error);
            }
        };

        pollForTasks();
        const pollInterval = setInterval(pollForTasks, 15000);
        return () => clearInterval(pollInterval);
    }, [newTask, isAccepting, user]);

    const handleAccept = async () => {
        const orderId = newTask?._id || newTask?.orderId;
        if (!orderId || isAccepting) return;

        setIsAccepting(true);
        if (newTask?._id) dismissedTasksRef.current.add(newTask._id);
        
        try {
            const res = await deliveryService.acceptOrder(orderId);
            if (res.success) {
                toast.success('Task Accepted! Heading to pickup.', {
                    icon: '🚀',
                    style: {
                        borderRadius: '1rem',
                        background: '#843D9B',
                        color: '#fff',
                        fontWeight: '900',
                        fontSize: '12px',
                        letterSpacing: '0.05em'
                    }
                });
                setNewTask(null);
                if (onTaskAccepted) onTaskAccepted(newTask.orderId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Task already claimed');
            setNewTask(null);
        } finally {
            setIsAccepting(false);
            x.set(0); 
        }
    };

    const handleReject = async () => {
        const orderId = newTask?._id || newTask?.orderId;
        if (!orderId) {
            setNewTask(null);
            return;
        }

        if (newTask?._id) dismissedTasksRef.current.add(newTask._id);

        try {
            await deliveryService.rejectOrder(orderId);
            toast.error('Task Rejected.', {
                style: {
                    borderRadius: '1rem',
                    background: '#333',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '11px'
                }
            });
        } catch (error) {
            console.error('Failed to reject order:', error);
        } finally {
            setNewTask(null);
        }
    };

    const onDragEnd = (event, info) => {
        if (info.offset.x > 180) {
            handleAccept();
        } else {
            x.set(0);
        }
    };

    if (!newTask) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-4 left-4 right-4 z-[200]"
            >
                <div className="bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5 animate-pulse">
                                    {newTask.assignedByAdmin ? 'Admin Assigned Order' : 'New Dispatch Request'}
                                </h3>
                                <p className="text-[10px] font-bold text-indigo-300/80 tracking-widest leading-none">
                                    {isLoadingDetails ? 'CALCULATING EARNINGS...' : `EST. EARNINGS: ₹${newTask.deliveryEarnings || 20}.00`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleReject}
                            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-rose-500 transition-all cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <div className="w-0.5 flex-1 bg-white/5 border-l border-white/10 border-dashed my-1"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Route Context</p>
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                            <p className="text-xs font-black text-emerald-400 mb-0.5">
                                                Pickup: {newTask.taskType === 'fabric-pickup'
                                                    ? (newTask.customer?.name || (typeof newTask.customer === 'string' ? newTask.customer : 'Customer'))
                                                    : (newTask.vendorName || newTask.tailor?.shopName || 'Artisan')}
                                            </p>
                                            {isLoadingDetails ? (
                                                <p className="text-[10px] font-medium text-white/40 leading-tight animate-pulse">Fetching address details...</p>
                                            ) : (
                                                <p className="text-[10px] font-medium text-white/70 leading-tight line-clamp-2">
                                                    {newTask.taskType === 'fabric-pickup' ? (newTask.address || 'Address pending') : (newTask.vendorAddress || 'Address pending')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                            <p className="text-xs font-black text-amber-400 mb-0.5">
                                                Drop to: {newTask.taskType === 'fabric-pickup'
                                                    ? (newTask.vendorName || newTask.tailor?.shopName || 'Workshop')
                                                    : (newTask.customer?.name || (typeof newTask.customer === 'string' ? newTask.customer : 'Requester'))}
                                            </p>
                                            {isLoadingDetails ? (
                                                <p className="text-[10px] font-medium text-white/40 leading-tight animate-pulse">Fetching address details...</p>
                                            ) : (
                                                <p className="text-[10px] font-medium text-white/70 leading-tight line-clamp-2">
                                                    {newTask.taskType === 'fabric-pickup' ? (newTask.vendorAddress || 'Address pending') : (newTask.address || 'Address pending')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPin size={12} className="text-indigo-400" />
                                    <p className="text-[11px] font-bold tracking-wide italic">Nearby your current location</p>
                                </div>
                            </div>
                        </div>

                        {/* Swipe to Accept - Rapido Style */}
                        <div className="relative h-16 bg-white/5 rounded-2xl border border-white/10 p-1.5 overflow-hidden">
                            <motion.div
                                style={{ opacity: textOpacity }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                    Swipe to Accept <ArrowRight size={12} />
                                </span>
                            </motion.div>

                            {/* Success State Overlay in Swipe */}
                            <motion.div
                                style={{ opacity: checkOpacity, scale: checkScale }}
                                className="absolute inset-0 flex items-center justify-center bg-indigo-500/20 pointer-events-none"
                            >
                                <Check size={24} className="text-indigo-300" />
                            </motion.div>
                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 260 }}
                                dragElastic={0.1}
                                onDragEnd={onDragEnd}
                                style={{ x }}
                                className="w-13 h-13 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl cursor-grab active:cursor-grabbing z-10"
                            >
                                {isAccepting ? <Package className="animate-spin" size={20} /> : <ArrowRight size={24} />}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NewTaskAlert;
