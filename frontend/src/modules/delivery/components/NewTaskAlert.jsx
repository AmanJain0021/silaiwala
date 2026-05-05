import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, X, ArrowRight, Check, Package } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import useAuthStore from '../../../store/authStore';
import deliveryService from '../services/deliveryService';
import { toast } from 'react-hot-toast';

const NewTaskAlert = ({ onTaskAccepted }) => {
    const [newTask, setNewTask] = useState(null);
    const { user } = useAuthStore();
    const [isAccepting, setIsAccepting] = useState(false);

    // Swipe interaction setup
    const x = useMotionValue(0);
    const xInput = [0, 200]; // Max swipe distance
    const opacity = useTransform(x, xInput, [1, 0.4]);
    const scale = useTransform(x, xInput, [1, 0.95]);
    const textOpacity = useTransform(x, [0, 50], [1, 0]);
    const checkOpacity = useTransform(x, [150, 190], [0, 1]);
    const checkScale = useTransform(x, [150, 200], [0.5, 1.2]);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.emit('join', 'delivery_partners');
        if (user?._id) {
            socket.emit('join', `user_${user._id}`);
        }

        socket.on('new_task', (taskData) => {
            console.log('New task alert received:', taskData);
            // Broadcast format: { title, message, data: { orderId, ... } }
            const payload = taskData.data || taskData;
            setNewTask({
                ...payload,
                message: taskData.message || payload.message
            });

            // Auto close after 30 seconds
            const timer = setTimeout(() => {
                setNewTask(null);
            }, 30000);
        });

        socket.on('new_notification', (data) => {
            if (data.type === 'NEW_DELIVERY_TASK') {
                // Personal notification format: { type, data: { orderId, ... }, message }
                setNewTask({
                    ...data.data,
                    message: data.message
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

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
                        background: '#2D2F6E',
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
            x.set(0); // Reset swipe
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
                <div className="bg-primary-dark rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5">New Dispatch Request</h3>
                                <p className="text-[10px] font-bold text-indigo-300/80 tracking-widest leading-none">EST. EARNINGS: ₹20.00</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNewTask(null)}
                            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 transition-all"
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
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Route Context</p>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-black text-white leading-tight">
                                            {newTask.taskType === 'fabric-pickup'
                                                ? `Pickup: ${newTask.customer?.name || 'Customer'}`
                                                : `Pickup: ${newTask.tailor?.shopName || 'Artisan'}`}
                                        </p>
                                        <p className="text-[11px] font-bold text-indigo-300/60 leading-tight">
                                            {newTask.taskType === 'fabric-pickup'
                                                ? `Drop to: ${newTask.tailor?.shopName || 'Workshop'}`
                                                : `Drop to: ${newTask.customer?.name || 'Requester'}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPin size={12} className="text-primary" />
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
                                className="absolute inset-0 flex items-center justify-center bg-primary/20 pointer-events-none"
                            >
                                <Check size={24} className="text-primary-light" />
                            </motion.div>

                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 260 }}
                                dragElastic={0.1}
                                onDragEnd={onDragEnd}
                                style={{ x }}
                                className="w-13 h-13 bg-white rounded-xl flex items-center justify-center text-primary-dark shadow-xl cursor-grab active:cursor-grabbing z-10"
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
