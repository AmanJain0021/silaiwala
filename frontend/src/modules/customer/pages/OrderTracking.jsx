import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Phone, MessageSquare,
    AlertCircle, Package, Truck,
    Calendar, ChevronRight, ShieldCheck,
    Loader2, CheckCircle2, Star, User, Scissors, Store,
    MoreVertical, Headphones, Radio, Gift, Layers, Shirt, Box, ShoppingBag, Check, CreditCard, FileText, Ruler
} from 'lucide-react';
import api from '../../../utils/api';
import TrackingTimeline from '../components/orders/TrackingTimeline';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';
import ReviewModal from '../components/orders/ReviewModal';
import LiveDeliveryTracker from '../../../shared/components/LiveDeliveryTracker';
import ExchangeRequestModal from '../components/orders/ExchangeRequestModal';
import useBrandingStore from '../../../store/brandingStore';

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [measurementReport, setMeasurementReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);
    const [isBulk, setIsBulk] = useState(location.state?.isBulk || false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
    const [measurementOtp, setMeasurementOtp] = useState(null);
    const [settings, setSettings] = useState(null);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const appName = useBrandingStore(state => state.appName);
    const [showOrderDetailsSection, setShowOrderDetailsSection] = useState(true);

    const [socketInstance, setSocketInstance] = useState(null);

    const fetchOrderDetails = useCallback(async () => {
        try {
            let response;
            try {
                response = await api.get(`/orders/${id}`);
            } catch (err) {
                if (err.response?.status === 404) {
                    response = await api.get(`/bulk-orders/${id}`);
                    setIsBulk(true);
                } else {
                    throw err;
                }
            }

            if (response?.data?.success) {
                const fetchedOrder = response.data.data;
                setOrder(fetchedOrder);
                if (fetchedOrder.measurementOtp) {
                    setMeasurementOtp(fetchedOrder.measurementOtp);
                }
                setError(null);
                
                try {
                    const unreadRes = await api.get('/orders/chats/unread');
                    if (unreadRes.data?.success) {
                        setUnreadChatCount(unreadRes.data.data[id] || 0);
                    }
                } catch (uErr) {
                    console.error('Failed to fetch unread chats:', uErr);
                }

                if (fetchedOrder.isMeasurementHome) {
                    try {
                        const mRes = await api.get(`/orders/${id}/measurements`);
                        if (mRes.data.success) {
                            setMeasurementReport(mRes.data.data);
                        }
                    } catch (mErr) {
                        console.error('Failed to fetch measurement report:', mErr);
                    }
                }
                
                setIsLoading(false);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
                console.error('Error fetching order tracking:', err);
                setError(err.response?.data?.message || 'Failed to load tracking details.');
                setIsLoading(false);
            }
        }
    }, [id]);

    const handleMeasurementAction = async (action) => {
        try {
            if (action === 'approve') {
                const res = await api.post(`/orders/${id}/measurements/approve`);
                if (res.data.success) {
                    alert('Measurements approved successfully!');
                    fetchOrderDetails();
                }
            } else if (action === 'reject') {
                const notes = window.prompt("Please detail the changes required in the measurements:");
                if (!notes) return;
                const res = await api.post(`/orders/${id}/measurements/request-revision`, { notes });
                if (res.data.success) {
                    alert('Revision request sent to executive.');
                    fetchOrderDetails();
                }
            }
        } catch (error) {
            console.error(error);
            alert('Failed to process measurement action');
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrderDetails();

            const socket = io(SOCKET_URL, {
                auth: { token: getToken() }
            });
            setSocketInstance(socket);

            const joinRooms = () => { socket.emit('join_order_room', id); };
            socket.on('connect', joinRooms);
            joinRooms();

            const refreshOrder = () => { fetchOrderDetails(); };

            socket.on('order_status_updated', refreshOrder);
            socket.on('order_notification', refreshOrder);
            
            socket.on('new_chat_message', (msg) => {
                if (msg.order === id && msg.senderModel !== 'Customer') {
                    setUnreadChatCount(prev => prev + 1);
                }
            });

            socket.on('measurement_otp_sent', (data) => {
                if (data.otp) setMeasurementOtp(data.otp);
                fetchOrderDetails();
            });

            socket.on('new_notification', (data) => {
                if (data.data?.orderId === id) fetchOrderDetails();
            });

            const fetchSettings = async () => {
                try {
                    const res = await api.get('/cms/settings');
                    if (res.data?.data?.loyaltyConfig) {
                        setSettings(res.data.data.loyaltyConfig);
                    }
                } catch (err) {
                    if (err?.name !== 'CanceledError' && err?.message !== 'canceled' && !err?.message?.includes('Cancelled')) {
                        console.error("Failed to fetch settings:", err);
                    }
                }
            };
            fetchSettings();

            return () => {
                socket.off('connect', joinRooms);
                socket.off('order_status_updated', refreshOrder);
                socket.off('order_notification', refreshOrder);
                socket.disconnect();
                setSocketInstance(null);
            };
        }
    }, [id, fetchOrderDetails]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 pb-4 pt-safe pt-8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-2.5 bg-gray-200 rounded animate-pulse w-24"></div>
                    </div>
                </div>

                <div className="max-w-xl mx-auto p-4 space-y-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse shrink-0"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                    </div>
                </div>
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
                    className="mt-6 px-8 py-3 bg-[#843D9B] text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                    Back to My Orders
                </button>
            </div>
        );
    }

    const handlePayment = async (paymentType) => {
        setIsProcessingPayment(true);
        try {
            const advanceAmt = (order?.advancePaymentAmount && order.advancePaymentAmount > 0)
                ? order.advancePaymentAmount
                : Math.max(50, Math.round((order?.totalAmount || 0) * 0.3));

            const remainingAmt = (order?.remainingPaymentAmount && order.remainingPaymentAmount > 0)
                ? order.remainingPaymentAmount
                : Math.max(50, (order?.totalAmount || 0) - advanceAmt);

            const amountToPay = paymentType === 'advance' ? advanceAmt : remainingAmt;
            
            const rzpOrderRes = await api.post('/orders/razorpay/create', { amount: amountToPay });
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "SilaiWala",
                description: paymentType === 'advance' ? "Advance Payment" : "Remaining Payment",
                order_id: rzpOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/orders/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderObjectId: order._id,
                            paymentType: paymentType
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
                theme: { color: "#843D9B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setIsProcessingPayment(false);
                alert('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment process failed:', error);
            alert('Payment initialization failed. Please try again.');
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
        : (order.items?.[0]?.service?.title || order.items?.[0]?.product?.name || 'Custom Garment Order');
    
    const imageUrl = isBulk
        ? (order.referenceImages?.[0] || '/logo.png')
        : (order.items?.[0]?.service?.image || order.items?.[0]?.product?.images?.[0] || order.items?.[0]?.product?.image || '/logo.png');

    // Arrival Date Calculation
    const getArrivalDate = () => {
        if (isBulk && order.expectedDeliveryDate) {
            return new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const baseDate = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
        const firstItem = order.items?.[0];
        const deliveryType = firstItem?.deliveryType || 'standard';
        const deliveryDays = deliveryType === 'express' ? 10 : (deliveryType === 'premium' ? 7 : 15);
        baseDate.setDate(baseDate.getDate() + deliveryDays);
        return baseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const dateString = getArrivalDate();
    const createdDateString = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const createdTimeString = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isReadyMade = order?.items?.some(item => item.product);
    const isAlteration = order?.items?.some(item => item.isAlteration) || order?.isAlteration;

    // Timeline Stages Definition
    const stages = isBulk 
        ? [
            { key: 'pending', label: 'Order Received', desc: "We've received your order", icon: Package },
            { key: 'accepted', label: 'Payment Confirmed', desc: "Security deposit paid", icon: ShieldCheck },
            { key: 'accepted-by-tailor', label: 'Assigned', desc: "Assigned to master artisan", icon: User },
            { key: 'in-production', label: 'Production', desc: "Bulk manufacturing in progress", icon: Scissors },
            { key: 'shipped', label: 'Out for Delivery', desc: "Bulk order in transit", icon: Truck },
            { key: 'delivered', label: 'Delivered', desc: "Order delivered successfully", icon: CheckCircle2 }
        ]
        : isAlteration
        ? [
            { key: 'pending', label: 'Order Received', desc: "We've received your order", icon: Package },
            ...(order.fabricDeliveryPreference === 'self' ? [{ key: 'waiting-for-customer-dropoff', label: 'Waiting For Drop-off', desc: 'Awaiting drop-off at shop', icon: Store }] : []),
            { key: 'fabric-received', label: 'Garment Received', desc: 'Garment received and quality checked', icon: Layers },
            { key: 'in-progress', label: 'Alteration Started', desc: 'Artisan altering your garment', icon: Scissors },
            { key: 'quality-check', label: 'Completed', desc: 'Alteration completed & inspected', icon: Box },
            { key: 'ready-for-delivery', label: 'Ready for Delivery', desc: 'Order is ready to be delivered', icon: ShoppingBag },
            { key: 'out-for-delivery', label: 'Out for Delivery', desc: 'Your order is out for delivery', icon: Truck },
            { key: 'delivered', label: 'Delivered', desc: 'Your order has been delivered', icon: CheckCircle2 }
        ]
        : isReadyMade
        ? [
            { key: 'pending', label: 'Order Received', desc: "We've received your order", icon: Package },
            { key: 'in-progress', label: 'Processing & Packing', desc: 'Item being packed', icon: Box },
            { key: 'ready-for-delivery', label: 'Ready for Delivery', desc: 'Packed & ready for dispatch', icon: ShoppingBag },
            { key: 'out-for-delivery', label: 'Out for Delivery', desc: 'Your order is out for delivery', icon: Truck },
            { key: 'delivered', label: 'Delivered', desc: 'Your order has been delivered', icon: CheckCircle2 }
        ]
        : [
            { key: 'pending', label: 'Order Received', desc: "We've received your order", icon: Package },
            ...(order.fabricDeliveryPreference === 'self' ? [{ key: 'waiting-for-customer-dropoff', label: 'Waiting For Drop-off', desc: 'Awaiting drop-off at shop', icon: Store }] : []),
            { key: 'fabric-received', label: 'Fabric Received', desc: 'Fabric received and quality checked', icon: Layers },
            { key: 'cutting', label: 'Cutting', desc: 'Your fabric is being cut', icon: Scissors },
            { key: 'stitching', label: 'Stitching', desc: 'Stitching in progress', icon: Shirt },
            { key: 'quality-check', label: 'Completed', desc: 'Stitching completed', icon: Box },
            { key: 'ready-for-delivery', label: 'Ready for Delivery', desc: 'Order is ready to be delivered', icon: ShoppingBag },
            { key: 'out-for-delivery', label: 'Out for Delivery', desc: 'Your order is out for delivery', icon: Truck },
            { key: 'delivered', label: 'Delivered', desc: 'Your order has been delivered', icon: CheckCircle2 }
        ];

    const getStageStatus = (stageKey) => {
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        const status = (order.status || '').toLowerCase();

        if (stageKey === 'pending') return { completed: true, time: createdTimeString };
        
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
            'pickup-assigned',
            'fabric-ready-for-pickup',
            'fabric-picked-up',
            'fabric-delivered',
            'order-received',
            'waiting-for-customer-dropoff',
            'fabric-received',
            'fabric-selected',
            'measurement-verification',
            'pattern-making',
            'in-progress',
            'cutting',
            'stitching',
            'finishing',
            'quality-check',
            'ready-for-pickup',
            'ready-for-delivery',
            'delivery-assigned',
            'out-for-delivery',
            'delivered',
            'product-delivered',
            'order-completed'
        ];

        let equivalentStageKey = stageKey;
        if (stageKey === 'shipped') equivalentStageKey = 'out-for-delivery';

        const currentIndex = statusOrder.indexOf(status);
        const stageIndex = statusOrder.indexOf(equivalentStageKey);

        const isCompleted = currentIndex >= stageIndex && stageIndex !== -1;

        let historyEntry = history.find(h => {
            if (stageKey === 'fabric-received') return ['fabric-delivered', 'fabric-received', 'delivery-fabric-delivered'].includes(h.status);
            if (stageKey === 'ready-for-delivery') return ['ready-for-pickup', 'ready-for-delivery'].includes(h.status);
            if (stageKey === 'out-for-delivery') return ['out-for-delivery', 'shipped'].includes(h.status);
            if (stageKey === 'quality-check') return ['finishing', 'quality-check'].includes(h.status);
            return h.status === stageKey;
        });

        const timeStr = historyEntry 
            ? new Date(historyEntry.timestamp || historyEntry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : (isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);

        return { completed: isCompleted, time: timeStr };
    };

    const getStageSubEvents = (stageKey) => {
        const history = isBulk ? (order.history || []) : (order.trackingHistory || []);
        if (history.length === 0) return [];

        let validStatuses = [];
        let timeConstraint = null;

        if (stageKey === 'fabric-received') {
            validStatuses = ['pickup-assigned', 'fabric-ready-for-pickup', 'delivery-accepted', 'delivery-reached-pickup', 'delivery-fabric-picked-up', 'reached-pickup', 'fabric-picked-up', 'fabric-delivered', 'delivery-fabric-delivered'];
            timeConstraint = 'before-cutting';
        } else if (stageKey === 'out-for-delivery') {
            validStatuses = ['delivery-accepted', 'delivery-reached-pickup', 'delivery-picked-up-from-tailor', 'delivery-reached-dropoff', 'delivery-delivered', 'out-for-delivery', 'shipped'];
            timeConstraint = 'after-ready';
        }

        if (validStatuses.length === 0) return [];

        const readyForPickupTime = history.find(h => h.status === 'ready-for-pickup')?.timestamp;
        const cuttingTime = history.find(h => h.status === 'cutting' || h.status === 'fabric-delivered')?.timestamp;

        let events = history.filter(h => validStatuses.includes(h.status));

        if (timeConstraint === 'before-cutting' && cuttingTime) {
            events = events.filter(e => new Date(e.timestamp) <= new Date(cuttingTime));
        } else if (timeConstraint === 'after-ready' && readyForPickupTime) {
            events = events.filter(e => new Date(e.timestamp) >= new Date(readyForPickupTime));
        }

        return events.map(e => ({
            message: e.message || `Delivery status updated to ${e.status.replace(/-/g, ' ')}`,
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
        if (order.status === 'delivered') return `Your order has been delivered successfully. Thank you for trusting ${appName}!`;
        if (isBulk && order.status === 'accepted') return "Security deposit received. Awaiting production start.";
        return "Your order is progressing smoothly through our production line.";
    };

    // Loyalty points check
    const earnedPoints = Math.floor((order.totalAmount || 0) / 100) * (settings?.pointsPer100Spent || 1) + (settings?.flatPointsPerBooking || 0);

    // Active partner info
    const tailorInfo = order.tailor || null;
    const partnerInfo = order.deliveryPartner || order.pickupPartner || order.dropoffPartner || null;

    // Delivery check for rating section
    const isFinalDelivered = ['delivered', 'product-delivered', 'completed', 'order-completed'].includes((order.status || '').toLowerCase());

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-16 text-gray-900">
            {/* Sticky Clean Header Bar */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 shadow-xs">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/user/orders')} 
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">Track Order</h1>
                            <p className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest mt-0.5">
                                {order.orderId}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                const subject = encodeURIComponent(`Help with Order ${order.orderId}`);
                                window.location.href = `mailto:support@sewzella.com?subject=${subject}`;
                            }}
                            className="h-8 px-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        >
                            <Headphones size={14} />
                            <span>Help</span>
                        </button>
                        <button 
                            onClick={() => navigate(`/user/orders/${id}/chat`)}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors relative"
                        >
                            <MoreVertical size={18} />
                            {unreadChatCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-xl mx-auto px-4 py-4 space-y-4">

                {/* OTP Banner Notifications */}
                {measurementOtp && (
                    <div className="bg-white rounded-3xl p-4 border border-[#843D9B]/20 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-black text-[#843D9B] uppercase tracking-wider">Measurement Verification OTP</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Share code with measurement executive</p>
                        </div>
                        <div className="bg-[#843D9B]/10 px-4 py-2 rounded-2xl border border-[#843D9B]/20">
                            <span className="text-xl font-black tracking-widest text-[#843D9B]">{measurementOtp}</span>
                        </div>
                    </div>
                )}

                {order.pickupDeliveryOtp && order.pickupOtpVerified === false && (
                    <div className="bg-white rounded-3xl p-4 border border-[#843D9B]/20 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-black text-[#843D9B] uppercase tracking-wider">Fabric Pickup OTP</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Share with partner to hand over fabric</p>
                        </div>
                        <div className="bg-[#843D9B]/10 px-4 py-2 rounded-2xl border border-[#843D9B]/20">
                            <span className="text-xl font-black tracking-widest text-[#843D9B]">{order.pickupDeliveryOtp}</span>
                        </div>
                    </div>
                )}

                {order.dropoffDeliveryOtp && order.dropoffOtpVerified === false && 
                 ['ready-for-delivery', 'out-for-delivery', 'delivered', 'ready'].includes(order.status) && (
                    <div className="bg-white rounded-3xl p-4 border border-emerald-100 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Order Delivery OTP</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Share with partner to receive order</p>
                        </div>
                        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                            <span className="text-xl font-black tracking-widest text-emerald-700">{order.dropoffDeliveryOtp}</span>
                        </div>
                    </div>
                )}

                {/* 1. Top Order Summary Card */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            <img src={imageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-gray-900 truncate leading-tight">{serviceTitle}</h3>
                            
                            <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-[11px] uppercase tracking-wide mt-1">
                                <CheckCircle2 size={13} className="shrink-0 fill-emerald-600 text-white" />
                                <span className="truncate">{order.status === 'delivered' ? 'DELIVERED SUCCESSFULLY' : order.status.replace(/-/g, ' ').toUpperCase()}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-gray-400 font-semibold text-[10px] mt-1">
                                <Calendar size={12} className="shrink-0" />
                                <span>
                                    {order.status === 'delivered' 
                                        ? `Delivered on ${dateString}` 
                                        : `Expected by ${dateString}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowOrderDetailsSection(prev => !prev)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#843D9B] text-[#843D9B] text-xs font-bold hover:bg-[#843D9B]/5 transition-colors shrink-0 whitespace-nowrap"
                    >
                        View Details &gt;
                    </button>
                </div>

                {/* 2. Rewards Section (Conditional) */}
                {settings && earnedPoints > 0 && (
                    <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center shrink-0">
                                <Star size={20} className="fill-[#843D9B]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-900 leading-tight">Rewards Earned</h4>
                                <p className="text-[10px] font-medium text-gray-500 mt-0.5">Points added to your wallet</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[#843D9B] font-black text-sm shrink-0">
                            <span>+{earnedPoints} pts</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                )}

                {/* 3. Live Tracking Section */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                <Radio size={16} />
                            </div>
                            <h3 className="text-sm font-black text-gray-900">Live Tracking</h3>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time
                        </span>
                    </div>

                    {/* App Theme Current Status Banner */}
                    <div className="bg-gradient-to-r from-[#843D9B] via-[#74338a] to-[#5e2572] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
                        <div className="relative z-10 max-w-[75%]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60 mb-1">
                                CURRENT STATUS
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight capitalize leading-none text-white">
                                    {order.status === 'delivered' ? 'Delivered' : order.status.replace(/-/g, ' ')}
                                </h2>
                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                                    <CheckCircle2 size={14} strokeWidth={3} />
                                </div>
                            </div>
                            <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                                {getCurrentStatusMessage()}
                            </p>
                        </div>

                        {/* Gift Box Graphic */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
                                <Gift size={38} className="text-white drop-shadow-md" />
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vertical Timeline */}
                    <TrackingTimeline 
                        states={timelineStates} 
                        currentIndex={actualCurrentIndex} 
                    />
                </div>

                {/* Measurement Verification Card */}
                {['measurements-uploaded', 'measurement-verification'].includes(order.status) && measurementReport && (
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col items-center space-y-4">
                        <div className="bg-[#843D9B]/10 p-3 rounded-full text-[#843D9B]">
                            <Scissors size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-gray-900">Review Measurements</h3>
                            <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                                The measurement executive has submitted your measurements. Please review and approve them to start production.
                            </p>
                        </div>
                        
                        <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3">Recorded Metrics</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(measurementReport.measurements || {}).map(([key, val]) => (
                                    <div key={key} className="bg-white rounded-xl p-2 border border-gray-100 shadow-sm">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                                        </p>
                                        <p className="text-sm font-black text-gray-900">{String(val)}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col w-full gap-3 mt-2">
                            <button
                                onClick={() => handleMeasurementAction('approve')}
                                className="w-full py-3 rounded-xl font-bold text-white bg-[#843D9B] text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> Approve & Start Production
                            </button>
                            
                            <button
                                onClick={() => handleMeasurementAction('reject')}
                                className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 text-sm transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Request Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Delivery Preference Selection Card */}
                {((order.fabricPickupRequired && order.advancePaymentStatus === 'paid') || order.status === 'measurements-approved') && order.fabricDeliveryPreference === 'pending' && 
                 !['measurement-requested', 'measurement-assigned', 'measurement-accepted', 'measurement-otp-verified', 'measurements-uploaded', 'measurement-verification'].includes(order.status) && (
                    <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="bg-amber-50 p-3 rounded-full text-amber-600">
                            <Package size={24} />
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
                                className="w-full py-3 rounded-xl font-bold text-white bg-[#843D9B] text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isUpdatingPreference ? <Loader2 size={16} className="animate-spin" /> : 'Assign a Delivery Partner'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Waiting for Tailor Acceptance Card */}
                {order.status === 'pending' && (
                    <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm flex flex-col items-center text-center space-y-3 animate-in fade-in duration-300">
                        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 relative">
                            <Scissors size={24} className="animate-pulse" />
                            <span className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping opacity-30"></span>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">Waiting for tailor to accept order...</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                                Your order has been sent to the tailor. Once the tailor reviews and accepts your request, you can proceed with the advance payment.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 mt-1">
                            <Loader2 size={12} className="animate-spin" /> Awaiting Tailor Confirmation
                        </div>
                    </div>
                )}

                {/* Advance & Remaining Payment Action Cards (Only shown AFTER Tailor Accepts & Advance Payment is Pending) */}
                {(order.acceptedAt || ['accepted', 'measurement-requested', 'measurement-assigned'].includes(order.status)) && order.advancePaymentStatus === 'pending' && (order.advancePaymentAmount > 0 || order.totalAmount > 0) && (
                    <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex flex-col items-center text-center space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Advance Payment Required</h3>
                        <p className="text-xs text-gray-600 max-w-xs">
                            Tailor has accepted your order! Please pay the advance amount of ₹{order.advancePaymentAmount || Math.round((order.totalAmount || 0) * 0.3)} to confirm your booking and dispatch the measurement executive.
                        </p>
                        <button
                            onClick={() => handlePayment('advance')}
                            disabled={isProcessingPayment}
                            className="w-full max-w-xs py-3 rounded-full font-bold text-white text-sm bg-[#843D9B] hover:bg-[#723287] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isProcessingPayment ? <Loader2 size={18} className="animate-spin" /> : `Pay ₹${order.advancePaymentAmount || Math.round((order.totalAmount || 0) * 0.3)}`}
                        </button>
                    </div>
                )}

                {/* Measurement Executive Status Cards (Tailor At Home Flow) */}
                {(() => {
                    const mReq = order.measurementRequestInfo;
                    const isAccepted = mReq && ['accepted', 'otp_sent', 'otp_verified', 'measurements_uploaded'].includes(mReq.status);
                    const execUser = order.measurementExecutive || mReq?.executive;

                    if (order.isMeasurementHome && order.advancePaymentStatus === 'paid' && !isAccepted && !['completed', 'cancelled', 'measurements-uploaded', 'measurements-approved'].includes(order.status)) {
                        return (
                            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col items-center text-center space-y-3 animate-in fade-in duration-300">
                                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-[#843D9B] relative">
                                    <Ruler size={24} className="animate-pulse" />
                                    <span className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-30"></span>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Waiting for executive to accept visit...</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                                        Your advance payment is verified! We are requesting the nearest measurement executive to accept your home visit.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#843D9B] tracking-widest bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 mt-1">
                                    <Loader2 size={12} className="animate-spin" /> Waiting for Executive Acceptance
                                </div>
                            </div>
                        );
                    }

                    if (order.isMeasurementHome && isAccepted && execUser && !['completed', 'cancelled'].includes(order.status)) {
                        return (
                            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Measurement Executive Assigned
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Home Visit
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#843D9B] font-black text-xl overflow-hidden shrink-0 shadow-sm">
                                        {execUser?.profileImage ? (
                                            <img
                                                src={
                                                    execUser.profileImage.startsWith('http')
                                                        ? execUser.profileImage
                                                        : `${import.meta.env.VITE_API_URL}${execUser.profileImage}`
                                                }
                                                alt="Executive"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                            />
                                        ) : null}
                                        <User size={26} className="text-[#843D9B]" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-black text-gray-900 truncate">
                                            {execUser?.name || 'Measurement Executive'}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium">Accepted and on the way for your measurement visit</p>
                                        {execUser?.phoneNumber && (
                                            <a
                                                href={`tel:${execUser.phoneNumber}`}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#843D9B] bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg border border-purple-100 mt-2 transition-colors"
                                            >
                                                <Phone size={12} /> Call Executive
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return null;
                })()}

                {order.status === 'ready-for-delivery' && order.remainingPaymentStatus === 'pending' && order.remainingPaymentAmount > 0 && (
                    <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col items-center text-center space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Final Balance Payment</h3>
                        <p className="text-xs text-gray-600 max-w-xs">
                            Your order is ready! Pay the remaining balance of ₹{order.remainingPaymentAmount}.
                        </p>
                        <button
                            onClick={() => handlePayment('remaining')}
                            disabled={isProcessingPayment}
                            className="w-full max-w-xs py-3 rounded-full font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isProcessingPayment ? <Loader2 size={18} className="animate-spin" /> : `Pay Online ₹${order.remainingPaymentAmount}`}
                        </button>
                    </div>
                )}

                {/* Live Delivery Tracker Widget */}
                {(() => {
                    const hasActivePickupPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus);
                    const hasActiveDropoffPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.dropoffDeliveryStatus);

                    const isInvalidSearchState = ['pending', 'reviewing', 'quoted', 'cancelled'].includes(order.status);

                    const isSearchingPickup = !isInvalidSearchState && (order.pickupDeliveryStatus === 'pending' || order.pickupDeliveryStatus === 'searching') && 
                        (['pickup-assigned', 'fabric-ready-for-pickup'].includes(order.status) || 
                         (order.status === 'accepted' && (order.advancePaymentStatus === 'paid' || !order.advancePaymentAmount))) &&
                        order.fabricDeliveryPreference === 'partner';

                    const isSearchingDropoff = !isInvalidSearchState && (order.dropoffDeliveryStatus === 'pending' || order.dropoffDeliveryStatus === 'searching') && 
                        ['ready-for-delivery', 'ready-for-pickup', 'delivery-assigned'].includes(order.status) &&
                        order.deliveryMethod !== 'self' && order.deliveryMethod !== 'tailor';

                    const shouldShowForPickup = hasActivePickupPartner || isSearchingPickup;
                    const shouldShowForDropoff = hasActiveDropoffPartner || isSearchingDropoff;
                    const isTailorSelfDelivery = order.status === 'out-for-delivery' && order.deliveryMethod === 'tailor';

                    if (shouldShowForPickup || shouldShowForDropoff || isTailorSelfDelivery) {
                        return (
                            <LiveDeliveryTracker 
                                order={order} 
                                socket={socketInstance} 
                                forceSearching={(isSearchingPickup || isSearchingDropoff) && !isTailorSelfDelivery} 
                            />
                        );
                    }
                    return null;
                })()}

                {/* Contact Actions Bar (Always accessible) */}
                <div className="grid grid-cols-2 gap-3">
                    {tailorInfo && (
                        <a 
                            href={`tel:${tailorInfo.phoneNumber || ''}`}
                            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all no-underline"
                        >
                            <Phone size={14} className="text-[#843D9B]" />
                            <span>Call Provider</span>
                        </a>
                    )}
                    {tailorInfo && (
                        <button 
                            onClick={() => navigate(`/user/orders/${id}/chat`)}
                            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                            <MessageSquare size={14} className="text-emerald-600" />
                            <span>Chat Provider</span>
                        </button>
                    )}
                </div>

                {/* 4. Order Details Card */}
                {showOrderDetailsSection && (
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <ShoppingBag size={18} className="text-[#843D9B]" />
                            <h3 className="text-sm font-black text-gray-900">Order Details</h3>
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                        <img src={imageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">{serviceTitle}</h4>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                            Qty: {order.items?.[0]?.quantity || 1} &nbsp;|&nbsp; Size: {order.items?.[0]?.measurements?.type || 'Custom'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-gray-900 shrink-0">₹{order.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center text-gray-600">
                                <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <Calendar size={13} /> Booking Date
                                </span>
                                <span className="font-bold text-gray-900">{createdDateString}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-600">
                                <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <Truck size={13} /> Expected Service Date
                                </span>
                                <span className="font-bold text-gray-900">{dateString}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-600">
                                <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <CreditCard size={13} /> Payment Method
                                </span>
                                <span className="font-bold text-gray-900 uppercase">{order.paymentMethod || 'Online'}</span>
                            </div>
                        </div>

                        {/* Address */}
                        {order.deliveryAddress && (
                            <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <MapPin size={12} className="text-[#843D9B]" /> ADDRESS
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-[#843D9B]/10 text-[#843D9B] text-[10px] font-black uppercase tracking-wider">
                                        {order.items?.[0]?.measurements?.type === 'home' ? 'Tailor At Home' : 'Standard Delivery'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium leading-relaxed pl-4">
                                    {(!order.deliveryAddress.street && !order.deliveryAddress.city)
                                        ? 'Address provided upon confirmation'
                                        : `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}`
                                    }
                                </p>
                            </div>
                        )}

                        {/* Booking Notes */}
                        {order.specialInstructions && (
                            <div className="pt-3 border-t border-gray-100 space-y-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <FileText size={12} /> Booking Notes
                                </span>
                                <p className="text-xs text-gray-600 italic pl-4">"{order.specialInstructions}"</p>
                            </div>
                        )}

                        {/* Total Amount */}
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-xs">Total Amount</span>
                            <span className="font-black text-[#843D9B] text-base">₹{order.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                    </div>
                )}

                {/* 5. Rating Section (STRICTLY Render ONLY IF Order Delivered) */}
                {isFinalDelivered && (() => {
                    const hasValidTailor = !!(tailorInfo && (tailorInfo._id || tailorInfo.name || tailorInfo.shopName));
                    const hasValidPartner = !!(partnerInfo && (partnerInfo._id || partnerInfo.name));

                    if (!hasValidTailor && !hasValidPartner) return null;

                    return (
                        <div className={`grid grid-cols-1 ${hasValidTailor && hasValidPartner ? 'md:grid-cols-2' : ''} gap-4`}>
                            {/* Service Provider Card */}
                            {hasValidTailor && (
                                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                                <Scissors size={14} />
                                            </div>
                                            <h4 className="text-xs font-black text-gray-900">Service Provider Rating</h4>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-[#843D9B] shrink-0">
                                                <img 
                                                    src={tailorInfo.profileImage || '/logo.png'} 
                                                    alt={tailorInfo.shopName || tailorInfo.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">
                                                    {tailorInfo.shopName || tailorInfo.name}
                                                </h4>
                                                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-0.5">
                                                    <CheckCircle2 size={12} className="fill-emerald-600 text-white" />
                                                    <span>Verified Provider</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500 text-[11px] font-black mt-1">
                                                    {[1,2,3,4,5].map(star => (
                                                        <Star key={star} size={12} className="fill-amber-400 text-amber-400" />
                                                    ))}
                                                    <span className="text-gray-900 ml-1 text-xs">{tailorInfo.rating || '4.8'}</span>
                                                    {tailorInfo.totalRatings && (
                                                        <span className="text-gray-400 font-normal text-[10px]">({tailorInfo.totalRatings})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Action Button */}
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => setIsReviewModalOpen(true)}
                                            className="w-full py-3 bg-[#843D9B] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#723287] transition-all active:scale-[0.98]"
                                        >
                                            <Star size={14} className="fill-white" />
                                            <span>Rate Provider</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Partner Rating Card */}
                            {hasValidPartner && (
                                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                                <Truck size={14} />
                                            </div>
                                            <h4 className="text-xs font-black text-gray-900">Delivery Partner Rating</h4>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-[#843D9B] shrink-0">
                                                <img 
                                                    src={partnerInfo.profileImage || '/logo.png'} 
                                                    alt={partnerInfo.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">
                                                    {partnerInfo.name}
                                                </h4>
                                                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-0.5">
                                                    <CheckCircle2 size={12} className="fill-emerald-600 text-white" />
                                                    <span>Verified Partner</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500 text-[11px] font-black mt-1">
                                                    {[1,2,3,4,5].map(star => (
                                                        <Star key={star} size={12} className="fill-amber-400 text-amber-400" />
                                                    ))}
                                                    <span className="text-gray-900 ml-1 text-xs">{partnerInfo.rating || '4.8'}</span>
                                                    {partnerInfo.totalRatings && (
                                                        <span className="text-gray-400 font-normal text-[10px]">({partnerInfo.totalRatings})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Action Button */}
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => setIsReviewModalOpen(true)}
                                            className="w-full py-3 bg-[#843D9B] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#723287] transition-all active:scale-[0.98]"
                                        >
                                            <Star size={14} className="fill-white" />
                                            <span>Rate Partner</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Report Issue / Rework Card (Visible after Delivery) */}
                {isFinalDelivered && (
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-red-100 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-gray-900 leading-tight truncate">Having fitting or quality issues?</h4>
                                <p className="text-[10px] font-medium text-gray-500 mt-0.5 truncate">Report an issue for alteration & free rework</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                if (order.reportedIssue?._id || order.issueId) {
                                    navigate(`/user/issues/${order.reportedIssue?._id || order.issueId}`);
                                } else {
                                    navigate(`/user/issues/report/${order._id}`);
                                }
                            }}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 whitespace-nowrap active:scale-95 flex items-center gap-1.5"
                        >
                            <AlertCircle size={14} />
                            <span>{order.reportedIssue?._id || order.issueId ? 'View Issue' : 'Report Issue'}</span>
                        </button>
                    </div>
                )}

                {/* Thank You Banner after review */}
                {(order.isReviewed || isReviewed) && isFinalDelivered && (
                    <div className="bg-[#843D9B]/10 rounded-2xl p-4 text-center border border-[#843D9B]/20 font-bold text-[#843D9B] text-xs">
                        <Check size={16} className="inline-block mr-1 text-[#843D9B]" /> Thank you for rating your experience! 💚
                    </div>
                )}

                {/* Review Modal */}
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={order._id}
                    tailorId={tailorInfo?._id || tailorInfo}
                    deliveryPartnerId={partnerInfo?._id || partnerInfo}
                    onSuccess={() => {
                        setIsReviewed(true);
                        fetchOrderDetails();
                    }}
                />

                {/* Exchange Modal */}
                {isExchangeModalOpen && (
                    <ExchangeRequestModal
                        isOpen={isExchangeModalOpen}
                        onClose={() => setIsExchangeModalOpen(false)}
                        order={order}
                        onSuccess={() => fetchOrderDetails()}
                    />
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
