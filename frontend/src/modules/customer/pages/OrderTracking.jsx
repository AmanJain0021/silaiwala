import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Phone, MessageSquare,
    AlertCircle, HelpCircle, Package, Truck,
    Calendar, ExternalLink, ChevronRight, ShieldCheck,
    Loader2, CheckCircle2, Star, User, Scissors
} from 'lucide-react';
import api from '../../../utils/api';
import TrackingTimeline from '../components/orders/TrackingTimeline';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import ReviewModal from '../components/orders/ReviewModal';

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);
    const [isBulk, setIsBulk] = useState(location.state?.isBulk || false);

    const fetchOrderDetails = async () => {
        try {
            // Try fetching from standard orders first
            let response;
            try {
                response = await api.get(`/orders/${id}`);
            } catch (err) {
                if (err.response?.status === 404) {
                    // Try bulk orders if not found in standard
                    response = await api.get(`/bulk-orders/${id}`);
                    setIsBulk(true);
                } else {
                    throw err;
                }
            }

            if (response.data.success) {
                setOrder(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching order tracking:', err);
            setError(err.response?.data?.message || 'Failed to load tracking details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrderDetails();

            const socket = io(SOCKET_URL);
            socket.emit('join_order_room', id);

            socket.on('order_status_updated', (data) => {
                console.log('Real-time tracking update received:', data);
                fetchOrderDetails();
            });

            // Also listen for general notifications as fallback
            socket.on('new_notification', (data) => {
                if (data.data?.orderId === id) {
                    fetchOrderDetails();
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fetching live status...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <h2 className="text-lg font-bold text-gray-900">{error || 'Order Not Found'}</h2>
                <button 
                    onClick={() => navigate('/orders')} 
                    className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                    Back to My Orders
                </button>
            </div>
        );
    }

    // Data Extraction based on Order Type
    const serviceTitle = isBulk 
        ? `${order.organizationName} - ${order.serviceType}`
        : (order.items?.[0]?.service?.title || order.items?.[0]?.product?.name || 'Order Detail');
    
    const imageUrl = isBulk
        ? (order.referenceImages?.[0] || null)
        : (order.items?.[0]?.service?.image || order.items?.[0]?.product?.images?.[0] || order.items?.[0]?.product?.image);

    // Arrival Date Calculation
    const getArrivalDate = () => {
        if (isBulk && order.expectedDeliveryDate) {
            return new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        const baseDate = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
        const firstItem = order.items?.[0];
        const deliveryType = firstItem?.deliveryType || 'standard';
        const deliveryDays = deliveryType === 'express' ? 10 : (deliveryType === 'premium' ? 7 : 15);
        baseDate.setDate(baseDate.getDate() + deliveryDays);
        return baseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const dateString = getArrivalDate();

    // Timeline Configuration
    const stages = isBulk 
        ? [
            { key: 'pending', label: 'Inquiry', icon: Package },
            { key: 'accepted', label: 'Paid', icon: ShieldCheck },
            { key: 'accepted-by-tailor', label: 'Assigned', icon: User },
            { key: 'in-production', label: 'Production', icon: Scissors },
            { key: 'shipped', label: 'In Transit', icon: Truck },
            { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
        ]
        : [
            { key: 'pending', label: 'Placed', icon: Package },
            { key: 'accepted', label: 'Accepted', icon: ShieldCheck },
            ...(order.fabricPickupRequired ? [{ key: 'fabric-pickup', label: 'Fabric', icon: Truck }] : []),
            { key: 'in-production', label: 'Crafting', icon: Calendar },
            { key: 'out-for-delivery', label: 'Dispatch', icon: Truck },
            { key: 'delivered', label: 'Arrived', icon: CheckCircle2 }
        ];

    const getStageStatus = (stageKey) => {
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        const status = order.status.toLowerCase();

        // Check completion logic
        if (stageKey === 'pending') return { completed: true, time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        
        // For Bulk
        if (isBulk) {
            const entry = history.find(h => h.status === stageKey);
            const statusOrder = ['pending', 'reviewing', 'quoted', 'accepted', 'accepted-by-tailor', 'in-production', 'shipped', 'delivered', 'completed'];
            const currentIndex = statusOrder.indexOf(status);
            const stageIndex = statusOrder.indexOf(stageKey);
            const isCompleted = !!entry || (currentIndex >= stageIndex && stageIndex !== -1);
            return { completed: isCompleted, time: entry ? new Date(entry.timestamp || entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        if (stageKey === 'accepted') {
            const entry = history.find(h => h.status === 'accepted' || h.status.includes('ready-for-pickup'));
            const isCompleted = !!entry || ['fabric-ready-for-pickup', 'fabric-picked-up', 'fabric-delivered', 'cutting', 'stitching', 'completed', 'ready-for-pickup', 'out-for-delivery', 'delivered'].includes(status);
            return { completed: isCompleted, time: entry ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        if (stageKey === 'fabric-pickup') {
            const entry = history.find(h => h.status === 'fabric-delivered' || h.status === 'delivery-fabric-delivered');
            const isCompleted = !!entry || ['cutting', 'stitching', 'completed', 'ready-for-pickup', 'out-for-delivery', 'delivered'].includes(status);
            return { completed: isCompleted, time: entry ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        if (stageKey === 'in-production') {
            const entry = history.find(h => ['cutting', 'stitching', 'in-progress', 'in-production'].includes(h.status));
            const isCompleted = !!entry || ['completed', 'ready-for-pickup', 'out-for-delivery', 'delivered', 'shipped'].includes(status);
            return { completed: isCompleted, time: entry ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        if (stageKey === 'out-for-delivery' || stageKey === 'shipped') {
            const entry = history.find(h => h.status === 'out-for-delivery' || h.status === 'delivery-out-for-delivery' || h.status === 'shipped');
            const isCompleted = !!entry || ['delivered'].includes(status);
            return { completed: isCompleted, time: entry ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        if (stageKey === 'delivered') {
            const entry = history.find(h => h.status === 'delivered' || h.status === 'delivery-delivered');
            return { completed: !!entry || status === 'delivered', time: entry ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null };
        }

        return { completed: false };
    };

    const timelineStates = stages.map(s => ({ ...s, ...getStageStatus(s.key) }));
    const currentStageIndex = [...timelineStates].reverse().findIndex(s => s.completed);
    const actualCurrentIndex = currentStageIndex === -1 ? 0 : (timelineStates.length - 1 - currentStageIndex);

    const getCurrentStatusMessage = () => {
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        const latestHistory = history[history.length - 1];
        if (latestHistory?.message) return latestHistory.message;
        if (order.status === 'delivered') return "Your order has been delivered successfully.";
        if (isBulk && order.status === 'accepted') return "Security deposit received. Awaiting production start.";
        return "Your order is progressing smoothly through our production line.";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 pb-4 pt-safe flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-bold text-gray-900">Track Order</h1>
                        <p className="text-[10px] text-gray-500 font-medium font-mono uppercase tracking-widest leading-none mt-1">
                            {order.orderId}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-4 animate-in fade-in duration-500">

                {/* 2. Order Quick Summary */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <img src={imageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{serviceTitle}</h3>
                        <div className="flex items-center gap-1.5 text-green-700 font-bold text-[10px] uppercase tracking-wide">
                            <Truck size={12} />
                            <span>{order.status === 'delivered' ? 'Delivered successfully' : `Arriving by ${dateString}`}</span>
                        </div>
                    </div>
                </div>

                {/* 3. The Timeline Section */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            Live Tracking
                        </h3>
                        <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 animate-pulse">
                            Real-time
                        </div>
                    </div>

                    {/* New: Status Progress Banner */}
                    <div className="mb-8 p-4 bg-gradient-to-br from-primary to-primary-dark rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Current Milestone</p>
                            <h2 className="text-xl font-black tracking-tight leading-none mb-2">
                                {timelineStates[actualCurrentIndex]?.label}
                            </h2>
                            <p className="text-[10px] text-white/70 font-medium">
                                {getCurrentStatusMessage()}
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            {React.createElement(timelineStates[actualCurrentIndex]?.icon || Package, { size: 64 })}
                        </div>
                    </div>

                    <TrackingTimeline 
                        states={timelineStates} 
                        currentIndex={actualCurrentIndex} 
                    />
                </div>

                {/* 4. Support & Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <a
                        href={`tel:${order.tailor?.phoneNumber || '+919876543210'}`}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-center no-underline hover:bg-gray-50"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-primary flex items-center justify-center">
                            <Phone size={18} />
                        </div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">Call Artisan</span>
                    </a>

                    <a
                        href={`https://wa.me/${order.tailor?.phoneNumber || '919876543210'}?text=I need help with my order ${order.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-center no-underline hover:bg-gray-50"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">Chat with Help</span>
                    </a>
                </div>

                <div
                    onClick={() => {
                        const subject = encodeURIComponent(`Issue with Order ${order.orderId}`);
                        const body = encodeURIComponent(`Hello Support,\n\nI am facing an issue with my order ${order.orderId} for the service ${serviceTitle}.\n\nPlease help.`);
                        window.location.href = `mailto:support@silaiwala.com?subject=${subject}&body=${body}`;
                    }}
                    className="p-4 bg-primary rounded-[2rem] text-white shadow-xl flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <AlertCircle size={22} className="text-red-300" />
                        </div>
                        <div>
                            <p className="text-[13px] font-black uppercase tracking-widest leading-none mb-1">Have an issue?</p>
                            <p className="text-[10px] text-white/60 font-medium">Auto-generate support ticket</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                        <ChevronRight size={16} />
                    </div>
                </div>

                {/* 5. Artisan Profile Card */}
                {order.tailor && (
                    <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assigned Artisan</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100 font-black text-xs overflow-hidden">
                                {order.tailor.profileImage ? (
                                    <img src={order.tailor.profileImage} alt={order.tailor.name} className="w-full h-full object-cover" />
                                ) : order.tailor.name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{order.tailor.shopName || order.tailor.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Verified Expert Tailor</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2fcf9] rounded-xl border border-primary/10">
                                <ShieldCheck size={12} className="text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase">Verified</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* 6. Delivery Partner Card */}
                {order.deliveryPartner && (
                    <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Delivery Partner</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100 font-black text-xs overflow-hidden">
                                    {order.deliveryPartner.profileImage ? (
                                        <img src={order.deliveryPartner.profileImage} alt={order.deliveryPartner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Truck size={20} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{order.deliveryPartner.name}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded-lg border border-amber-100">
                                            <Star size={8} className="fill-amber-600 text-amber-600" />
                                            <span className="text-[9px] font-black text-amber-800">{order.deliveryPartner.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                            {order.deliveryPartner.totalDeliveries || 0} Deliveries
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {order.deliveryPartner.phoneNumber && (
                                <a 
                                    href={`tel:${order.deliveryPartner.phoneNumber}`}
                                    className="w-10 h-10 rounded-full bg-indigo-50 text-primary flex items-center justify-center border border-indigo-100 shadow-sm active:scale-90 transition-all"
                                >
                                    <Phone size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* 7. Review Section (If Delivered) */}
                {order.status === 'delivered' && !order.isReviewed && !isReviewed && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-primary to-primary-dark rounded-[2rem] p-8 text-center text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Star size={80} className="fill-white" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black italic tracking-tighter mb-2 uppercase">How was your Experience?</h3>
                            <p className="text-xs text-white/70 font-medium mb-8 leading-relaxed max-w-[200px] mx-auto">Help us improve the community by sharing your feedback for the Artisan & Rider.</p>
                            <button 
                                onClick={() => setIsReviewModalOpen(true)}
                                className="px-10 py-4 bg-white text-primary rounded-full font-black text-xs uppercase shadow-xl hover:bg-gray-50 active:scale-95 transition-all outline-none"
                            >
                                Rate Experience
                            </button>
                        </div>
                    </motion.div>
                )}

                {(order.isReviewed || isReviewed) && (
                    <div className="bg-indigo-50 rounded-[2rem] p-6 text-center border border-indigo-100 italic font-bold text-primary text-xs">
                        Thank you for your valuable feedback! 💚
                    </div>
                )}

                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={order._id}
                    tailorId={order.tailor?.user?._id || order.tailor?.user}
                    deliveryPartnerId={order.deliveryPartner?.user?._id || order.deliveryPartner?.user}
                    onSuccess={() => {
                        setIsReviewed(true);
                        fetchOrderDetails();
                    }}
                />

            </div>
        </div>
    );
};

export default OrderTracking;
