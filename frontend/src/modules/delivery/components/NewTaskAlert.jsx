import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, X, ArrowRight, Check, Package } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import useAuthStore from '../../../store/authStore';
import { getToken } from '../../../utils/auth';
import deliveryService from '../services/deliveryService';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

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

    // Handle Auto-Reject Timeout (30 seconds)
    useEffect(() => {
        if (!newTask) return;

        const timer = setTimeout(() => {
            console.log('Task alert timed out. Auto-rejecting order...');
            handleReject();
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
        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });

        socket.emit('join', 'delivery_partners');
        const userId = user?._id || user?.id;
        if (userId) {
            socket.emit('join', `user_${userId}`);
            console.log(`📡 Socket: Joined user room: user_${userId}`);
        }

        socket.on('new_task', (taskData) => {
            console.log('New task alert received via socket:', taskData);
            const payload = taskData.data || taskData;
            setNewTask({
                ...payload,
                message: taskData.message || payload.message
            });
        });

        socket.on('new_notification', (data) => {
            console.log('New notification received on delivery partner app:', data);
            if (data.type === 'NEW_DELIVERY_TASK' || data.type === 'TASK_ASSIGNED') {
                const payload = data.data || {};
                let resolvedTaskType = payload.taskType;
                if (!resolvedTaskType) {
                    const statusVal = payload.type || '';
                    resolvedTaskType = (statusVal === 'fabric-ready-for-pickup' || statusVal === 'pending') 
                        ? 'fabric-pickup' 
                        : 'final-delivery';
                }

                setNewTask({
                    ...payload,
                    taskType: resolvedTaskType,
                    message: data.message || payload.message
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id, user?.id]);

    const handleAccept = async () => {
        const orderId = newTask?._id || newTask?.orderId;
        if (!orderId || isAccepting) return;

        setIsAccepting(true);
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
                                <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5 animate-pulse">New Dispatch Request</h3>
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
                                                    ? (newTask.customer || newTask.customer?.name || 'Customer')
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
                                                    : (newTask.customer || newTask.customer?.name || 'Requester')}
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
