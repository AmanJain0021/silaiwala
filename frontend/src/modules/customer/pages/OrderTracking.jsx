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
import LiveDeliveryTracker from '../components/orders/LiveDeliveryTracker';
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
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);

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
            if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
                console.error('Error fetching order tracking:', err);
                setError(err.response?.data?.message || 'Failed to load tracking details.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        if (id) {
            fetchOrderDetails();

            const socket = io(SOCKET_URL);
            setSocketInstance(socket);
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
                setSocketInstance(null);
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
                    onClick={() => navigate('/user/orders')} 
                    className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                    Back to My Orders
                </button>
            </div>
        );
    }

    const handlePayment = async () => {
        setIsProcessingPayment(true);
        try {
            const rzpOrderRes = await api.post('/orders/razorpay/create', { amount: order.totalAmount });
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "SilaiWala",
                description: "Order Payment",
                order_id: rzpOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/orders/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderObjectId: order._id
                        });

                        if (verifyRes.data.success) {
                            alert('Payment successful!');
                            fetchOrderDetails();
                        }
                    } catch (err) {
                        console.error('Verification failed:', err);
                        alert('Payment verification failed. Please contact support.');
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                prefill: {
                    name: order.customer?.name || "",
                    contact: order.customer?.phoneNumber || ""
                },
                theme: { color: "#2D2F6E" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setIsProcessingPayment(false);
                alert('Payment failed: ' + response.error.description);
            });
            rzp.open();
        } catch (error) {
            console.error('Payment process failed:', error);
            alert(error.response?.data?.message || 'Payment initialization failed. Please try again.');
            setIsProcessingPayment(false);
        }
    };

    const handleDeliveryPreference = async (preference) => {
        setIsUpdatingPreference(true);
        try {
            const res = await api.post(`/orders/${id}/delivery-preference`, { preference });
            if (res.data.success) {
                alert('Delivery preference updated!');
                fetchOrderDetails();
            }
        } catch (error) {
            console.error('Failed to update delivery preference:', error);
            alert(error.response?.data?.message || 'Failed to update preference. Please try again.');
        } finally {
            setIsUpdatingPreference(false);
        }
    };

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
        : order.fabricPickupRequired
            ? [
                { key: 'pending', label: 'Placed', icon: Package },
                { key: 'fabric-pickup', label: 'Fabric', icon: Truck }, // corresponds to fabric-delivered/received
                { key: 'measurement-verification', label: 'Verify', icon: ShieldCheck },
                { key: 'cutting', label: 'Cutting', icon: Scissors },
                { key: 'stitching', label: 'Stitching', icon: Calendar },
                { key: 'finishing', label: 'Finishing', icon: CheckCircle2 },
                { key: 'quality-check', label: 'QC', icon: ShieldCheck },
                { key: 'ready-for-delivery', label: 'Ready', icon: CheckCircle2 },
                { key: 'out-for-delivery', label: 'Dispatch', icon: Truck },
                { key: 'delivered', label: 'Arrived', icon: CheckCircle2 }
            ]
            : [
                { key: 'pending', label: 'Placed', icon: Package },
                { key: 'order-received', label: 'Received', icon: ShieldCheck },
                { key: 'fabric-selected', label: 'Fabric', icon: Package },
                { key: 'cutting', label: 'Cutting', icon: Scissors },
                { key: 'stitching', label: 'Stitching', icon: Calendar },
                { key: 'finishing', label: 'Finishing', icon: CheckCircle2 },
                { key: 'quality-check', label: 'QC', icon: ShieldCheck },
                { key: 'ready-for-delivery', label: 'Ready', icon: CheckCircle2 },
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

        const statusOrder = [
            'pending',
            'accepted',
            'waiting-for-customer-dropoff',
            'fabric-ready-for-pickup',
            'fabric-picked-up',
            'fabric-delivered',
            'fabric-received',
            'order-received',
            'fabric-selected',
            'measurement-verification',
            'cutting',
            'stitching',
            'finishing',
            'quality-check',
            'ready-for-pickup',
            'ready-for-delivery',
            'out-for-delivery',
            'delivered',
            'product-delivered',
            'order-completed'
        ];

        // Map stage keys to their equivalent status weights for comparison
        let equivalentStageKey = stageKey;
        if (stageKey === 'fabric-pickup') equivalentStageKey = 'fabric-received';
        if (stageKey === 'accepted') equivalentStageKey = 'order-received';
        if (stageKey === 'in-production') equivalentStageKey = 'cutting';
        if (stageKey === 'shipped') equivalentStageKey = 'out-for-delivery';

        const currentIndex = statusOrder.indexOf(status);
        const stageIndex = statusOrder.indexOf(equivalentStageKey);

        const isCompleted = currentIndex >= stageIndex && stageIndex !== -1;

        // Try to find exact timestamp from history
        let historyEntry = history.find(h => {
            if (stageKey === 'fabric-pickup') return ['fabric-delivered', 'fabric-received', 'delivery-fabric-delivered'].includes(h.status);
            if (stageKey === 'ready-for-delivery') return ['ready-for-pickup', 'ready-for-delivery'].includes(h.status);
            if (stageKey === 'out-for-delivery') return ['out-for-delivery', 'shipped'].includes(h.status);
            if (stageKey === 'accepted') return ['accepted', 'order-received'].includes(h.status);
            return h.status === stageKey;
        });

        // Fallback to current time if just completed but no history sync yet
        const timeStr = historyEntry 
            ? new Date(historyEntry.timestamp || historyEntry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : (isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);

        return { completed: isCompleted, time: timeStr };
    };

    const getStageSubEvents = (stageKey) => {
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        if (history.length === 0) return [];

        let validStatuses = [];
        let timeConstraint = null; // 'before-cutting', 'after-ready'

        if (stageKey === 'fabric-pickup') {
            validStatuses = ['delivery-accepted', 'delivery-reached-pickup', 'delivery-fabric-picked-up', 'reached-pickup', 'fabric-picked-up', 'fabric-delivered', 'delivery-fabric-delivered'];
            timeConstraint = 'before-cutting';
        } else if (stageKey === 'out-for-delivery') {
            validStatuses = ['delivery-accepted', 'delivery-reached-pickup', 'delivery-picked-up-from-tailor', 'delivery-reached-dropoff', 'delivery-delivered', 'out-for-delivery', 'shipped'];
            timeConstraint = 'after-ready';
        }

        if (validStatuses.length === 0) return [];

        // Find boundary timestamps
        const readyForPickupTime = history.find(h => h.status === 'ready-for-pickup')?.timestamp;
        const cuttingTime = history.find(h => h.status === 'cutting' || h.status === 'fabric-delivered')?.timestamp;

        let events = history.filter(h => validStatuses.includes(h.status));

        if (timeConstraint === 'before-cutting' && cuttingTime) {
            events = events.filter(e => new Date(e.timestamp) <= new Date(cuttingTime));
        } else if (timeConstraint === 'after-ready' && readyForPickupTime) {
            events = events.filter(e => new Date(e.timestamp) >= new Date(readyForPickupTime));
        } else if (timeConstraint === 'after-ready' && !readyForPickupTime) {
            // If it hasn't reached ready-for-pickup, there shouldn't be dispatch events
            // But just in case, if status is out-for-delivery
            if (stageKey === 'out-for-delivery' && order.status !== 'out-for-delivery' && order.status !== 'delivered') {
                events = [];
            }
        }

        return events.map(e => ({
            message: e.message || `Status updated to ${e.status.replace(/-/g, ' ')}`,
            time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTime: new Date(e.timestamp).getTime()
        })).sort((a,b) => a.rawTime - b.rawTime);
    };

    const timelineStates = stages.map(s => ({ 
        ...s, 
        ...getStageStatus(s.key),
        subEvents: getStageSubEvents(s.key)
    }));
    const currentStageIndex = [...timelineStates].reverse().findIndex(s => s.completed);
    const actualCurrentIndex = currentStageIndex === -1 ? 0 : (timelineStates.length - 1 - currentStageIndex);

    const getCurrentStatusMessage = () => {
        if (order.status === 'accepted' && order.paymentStatus === 'pending') {
            return "Tailor accepted the order. Pay to confirm.";
        }
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        const latestHistory = history[history.length - 1];
        if (latestHistory?.message) return latestHistory.message;
        if (order.status === 'delivered') return "Your order has been delivered successfully.";
        if (isBulk && order.status === 'accepted') return "Security deposit received. Awaiting production start.";
        return "Your order is progressing smoothly through our production line.";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 pb-4 pt-safe pt-8 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-bold text-gray-900 h-3 pt-2">Track Order</h1>
                        <p className="text-[10px] text-gray-500 font-medium font-mono uppercase tracking-widest leading-none mt-1 pt-3">
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
                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
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
                    <div className="mb-4 p-3 bg-gradient-to-br from-primary to-primary-dark rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Current Milestone</p>
                            <h2 className="text-xl font-black tracking-tight leading-none mb-2 capitalize">
                                {order.status.replace(/-/g, ' ')}
                            </h2>
                            <p className="text-[10px] text-white/70 font-medium">
                                {getCurrentStatusMessage()}
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            {React.createElement(timelineStates[actualCurrentIndex]?.icon || Package, { size: 48 })}
                        </div>
                    </div>

                    <TrackingTimeline 
                        states={timelineStates} 
                        currentIndex={actualCurrentIndex} 
                    />
                </div>

                {/* 3.3.5 Live Delivery Tracker */}
                {(['fabric-ready-for-pickup', 'fabric-picked-up', 'ready-for-delivery', 'out-for-delivery'].includes(order.status) || 
                  ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus) ||
                  ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.dropoffDeliveryStatus)) && (
                    <LiveDeliveryTracker order={order} socket={socketInstance} />
                )}

                {/* 3.4 Payment CTA (If accepted but not paid) */}
                {order.status === 'accepted' && order.paymentStatus === 'pending' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-5 border border-indigo-100 shadow-sm flex flex-col items-center text-center space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Payment Required</h3>
                        <p className="text-xs text-gray-600 max-w-xs">
                            Tailor accepted the order. Pay to confirm.
                        </p>
                        <button
                            onClick={handlePayment}
                            disabled={isProcessingPayment}
                            className={`w-full max-w-xs py-3 rounded-full font-bold text-white text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                                isProcessingPayment ? 'bg-indigo-400' : 'bg-primary hover:bg-primary-dark'
                            }`}
                        >
                            {isProcessingPayment ? <Loader2 size={18} className="animate-spin" /> : 'Pay Now'}
                        </button>
                    </div>
                )}

                {/* 3.4.5 Delivery Preference (After Payment) */}
                {order.fabricPickupRequired && order.paymentStatus === 'paid' && order.fabricDeliveryPreference === 'pending' && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                            <Package size={24} className="text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">How will the fabric reach the tailor?</h3>
                            <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                                Please select your preference for delivering the fabric to the tailor.
                            </p>
                        </div>
                        
                        <div className="flex flex-col w-full gap-3 mt-2">
                            <button
                                onClick={() => handleDeliveryPreference('self')}
                                disabled={isUpdatingPreference}
                                className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 text-sm transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isUpdatingPreference ? <Loader2 size={16} className="animate-spin" /> : 'I will drop it off myself (Self Delivery)'}
                            </button>
                            
                            <button
                                onClick={() => handleDeliveryPreference('partner')}
                                disabled={isUpdatingPreference}
                                className="w-full py-3 rounded-xl font-bold text-white bg-primary text-sm transition-all shadow-md hover:bg-primary-dark active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isUpdatingPreference ? <Loader2 size={16} className="animate-spin" /> : 'Assign a Delivery Partner'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 3.5 Order Details (Added by Request) */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <Package size={16} className="text-[#2D2F6E]" />
                        Order Details
                    </h3>
                    
                    {/* Items */}
                    <div className="space-y-3">
                        {!isBulk && order.items?.map((item, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                    <img src={item.service?.image || item.product?.images?.[0] || item.product?.image} alt={item.service?.title || item.product?.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.service?.title || item.product?.name}</h4>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-xs font-bold text-[#2D2F6E]">₹{item.price}</span>
                            </div>
                        ))}
                        {isBulk && (
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-gray-900">{order.serviceType}</h4>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Est. Qty: {order.estimatedQuantity}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Measurement Info */}
                    {!isBulk && order.items?.[0]?.measurements?.type && (
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Measurement</span>
                            <span className="text-[10px] font-black text-primary uppercase bg-indigo-50 px-2 py-1 rounded-md">
                                {order.items[0].measurements.type === 'home' ? 'Tailor At Home' :
                                 order.items[0].measurements.type === 'sample' ? 'Sample Garment' :
                                 order.items[0].measurements.type === 'slip' ? 'Uploaded Slip' :
                                 order.items[0].measurements.type === 'saved' ? 'Saved Profile' : 'Self Measured'}
                            </span>
                        </div>
                    )}

                    {/* Delivery Details */}
                    {order.deliveryAddress && (
                        <div className="pt-3 border-t border-gray-100">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <MapPin size={10} /> Delivery Address
                            </h4>
                            <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                            </p>
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                        {order.deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="font-medium text-gray-900">₹{order.deliveryFee}</span>
                            </div>
                        )}
                        {order.tailorAtHomeFee > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Tailor Visit Fee</span>
                                <span className="font-medium text-gray-900">₹{order.tailorAtHomeFee}</span>
                            </div>
                        )}
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Discount</span>
                                <span className="font-medium text-green-600">-₹{order.discountAmount}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                            <span className="text-sm font-black text-gray-900">Total Paid</span>
                            <span className="text-sm font-black text-primary">₹{order.totalAmount}</span>
                        </div>
                    </div>
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
                {/* 5.5. Delivery Partner Card */}
                {(order.deliveryPartner || order.pickupPartner || order.dropoffPartner) && (() => {
                    let activePartner = order.deliveryPartner;
                    let partnerRole = 'Delivery Partner';
                    
                    if (['pending', 'accepted', 'paid', 'fabric-ready-for-pickup', 'fabric-pickup-assigned', 'fabric-picked-up'].includes(order.status) && order.pickupPartner) {
                        activePartner = order.pickupPartner;
                        partnerRole = 'Pickup Partner';
                    } else if (order.dropoffPartner) {
                        activePartner = order.dropoffPartner;
                        partnerRole = 'Delivery Partner';
                    } else if (order.pickupPartner && !order.dropoffPartner) {
                        activePartner = order.pickupPartner;
                        partnerRole = 'Pickup Partner';
                    }

                    if (!activePartner) return null;

                    return (
                        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assigned {partnerRole}</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2D2F6E] border border-indigo-100 font-black text-xs overflow-hidden shrink-0">
                                    {activePartner.profileImage ? (
                                        <img src={activePartner.profileImage} alt={activePartner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Truck size={16} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{activePartner.name || partnerRole}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                        <Phone size={10} /> {activePartner.phoneNumber || 'Contact Unavailable'}
                                    </p>
                                </div>
                                {activePartner.phoneNumber && (
                                    <a 
                                        href={`tel:${activePartner.phoneNumber}`}
                                        className="w-8 h-8 bg-indigo-50 text-[#2D2F6E] rounded-full flex items-center justify-center border border-indigo-100 shrink-0 hover:bg-indigo-100 transition-colors"
                                    >
                                        <Phone size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* 6. Review Section (If Delivered) */}
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
