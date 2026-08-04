import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Ruler, MapPin, X, ArrowRight, Check, Package, Navigation, Phone, Clock, User } from 'lucide-react';
import socket from '../../../shared/utils/socket';
import useMeasurementStore from '../store/measurementExecutiveStore';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

import { startRingtone, stopRingtone } from '../../../utils/audioAlert';

const startAlertAudio = () => {
    startRingtone();
};

const stopAlertAudio = () => {
    stopRingtone();
};

const formatAddress = (addr) => {
    if (!addr) return 'Address details pending';
    if (typeof addr === 'string') return addr.trim() || 'Address details pending';
    if (typeof addr === 'object') {
        const parts = [
            addr.street || addr.addressLine1 || addr.address || addr.houseNo,
            addr.landmark,
            addr.city,
            addr.state,
            addr.pincode || addr.zipCode || addr.zip
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
    }
    return 'Address details pending';
};

const extractCustomerName = (data) => {
    if (data.customerName && data.customerName !== 'Customer') return data.customerName;
    if (typeof data.customer === 'object' && data.customer?.name) return data.customer.name;
    if (data.order && typeof data.order === 'object' && data.order.customer?.name) return data.order.customer.name;
    if (typeof data.customer === 'string' && data.customer.length < 30) return data.customer;
    return 'Customer';
};

const extractCustomerPhone = (data) => {
    if (data.customerPhone && data.customerPhone !== 'N/A') return data.customerPhone;
    if (typeof data.customer === 'object' && data.customer?.phoneNumber) return data.customer.phoneNumber;
    if (data.order && typeof data.order === 'object' && data.order.customer?.phoneNumber) return data.order.customer.phoneNumber;
    return '';
};

const NewMeasurementRequestAlert = () => {
    const [request, setRequest] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const { acceptRequest, rejectRequest } = useMeasurementStore();
    const dismissedRequestsRef = useRef(new Set());
    const requestRef = useRef(null);

    useEffect(() => {
        requestRef.current = request;
    }, [request]);

    // Swipe motion values
    const x = useMotionValue(0);
    const textOpacity = useTransform(x, [0, 50], [1, 0]);
    const checkOpacity = useTransform(x, [150, 190], [0, 1]);
    const checkScale = useTransform(x, [150, 200], [0.5, 1.2]);

    // Audio Ringtone Lifecycle
    useEffect(() => {
        if (request) {
            startAlertAudio();
        } else {
            stopAlertAudio();
        }
        return () => {
            stopAlertAudio();
        };
    }, [request]);

    // Auto-timeout (45s) dismiss handler
    useEffect(() => {
        if (!request) return;

        const timer = setTimeout(() => {
            const reqId = request?._id || request?.requestId;
            if (reqId) dismissedRequestsRef.current.add(reqId.toString());
            setRequest(null);
            toast('Measurement request moved to requests list.', {
                icon: '📐',
                duration: 4000,
            });
        }, 45000);

        return () => clearTimeout(timer);
    }, [request]);

    // Socket Event & FCM Listeners
    useEffect(() => {
        const handleNewSocketRequest = (data) => {
            console.log('📐 New Measurement Request Socket Event Received:', data);
            const reqId = data.requestId || data._id || data.id;
            if (reqId && dismissedRequestsRef.current.has(reqId.toString())) {
                return;
            }

            const rawAddr = data.address || data.customerAddress || data.order?.deliveryAddress;

            setRequest({
                _id: reqId,
                requestId: reqId,
                requestIdStr: data.requestIdStr || reqId,
                orderIdStr: data.orderIdStr || data.orderId || data.order?.orderId || 'N/A',
                customerName: extractCustomerName(data),
                customerPhone: extractCustomerPhone(data),
                address: formatAddress(rawAddr),
                distance: data.distance ? `${Number(data.distance).toFixed(1)} km` : null,
                scheduledTime: data.scheduledTime ? new Date(data.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'As soon as possible',
                earnings: data.earnings || data.payout || 150,
            });
        };

        const handleFCMMessage = (event) => {
            const payload = event.detail?.data || {};
            if (payload.type === 'NEW_MEASUREMENT_REQUEST' || payload.type === 'MEASUREMENT_ASSIGNED') {
                handleNewSocketRequest(payload);
            }
        };

        if (socket) {
            socket.on('new_measurement_request', handleNewSocketRequest);
        }
        window.addEventListener('fcm_message', handleFCMMessage);

        return () => {
            if (socket) {
                socket.off('new_measurement_request', handleNewSocketRequest);
            }
            window.removeEventListener('fcm_message', handleFCMMessage);
        };
    }, []);

    // Polling & Mount Fetch for Pending Measurement Requests
    useEffect(() => {
        const pollForRequests = async () => {
            if (request || isAccepting) return;

            try {
                const res = await api.get('/measurement-executive/requests?status=pending');
                if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    const pendingList = res.data.data;
                    const reqToShow = pendingList.find(r => {
                        const idStr = (r._id || r.requestId || '').toString();
                        return !dismissedRequestsRef.current.has(idStr);
                    });

                    if (reqToShow) {
                        const reqId = reqToShow._id || reqToShow.requestId;
                        const rawAddr = reqToShow.customerAddress || reqToShow.address || reqToShow.order?.deliveryAddress;

                        setRequest({
                            _id: reqId,
                            requestId: reqId,
                            requestIdStr: reqToShow.requestId || reqId,
                            orderIdStr: reqToShow.order?.orderId || reqToShow.orderId || 'N/A',
                            customerName: extractCustomerName(reqToShow),
                            customerPhone: extractCustomerPhone(reqToShow),
                            address: formatAddress(rawAddr),
                            distance: reqToShow.distance ? `${Number(reqToShow.distance).toFixed(1)} km` : null,
                            scheduledTime: reqToShow.scheduledTime ? new Date(reqToShow.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'As soon as possible',
                            earnings: reqToShow.payout || 150,
                        });
                    }
                }
            } catch (err) {
                console.error('Polling measurement requests error:', err);
            }
        };

        pollForRequests();
        const interval = setInterval(pollForRequests, 10000);
        return () => clearInterval(interval);
    }, [request, isAccepting]);

    const handleAccept = async () => {
        const reqId = request?._id || request?.requestId;
        if (!reqId || isAccepting) return;

        setIsAccepting(true);
        if (reqId) dismissedRequestsRef.current.add(reqId.toString());

        try {
            await acceptRequest(reqId);
            toast.success('Measurement Visit Accepted! 🚀', {
                style: {
                    borderRadius: '1rem',
                    background: '#843D9B',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '12px'
                }
            });
            stopAlertAudio();
            setRequest(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Request no longer available');
            stopAlertAudio();
            setRequest(null);
        } finally {
            setIsAccepting(false);
            x.set(0);
        }
    };

    const handleReject = async () => {
        const reqId = request?._id || request?.requestId;
        if (!reqId) {
            setRequest(null);
            return;
        }

        if (reqId) dismissedRequestsRef.current.add(reqId.toString());

        try {
            await rejectRequest(reqId);
            toast.error('Measurement Request Declined.', {
                style: {
                    borderRadius: '1rem',
                    background: '#333',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '11px'
                }
            });
        } catch (error) {
            console.error('Reject error:', error);
        } finally {
            stopAlertAudio();
            setRequest(null);
        }
    };

    const onDragEnd = (event, info) => {
        if (info.offset.x > 180) {
            handleAccept();
        } else {
            x.set(0);
        }
    };

    if (!request) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-4 left-4 right-4 z-[9999]"
            >
                <div className="bg-slate-900 rounded-[2rem] border border-purple-500/30 shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-900/60 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                                <Ruler size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5 animate-pulse">
                                    New Dispatch Request
                                </h3>
                                <p className="text-[10px] font-bold text-purple-300 tracking-widest leading-none">
                                    EST. EARNINGS: ₹{request.earnings || 150}.00
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

                    {/* Content Body */}
                    <div className="p-6 space-y-4">
                        {/* Customer Visit Location Card */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                    <User size={12} /> Customer Measurement Visit
                                </span>
                                {request.distance && (
                                    <span className="text-[10px] font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Navigation size={10} /> {request.distance}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-white leading-snug">
                                    {request.customerName}
                                </h4>
                                <div className="flex items-start gap-2 text-white/70 text-xs mt-1.5 leading-snug">
                                    <MapPin size={14} className="text-purple-400 shrink-0 mt-0.5" />
                                    <span>{request.address}</span>
                                </div>
                            </div>

                            {request.customerPhone && (
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                                        <Phone size={12} />
                                        <span>{request.customerPhone}</span>
                                    </div>
                                    <a
                                        href={`tel:${request.customerPhone}`}
                                        className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded-lg border border-purple-500/40 transition-colors"
                                    >
                                        Call Customer
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Scheduled Time & Order Reference */}
                        <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-1.5">
                                <Clock size={13} className="text-purple-400" />
                                <span>Visit Time: <strong className="text-white font-bold">{request.scheduledTime}</strong></span>
                            </div>
                            <div>
                                Order: <strong className="text-purple-300 font-bold">#{request.orderIdStr}</strong>
                            </div>
                        </div>

                        {/* Distance Note */}
                        <div className="flex items-center gap-2 text-white/60 px-1">
                            <MapPin size={12} className="text-purple-400" />
                            <p className="text-[11px] font-bold tracking-wide italic">
                                {request.distance ? `${request.distance} away from your current location` : 'Nearby your current location'}
                            </p>
                        </div>

                        {/* Swipe to Accept - Rapido Style */}
                        <div className="relative h-16 bg-white/5 rounded-2xl border border-white/10 p-1.5 overflow-hidden">
                            <motion.div
                                style={{ opacity: textOpacity }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                                    Swipe to Accept <ArrowRight size={12} />
                                </span>
                            </motion.div>

                            {/* Success State Overlay in Swipe */}
                            <motion.div
                                style={{ opacity: checkOpacity, scale: checkScale }}
                                className="absolute inset-0 flex items-center justify-center bg-purple-500/20 pointer-events-none"
                            >
                                <Check size={24} className="text-purple-300" />
                            </motion.div>

                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 260 }}
                                dragElastic={0.1}
                                onDragEnd={onDragEnd}
                                style={{ x }}
                                className="w-13 h-13 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl cursor-grab active:cursor-grabbing z-10"
                            >
                                {isAccepting ? <Package className="animate-spin text-purple-600" size={20} /> : <ArrowRight size={24} className="text-purple-600" />}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NewMeasurementRequestAlert;
