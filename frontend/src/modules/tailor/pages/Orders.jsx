import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, MoreVertical, Check, X, Scissors, Layers, CheckCircle2, Truck, Phone, MapPin, MessageSquare, Clock, ArrowLeft, Package, Calendar, User, Loader2, Heart, RefreshCcw, Navigation, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../../../utils/cn';
import LiveDeliveryTracker from '../../../shared/components/LiveDeliveryTracker';
import CustomerDropoffTracker from '../../../shared/components/CustomerDropoffTracker';
import TailorLiveDeliveryTracker from '../../../shared/components/TailorLiveDeliveryTracker';
import toast from 'react-hot-toast';
import MeasurementDetail from './MeasurementDetail';
import MeasurementDataDisplay from '../../../components/Common/MeasurementDataDisplay';
import { isGarmentStoreOrder } from '../../../shared/utils/shiprocketEligibility';
import { formatOrderItemsTitle, getItemImage } from '../../../utils/orderItems';

const Orders = () => {
    const { user } = useTailorAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [shiprocketValidation, setShiprocketValidation] = useState(null);
    const [unreadChats, setUnreadChats] = useState({});

    // Production Notes State for Active Orders
    const [productionNotes, setProductionNotes] = useState({});
    const [noteInput, setNoteInput] = useState('');

    // Dispatch Delivery Modal State
    const [dispatchOrder, setDispatchOrder] = useState(null);
    const [isDispatching, setIsDispatching] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState({});
    const [dispatchingMethod, setDispatchingMethod] = useState(null);
    const lastNewOrderEventRef = useRef({ key: null, at: 0 });
    const fetchSequenceRef = useRef(0);

    // Ref to always have the latest activeTab in socket/timer callbacks without re-subscribing
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    const fetchOrders = useCallback(async (tabOverride) => {
        const tab = tabOverride || activeTabRef.current;
        const sequence = ++fetchSequenceRef.current;
        setIsLoading(true);
        try {
            const [response, unreadRes] = await Promise.all([
                api.get(`/tailors/orders?status=${tab}`),
                api.get(`/orders/chats/unread`).catch(() => ({ data: { success: false } }))
            ]);
            
            if (unreadRes.data?.success) {
                setUnreadChats(unreadRes.data.data || {});
            }

            // A request for the previous tab may finish after Accept switched us
            // to Active. Never let that stale response overwrite the current tab.
            if (sequence === fetchSequenceRef.current && response.data.success) {
                const list = response.data.data || [];
                setOrders(list);
                // Keep open modal OTP/status in sync with server (select+ includes OTPs)
                setSelectedOrder((prev) => {
                    let targetId = prev ? prev._id : sessionStorage.getItem('tailorSelectedOrderId');
                    if (!targetId) return prev;
                    
                    const fresh = list.find((o) => String(o._id) === String(targetId));
                    if (fresh && !prev) {
                        setIsModalOpen(true);
                    }
                    return fresh || prev;
                });
            }
        } catch (error) {
            if (sequence === fetchSequenceRef.current) {
                console.error('Error fetching orders:', error);
            }
        } finally {
            if (sequence === fetchSequenceRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedOrder) {
            if (isGarmentStoreOrder(selectedOrder) && !selectedOrder.shiprocketDetails?.shipmentId) {
                api.get(`/shiprocket/validate/${selectedOrder._id}`)
                   .then(res => setShiprocketValidation(res.data.data))
                   .catch(err => setShiprocketValidation({ isValid: false, errors: ['Failed to load validation status'] }));
            }
        } else {
            setShiprocketValidation(null);
        }
    }, [selectedOrder]);

    const handleStatusUpdate = async (orderId, status, extraPayload = {}) => {
        setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
        try {
            const response = await api.patch(`/tailors/orders/${orderId}/status`, { status, ...extraPayload });
            if (response.data.success) {
                const updatedObj = response.data.data;
                const displayId = updatedObj?.orderId || orderId;
                const statusKey = String(status).toLowerCase();
                window._lastStatusToastTime = Date.now();
                toast.success(`Status updated to ${status.replace(/-/g, ' ')}`, {
                    id: `toast-status-${displayId}-${statusKey}`
                });
                if (updatedObj) {
                    setOrders(prev => prev.map(o => (String(o._id) === String(orderId) ? { ...o, ...updatedObj } : o)));
                    if (selectedOrder && String(selectedOrder._id) === String(orderId)) {
                        setSelectedOrder(prev => (prev ? { ...prev, ...updatedObj } : updatedObj));
                    }
                }
                if (status === 'accepted') {
                    // Accepted orders belong to the Active tab now
                    setActiveTab('active');
                    fetchOrders('active');
                } else {
                    fetchOrders();
                }
                return response.data;
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleDispatchAction = async (method) => {
        if (!dispatchOrder) return;
        setDispatchingMethod(method);
        setIsDispatching(true);
        try {
            const isBroadcastOrAuto = method === 'broadcast' || method === 'auto';
            let statusToSend = dispatchOrder.targetStatus || dispatchOrder.order.status;

            // Broadcast must stay on ready-for-delivery so partners can accept.
            // out-for-delivery only happens after a partner claims the job.
            if (isBroadcastOrAuto && statusToSend === 'out-for-delivery') {
                statusToSend = 'ready-for-delivery';
            }
            
            await handleStatusUpdate(dispatchOrder.order._id, statusToSend, { 
                autoAssign: isBroadcastOrAuto,
                deliveryMethod: method 
            });
            if (method === 'shiprocket') {
                toast.success('Shiprocket selected. Open the order and use the Shiprocket section to create the shipment.');
            }
            setDispatchOrder(null);
        } finally {
            setIsDispatching(false);
            setDispatchingMethod(null);
        }
    };

    // Socket listener for new chat messages
    useEffect(() => {
        let socket;
        if (user && getToken()) {
            socket = io(SOCKET_URL, {
                auth: { token: getToken() }
            });
            
            socket.on('new_chat_message', (msg) => {
                if (msg.senderModel !== 'Tailor') {
                    setUnreadChats(prev => ({
                        ...prev,
                        [msg.order]: (prev[msg.order] || 0) + 1
                    }));
                }
            });
            
            // Join user room for tailor
            socket.on('connect', () => {
                socket.emit('join_user_room', user._id || user.id);
            });
        }
        
        return () => {
            if (socket) {
                socket.off('new_chat_message');
                socket.off('connect');
            }
        };
    }, [user]);

    const handleShiprocketAction = async (action, orderId) => {
        try {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
            let response;
            if (action === 'create-shipment') {
                response = await api.post(`/shiprocket/create-shipment/${orderId}`);
                toast.success("Shipment created!");
            } else if (action === 'generate-awb') {
                response = await api.post(`/shiprocket/generate-awb/${orderId}`);
                toast.success("AWB generated!");
            } else if (action === 'schedule-pickup') {
                response = await api.post(`/shiprocket/schedule-pickup/${orderId}`);
                toast.success("Pickup scheduled!");
            } else if (action === 'label') {
                response = await api.get(`/shiprocket/label/${orderId}`);
                window.open(response.data.data.label_url, '_blank');
            }
            
            await fetchOrders();
            if (response?.data?.data && selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(response.data.data);
                if (action === 'create-shipment') {
                   setShiprocketValidation(null);
                }
            }
        } catch (error) {
            console.error('Shiprocket action error:', error);
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });
        setSocketInstance(socket);
        const userId = user?._id || user?.id;
        const joinOwnRoom = () => {
            if (userId) socket.emit('join_user_room', String(userId));
        };
        socket.on('connect', joinOwnRoom);
        joinOwnRoom();

        const handleNewOrder = (data = {}) => {
            const eventKey = String(data._id || data.orderId || '');
            const now = Date.now();
            if (
                eventKey &&
                lastNewOrderEventRef.current.key === eventKey &&
                now - lastNewOrderEventRef.current.at < 3000
            ) {
                return;
            }
            lastNewOrderEventRef.current = { key: eventKey, at: now };
            
            // Play loud buzzer (dispatch alert)
            try { playNotificationSound('tailor'); } catch(e) {}
            
            toast.success('New order received', { id: `toast-order-${eventKey || 'new'}` });
            fetchOrders();
        };
        // createOrder emits receive_new_order directly and notification utility
        // emits new_order; listen to both so neither delivery path is missed.
        socket.on('receive_new_order', handleNewOrder);
        socket.on('new_order', handleNewOrder);
        
        // Refresh orders when delivery partner updates status, picks up fabric, generates OTP, etc.
        socket.on('order_status_updated', (data = {}) => {
            const rawStatus = typeof data.status === 'string' ? data.status.toLowerCase().replace(/_/g, '-') : null;
            const patch = {};
            if (rawStatus) patch.status = rawStatus;
            if (data.acceptedAt !== undefined) patch.acceptedAt = data.acceptedAt;
            if (data.pickupDeliveryStatus !== undefined) patch.pickupDeliveryStatus = data.pickupDeliveryStatus;
            if (data.dropoffDeliveryStatus !== undefined) patch.dropoffDeliveryStatus = data.dropoffDeliveryStatus;
            if (data.deliveryStatus !== undefined) patch.deliveryStatus = data.deliveryStatus;
            if (data.dropoffDeliveryOtp !== undefined) patch.dropoffDeliveryOtp = data.dropoffDeliveryOtp;
            if (data.pickupDeliveryOtp !== undefined) patch.pickupDeliveryOtp = data.pickupDeliveryOtp;
            if (data.dropoffOtpVerified !== undefined) patch.dropoffOtpVerified = data.dropoffOtpVerified;
            if (data.pickupOtpVerified !== undefined) patch.pickupOtpVerified = data.pickupOtpVerified;

            const matches = (o) =>
                (data._id && String(o._id) === String(data._id)) ||
                (data.orderId && o.orderId === data.orderId);

            if (Object.keys(patch).length > 0) {
                setSelectedOrder(prev => (prev && matches(prev) ? { ...prev, ...patch } : prev));
                setOrders(prev => prev.map(o => (matches(o) ? { ...o, ...patch } : o)));
            }

            // Always re-fetch for full consistency (OTP select+, populated partners, etc.)
            fetchOrders();
        });

        socket.on('new_notification', (data = {}) => {
            // Re-fetch orders for any delivery or order status update notification
            const notifType = data.type || '';
            const isOrderNotif = [
                'PARTNER_ACCEPTED', 'PARTNER_ASSIGNED', 'FABRIC_PICKED_UP', 
                'OTP_GENERATED', 'REACHED_DROPOFF', 'FABRIC_DELIVERED', 'STATUS_UPDATE', 'ORDER_CREATED'
            ].includes(notifType) || data?.data?.orderId || data?.orderId;

            if (isOrderNotif) {
                fetchOrders();
            }
        });

        return () => {
            socket.off('connect', joinOwnRoom);
            socket.off('receive_new_order', handleNewOrder);
            socket.off('new_order', handleNewOrder);
            socket.off('order_status_updated');
            socket.off('new_notification');
        };
        // Socket should NOT depend on activeTab — fetchOrders uses activeTabRef
        // to always fetch with the current tab without needing to disconnect/reconnect
    }, [user?._id, fetchOrders]);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    // Socket delivery can be interrupted by device sleep/network changes. Keep a
    // small polling fallback so newly assigned orders and status changes recover.
    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') fetchOrders();
        }, 20000);
        return () => window.clearInterval(interval);
    }, [fetchOrders]);

    useEffect(() => {
        if (location.state) {
            let stateHandled = false;
            
            if (location.state.highlightOrderTitle) {
                setSearchQuery(location.state.highlightOrderTitle);
                stateHandled = true;
            }
            if (location.state.orderStatus) {
                const status = location.state.orderStatus;
                if (status === 'Pending' || status === 'Active') setActiveTab('active');
                if (status === 'Done') setActiveTab('history');
                stateHandled = true;
            }
            if (location.state.status) {
                const s = location.state.status;
                if (s === 'pending') setActiveTab('new');
                if (s === 'in-progress') setActiveTab('active');
                if (s === 'completed') setActiveTab('history');
                stateHandled = true;
            }

            let highlightHandled = false;
            if (location.state.highlightOrderId) {
                if (orders.length > 0) {
                    const targetOrder = orders.find(o => o._id === location.state.highlightOrderId);
                    if (targetOrder) {
                        setSelectedOrder(targetOrder);
                        setIsModalOpen(true);
                    }
                    highlightHandled = true;
                } else {
                    // Orders not loaded yet, wait for next render before clearing state
                    return;
                }
            }

            if (stateHandled || highlightHandled) {
                // Clear state from React Router so refresh or state changes don't re-trigger initial tab override
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, navigate, location.pathname, orders]);

    // Sync selectedOrder with the latest data from the orders list
    useEffect(() => {
        if (selectedOrder && orders.length > 0) {
            const updatedOrder = orders.find(o => String(o._id) === String(selectedOrder._id));
            if (updatedOrder) {
                // Ensure the modal updates if the order was modified (like tracking history or status)
                // We use JSON.stringify to do a deep comparison avoiding unnecessary re-renders
                if (JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
                    setSelectedOrder(updatedOrder);
                }
            }
        }
    }, [orders]);

    const filteredOrders = orders.filter(order => {
        const q = searchQuery.toLowerCase();
        const orderId = order.orderId || '';
        const customerName = order.customer?.name || '';
        const itemMatch = (order.items || []).some((item) => {
            const title = item.service?.title || item.service?.name || item.product?.name || '';
            return title.toLowerCase().includes(q);
        });

        return orderId.toLowerCase().includes(q) ||
            customerName.toLowerCase().includes(q) ||
            itemMatch;
    });

    const handleAction = (action, order) => {
        if (action === 'View Detail') {
            setSelectedOrder(order);
            sessionStorage.setItem('tailorSelectedOrderId', order._id);
            setIsModalOpen(true);
        } else if (action === 'Accept Order') {
            handleStatusUpdate(order._id, 'accepted');
        } else if (action === 'Reject Order') {
            handleStatusUpdate(order._id, 'cancelled');
        }
    };

    const handleAddNote = (orderId) => {
        if (!noteInput.trim()) return;
        const noteObj = { text: noteInput, time: 'Today, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
        setProductionNotes(prev => ({
            ...prev,
            [orderId]: [...(prev[orderId] || []), noteObj]
        }));
        setNoteInput('');
    };

    /* ── DETAIL MODAL (FIGMA MATCH) ── */
    const OrderDetailModal = ({ order, isOpen, onClose }) => {
        if (!order || !isOpen) return null;

        // Status is the workflow source of truth. Missing legacy acceptedAt must not
        // rewind an in-progress order back to the Accept Order screen.
        const isPending = order.status === 'pending';
        const canRequestApproval = ['pending', 'measurements-uploaded', 'accepted', 'measurement-verification', 'measurement-revision-required'].includes(order.status);

        return (
            <div className="fixed inset-0 z-[60] bg-[#F5F5F5] flex flex-col animate-in fade-in duration-200 overflow-y-auto pb-24">
                {/* Header */}
                <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                    <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-[17px] font-black text-[#843D9B] tracking-tight">SEWZELLA</h1>
                    <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-sm">
                        {order.customer?.name?.charAt(0) || 'C'}
                    </div>
                </div>

                <div className="flex-1 p-5 space-y-4 max-w-md mx-auto w-full">
                    
                    {/* Active Issue Warning & OTPs */}
                    {order.reportedIssue && !['resolved', 'rejected', 'closed'].includes(order.reportedIssue.status) && (
                        <div className="bg-red-50 rounded-3xl p-5 border border-red-100 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                    <XCircle size={14} /> Active Issue Reported
                                </p>
                                <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-2 py-1 rounded-md">
                                    {order.reportedIssue.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-red-900 mb-4 bg-white/50 p-3 rounded-xl border border-red-100/50">
                                {order.reportedIssue.description}
                            </p>
                            
                            {/* Rework OTPs */}
                            {order.reportedIssue.reworkOrder && (
                                <div className="space-y-2 mt-2">
                                    {order.reportedIssue.reworkOrder.dropoffDeliveryOtp && ['pending', 'accepted', 'pickup_completed'].includes(order.reportedIssue.status) && (
                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                                            <div>
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Dropoff to Tailor OTP</p>
                                                <p className="text-[11px] font-medium text-gray-600 mt-0.5">Give to rider when receiving garment</p>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                {order.reportedIssue.reworkOrder.dropoffDeliveryOtp}
                                            </p>
                                        </div>
                                    )}
                                    {order.reportedIssue.reworkOrder.pickupDeliveryOtp && ['ready_for_delivery'].includes(order.reportedIssue.status) && (
                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                                            <div>
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Pickup from Tailor OTP</p>
                                                <p className="text-[11px] font-medium text-gray-600 mt-0.5">Give to rider when returning fixed garment</p>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                {order.reportedIssue.reworkOrder.pickupDeliveryOtp}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order ID & Meta */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                            <h3 className="text-[20px] font-black text-gray-900 tracking-tight">#{order.orderId || 'ALT-8829-X'}</h3>
                            <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                                <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${isPending ? 'bg-red-50 text-[#843D9B]' : 'bg-green-50 text-green-600'}`}>
                            {isPending ? 'Pending Accept' : 'In Progress'}
                        </span>
                    </div>
                    {/* Order Items Section */}
                    <div className="space-y-3 pt-2">
                        {order.isBridalConsultation && (
                            <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Heart size={18} className="text-rose-500 fill-rose-500" />
                                    <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">Bridal Consultation</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Preferred Date</p>
                                        <p className="text-sm font-black text-rose-950">{order.bridalDate || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Preferred Time</p>
                                        <p className="text-sm font-black text-rose-950">{order.bridalTime || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Customer Notes</p>
                                    <p className="text-xs text-rose-900 leading-relaxed font-medium bg-white/50 p-3 rounded-2xl border border-rose-100/50">
                                        {order.bridalNotes || 'No notes provided.'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Order Items ({order.items?.length || 0})</p>
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.product?.image || item.product?.images?.[0] || item.service?.image || item.service?.images?.[0] ? (
                                        <img src={item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.product?.image || item.product?.images?.[0] || item.service?.image || item.service?.images?.[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <Scissors size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-[15px] font-black text-gray-900 leading-snug">{item.service?.title || item.product?.name || 'Custom Garment'}</h4>
                                        <p className="text-[15px] font-black text-gray-900">₹{order.totalAmount || '0.00'}</p>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{item.fabricSource === 'platform' ? 'Platform Fabric' : 'Customer Fabric'}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[9px] font-black uppercase bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                                            Size: {item.measurements?.type === 'slip' ? 'Slip' : 'Custom'}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${item.deliveryType === 'express' ? 'bg-red-50 text-[#843D9B] border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {item.deliveryType || 'Standard'}
                                        </span>
                                    </div>

                                    {(item.selectedStyle || item.configuration?.selectedStyle) && (
                                        <div className="mt-3 p-3 bg-purple-50/70 rounded-2xl border border-purple-100 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase text-[#843D9B] tracking-wider flex items-center gap-1.5">
                                                    <Scissors size={12} /> {(item.selectedStyle || item.configuration?.selectedStyle).isCustom ? '📸 Custom Reference Design Photo' : '✂️ Selected Style Variant'}
                                                </p>
                                                <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                                    {(item.selectedStyle || item.configuration?.selectedStyle).isCustom ? 'Custom Upload' : 'Variant'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-black text-gray-900">{(item.selectedStyle || item.configuration?.selectedStyle).name || 'Custom Design'}</p>
                                            {(item.selectedStyle || item.configuration?.selectedStyle).image && (
                                                <div className="relative group max-w-full overflow-hidden rounded-xl border border-purple-200 shadow-xs bg-white mt-1">
                                                    <img 
                                                        src={(item.selectedStyle || item.configuration?.selectedStyle).image} 
                                                        alt="Style Reference" 
                                                        className="w-full max-h-48 object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                                                        onClick={() => window.open((item.selectedStyle || item.configuration?.selectedStyle).image, '_blank')}
                                                    />
                                                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                                                        Click to expand 🔍
                                                    </div>
                                                </div>
                                            )}
                                            {(item.selectedStyle || item.configuration?.selectedStyle).description && (
                                                <p className="text-[10px] text-gray-600 font-medium italic">"{(item.selectedStyle || item.configuration?.selectedStyle).description}"</p>
                                            )}
                                        </div>
                                    )}

                                    {(item.styleAddons || item.addons || []).length > 0 && (
                                        <div className="mt-3 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5">
                                            <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                                                Style Add-ons ({(item.styleAddons || item.addons).length})
                                            </p>
                                            {(item.styleAddons || item.addons).map((addon, aIdx) => (
                                                <div key={addon._id || aIdx} className="flex justify-between text-[11px] font-bold text-gray-800">
                                                    <span className="truncate pr-2">{addon.name}</span>
                                                    <span className="text-[#843D9B] shrink-0">₹{Number(addon.price || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(() => {
                                        const custs = item.customizations || item.configuration?.customizations || {};
                                        const activeCustEntries = Object.entries(custs).filter(([_, val]) => val && val.enabled !== false && (val.name || val.refImage || Number(val.price) > 0));
                                        if (activeCustEntries.length === 0) return null;

                                        const slotLabels = {
                                            neck: 'Neck Design',
                                            sleeve: 'Sleeve Style',
                                            bottom: 'Bottom Style',
                                            embroidery: 'Embroidery Work',
                                            lacePiping: 'Lace / Piping',
                                            lining: 'Inner Lining',
                                            other: 'Customization'
                                        };

                                        return (
                                            <div className="mt-3 p-3 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase text-[#843D9B] tracking-wider flex items-center gap-1.5">
                                                        <Scissors size={12} /> Garment Customizations ({activeCustEntries.length})
                                                    </p>
                                                    <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">
                                                        Tailor Specs
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {activeCustEntries.map(([key, val]) => (
                                                        <div key={key} className="p-2 bg-white rounded-xl border border-purple-100/80 flex flex-col gap-1">
                                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                                <span className="text-gray-500 uppercase tracking-wider text-[9px] font-black">{slotLabels[key] || key}:</span>
                                                                <span className="text-gray-900 font-black">{val.name || 'Custom Option'}</span>
                                                                {val.price > 0 && <span className="text-[#843D9B] font-black text-xs">+₹{val.price}</span>}
                                                            </div>
                                                            {val.refImage && (
                                                                <div className="mt-1">
                                                                    <img
                                                                        src={val.refImage}
                                                                        alt={val.name || key}
                                                                        className="h-20 w-auto rounded-lg object-cover border border-gray-200 cursor-pointer"
                                                                        onClick={() => window.open(val.refImage, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Customer Measurements Section */}
                    {(order.isMeasurementHome || order.measurementReport || order.items?.some(item => {
                        const m = item.measurements;
                        if (!m) return false;
                        if (m instanceof Map) return m.size > 0;
                        return Object.keys(m).length > 0;
                    })) && (
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">📐 Customer Measurements</p>
                                <span className="text-[9px] font-black uppercase bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100">Provided</span>
                            </div>
                            
                            {(order.isMeasurementHome || order.measurementReport) && (
                                <div className="border border-[#843D9B]/20 rounded-2xl overflow-hidden mt-2 mb-4 bg-gray-50/50">
                                    <MeasurementDetail orderId={order._id} inline={true} />
                                </div>
                            )}
                            {order.items?.map((item, idx) => {
                                const measurements = item.measurements || {};
                                const mObj =
                                    measurements instanceof Map
                                        ? Object.fromEntries(measurements)
                                        : measurements;
                                const slipSrc =
                                    mObj.slipImage || mObj.image || mObj.url || mObj.slipUrl || '';
                                const META_KEYS = new Set([
                                    'type',
                                    'slipImage',
                                    'image',
                                    'url',
                                    'slipUrl',
                                    'file',
                                    'notes',
                                    'isConfirmed',
                                    'saveProfile',
                                    'sampleGarment',
                                    'slipAttached',
                                    'data',
                                    'measurementLayout',
                                    'categoryId',
                                    'garmentType',
                                    'unit',
                                ]);
                                const entries = Object.entries(mObj).filter(
                                    ([key, value]) =>
                                        !META_KEYS.has(key) &&
                                        value !== '' &&
                                        value != null &&
                                        typeof value !== 'object'
                                );
                                const layoutFields =
                                    Array.isArray(mObj.measurementLayout) && mObj.measurementLayout.length
                                        ? mObj.measurementLayout
                                        : item.service?.category?.measurementFields ||
                                          item.serviceDetails?.category?.measurementFields ||
                                          null;

                                // We only return null if there is absolutely NO measurement data at all
                                if (
                                    entries.length === 0 &&
                                    !slipSrc &&
                                    !mObj.type &&
                                    !mObj.sampleGarment
                                )
                                    return null;

                                return (
                                    <div key={idx} className="space-y-3">
                                        {order.items.length > 1 && (
                                            <p key={`info-${idx}`} className="text-xs text-gray-500 font-medium">
                                                Item {idx + 1}: {item.service?.title || item.product?.name || 'Custom Garment'}
                                            </p>
                                        )}
                                        
                                        {/* Measurement Type Badge */}
                                        {(mObj.type || mObj.sampleGarment) && (
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {mObj.type && (
                                                    <span className="text-[9px] font-black uppercase bg-indigo-50 text-[#843D9B] px-2.5 py-1 rounded-full border border-indigo-100">
                                                        {mObj.type === 'slip' ? '📎 Uploaded Slip' : 
                                                         mObj.type === 'saved' ? '💾 Saved Profile' : 
                                                         mObj.type === 'home' ? '🏠 Tailor at Home' : 
                                                         mObj.type === 'sample' ? '👕 Sample Garment' : 
                                                         '✏️ Self Measured'}
                                                    </span>
                                                )}
                                                {mObj.sampleGarment && mObj.type !== 'sample' && (
                                                    <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                                                        👕 Sample garment also
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Slip Image */}
                                        {slipSrc && (
                                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Measurement Slip</p>
                                                <img 
                                                    src={slipSrc} 
                                                    alt="Measurement Slip" 
                                                    className="w-full max-h-60 object-contain rounded-xl border border-gray-200 cursor-pointer bg-white"
                                                    onClick={() => window.open(slipSrc, '_blank')}
                                                />
                                            </div>
                                        )}

                                        {mObj.type === 'sample' && (
                                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Sample Garment</p>
                                                <p className="text-[12px] text-amber-900 font-medium">
                                                    Customer will provide a sample garment for fitting reference at fabric pickup.
                                                </p>
                                            </div>
                                        )}

                                        {/* Measurement Values — sectioned by service headings */}
                                        {entries.length > 0 && (
                                            <MeasurementDataDisplay
                                                measurements={mObj}
                                                layoutFields={layoutFields}
                                            />
                                        )}

                                        {/* Customer Notes for this item */}
                                        {mObj.notes && (
                                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mt-2">
                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Customer Notes</p>
                                                <p className="text-[12px] text-gray-700 font-medium italic">"{mObj.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Style Add-ons selected by customer */}
                    {order.items?.some((item) => (item.styleAddons || item.addons || []).length > 0) && (
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">✨ Style Add-ons</p>
                            {order.items.map((item, idx) => {
                                const addons = item.styleAddons || item.addons || [];
                                if (!addons.length) return null;
                                return (
                                    <div key={`addons-${idx}`} className="space-y-2">
                                        {order.items.length > 1 && (
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                Item {idx + 1}: {item.service?.title || 'Garment'}
                                            </p>
                                        )}
                                        <div className="space-y-2">
                                            {addons.map((addon, aIdx) => (
                                                <div
                                                    key={addon._id || aIdx}
                                                    className="flex items-center gap-3 p-3 rounded-2xl border border-purple-100 bg-purple-50/40"
                                                >
                                                    {addon.image ? (
                                                        <img
                                                            src={addon.image}
                                                            alt={addon.name}
                                                            className="w-12 h-12 rounded-xl object-cover border border-purple-100 bg-white"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#843D9B] flex items-center justify-center text-lg font-black uppercase">
                                                            {addon.name?.charAt(0) || '✨'}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-gray-900 truncate">{addon.name}</p>
                                                        {addon.description && (
                                                            <p className="text-[10px] text-gray-500 line-clamp-2">{addon.description}</p>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-black text-[#843D9B] shrink-0">
                                                        ₹{Number(addon.price || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Garment Customizations */}
                    {order.items?.some((item) => {
                        const custs = item.customizations || item.configuration?.customizations || {};
                        return Object.entries(custs).filter(([_, val]) => val && val.enabled !== false && (val.name || val.refImage || Number(val.price) > 0)).length > 0;
                    }) && (
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3 mt-4">
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5"><Scissors size={14} /> Garment Customizations</p>
                            {order.items.map((item, idx) => {
                                const custs = item.customizations || item.configuration?.customizations || {};
                                const activeCustEntries = Object.entries(custs).filter(([_, val]) => val && val.enabled !== false && (val.name || val.refImage || Number(val.price) > 0));
                                if (!activeCustEntries.length) return null;
                                
                                const slotLabels = {
                                    neck: 'Neck Design',
                                    sleeve: 'Sleeve Style',
                                    bottom: 'Bottom Style',
                                    embroidery: 'Embroidery Work',
                                    lacePiping: 'Lace / Piping',
                                    lining: 'Inner Lining',
                                    other: 'Customization'
                                };

                                return (
                                    <div key={`cust-${idx}`} className="space-y-2">
                                        {order.items.length > 1 && (
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                Item {idx + 1}: {item.service?.title || 'Garment'}
                                            </p>
                                        )}
                                        <div className="space-y-1.5">
                                            {activeCustEntries.map(([key, val]) => (
                                                <div key={key} className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-sm font-bold">
                                                        <span className="text-gray-500 uppercase tracking-wider text-[10px] font-black">{slotLabels[key] || key}:</span>
                                                        <span className="text-gray-900 font-black">{val.name || 'Custom Option'}</span>
                                                        {val.price > 0 && <span className="text-[#843D9B] font-black text-xs">+₹{val.price}</span>}
                                                    </div>
                                                    {val.refImage && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={val.refImage}
                                                                alt={val.name || key}
                                                                className="h-24 w-auto rounded-xl object-cover border border-purple-100 cursor-pointer shadow-sm"
                                                                onClick={() => window.open(val.refImage, '_blank')}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isPending && (
                        <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-3xl p-5 space-y-2">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="text-amber-500">ℹ️</span> Special Instructions
                            </p>
                            <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
                                "Please ensure optimal fitting around the waist. Use premium thread. Customer has requested delivery before weekend."
                            </p>
                        </div>
                    )}

                    {/* OTP Display for Tailor */}
                    {order.pickupDeliveryOtp && order.pickupOtpVerified !== true && ['ready-for-pickup', 'ready-for-delivery', 'out-for-delivery'].includes(order.status) && (
                        <div className="mb-4 p-4 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase text-[#843D9B] tracking-wider">Pickup OTP</p>
                                <p className="text-[12px] text-gray-600 font-medium">Share with delivery partner for final product pickup</p>
                            </div>
                            <div className="text-2xl font-black text-[#843D9B] tracking-widest bg-white px-4 py-2 rounded-xl border border-indigo-100">
                                {order.pickupDeliveryOtp}
                            </div>
                        </div>
                    )}
                    {order.dropoffDeliveryOtp && order.dropoffOtpVerified !== true && (
                        ['fabric-picked-up', 'fabric-ready-for-pickup', 'waiting-for-customer-dropoff', 'fabric-delivered'].includes(order.status) ||
                        order.pickupDeliveryStatus === 'reached-dropoff'
                    ) && (
                        <div className="mb-4 p-4 bg-green-50 rounded-3xl border border-green-100 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase text-green-700 tracking-wider">Fabric Receive OTP</p>
                                <p className="text-[12px] text-gray-600 font-medium">Share this with the delivery partner to accept fabric</p>
                            </div>
                            <div className="text-2xl font-black text-green-700 tracking-widest bg-white px-4 py-2 rounded-xl border border-green-100">
                                {order.dropoffDeliveryOtp}
                            </div>
                        </div>
                    )}

                    {/* Delivery Partner Details */}
                    {(() => {
                        const isPickupPhase = ['fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status) || (order.status === 'in-progress' && order.pickupDeliveryStatus === 'delivered');
                        const isDropoffPhase = ['ready', 'ready-for-delivery', 'ready-for-pickup', 'out-for-delivery'].includes(order.status) || (order.status === 'delivered' && order.dropoffDeliveryStatus === 'delivered');
                        
                        let showPartner = false;
                        let partnerInfo = null;

                        if (isPickupPhase && ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'delivered'].includes(order.pickupDeliveryStatus)) {
                            showPartner = true;
                            // If we have separate pickupPartner populated, prefer it. Otherwise fallback to deliveryPartner
                            partnerInfo = order.pickupPartner?.name ? order.pickupPartner : order.deliveryPartner;
                        } else if (isDropoffPhase && ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'delivered'].includes(order.dropoffDeliveryStatus)) {
                            showPartner = true;
                            partnerInfo = order.dropoffPartner?.name ? order.dropoffPartner : order.deliveryPartner;
                        }

                        if (!showPartner || !partnerInfo) return null;

                        return (
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Delivery Partner</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                                    {partnerInfo.profileImage ? (
                                        <img src={partnerInfo.profileImage} alt={partnerInfo.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Truck size={16} className="text-[#843D9B]" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[14px] font-black text-gray-900 leading-none mb-1">{partnerInfo.name || 'Delivery Partner'}</p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                                        <Phone size={10} /> {partnerInfo.phoneNumber || 'Contact Unavailable'}
                                    </p>
                                </div>
                                {partnerInfo.phoneNumber && (
                                    <a 
                                        href={`tel:${partnerInfo.phoneNumber}`}
                                        className="w-8 h-8 bg-indigo-50 text-[#843D9B] rounded-full flex items-center justify-center border border-indigo-100 shrink-0"
                                    >
                                        <Phone size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                        );
                    })()}

                    {(() => {
                        const isPickupPhaseStatus = ['fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status);
                        const isDropoffPhaseStatus = ['ready-for-delivery', 'out-for-delivery'].includes(order.status);
                        const hasActivePickupPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus);
                        const hasActiveDropoffPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.dropoffDeliveryStatus);
                        // Also show "Searching" state when partner has been notified (pending) but not yet accepted
                        const isSearchingPickup = order.pickupDeliveryStatus === 'pending' || order.pickupDeliveryStatus === 'searching';
                        const isSearchingDropoff = order.dropoffDeliveryStatus === 'pending' || order.dropoffDeliveryStatus === 'searching';

                        const isCustomerDelivering = order.fabricDeliveryPreference === 'customer' && order.status === 'accepted';
                        const shouldShowForPickup = (isPickupPhaseStatus || hasActivePickupPartner || isSearchingPickup) && order.fabricDeliveryPreference === 'partner' || isCustomerDelivering;
                        const shouldShowForDropoff = (isDropoffPhaseStatus || hasActiveDropoffPartner || isSearchingDropoff) && order.deliveryMethod !== 'self' && order.deliveryMethod !== 'shiprocket';

                        if (order.status === 'out-for-delivery' && order.deliveryMethod === 'tailor') {
                            return <TailorLiveDeliveryTracker 
                                order={order} 
                                socket={socketInstance} 
                                onDeliveryComplete={(updatedOrder) => {
                                    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
                                    setSelectedOrder(updatedOrder);
                                }}
                            />;
                        }

                        if (shouldShowForPickup || shouldShowForDropoff) {
                            return <LiveDeliveryTracker order={order} socket={socketInstance} />;
                        }
                        return null;
                    })()}

                    {isPending && (
                        <div className="flex flex-col gap-2 pt-4 sticky bottom-0 bg-[#F5F5F5] pb-4 z-10">
                            <div className="flex gap-2 w-full">
                                <button 
                                    onClick={async () => {
                                        await handleStatusUpdate(order._id, 'cancelled');
                                        onClose();
                                    }}
                                    disabled={updatingOrders[order._id]}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {updatingOrders[order._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-700" /> : 'Reject'}
                                </button>
                                <button 
                                    onClick={async () => {
                                        await handleStatusUpdate(order._id, 'accepted');
                                        onClose();
                                    }}
                                    disabled={updatingOrders[order._id]}
                                    className="flex-[2] py-3 bg-[#843D9B] text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-[#843D9B]/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {updatingOrders[order._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : 'Accept Order'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white pb-24 md:pb-0">
            
            {/* ── HEADER ── */}
            <div className="md:hidden bg-white pt-3 pb-2 border-b border-gray-100 text-left px-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-black text-gray-900 tracking-tight">
                        {activeTab === 'all' ? 'All Orders' : activeTab === 'new' ? 'New Orders' : activeTab === 'active' ? 'Active Orders' : activeTab === 'issues' ? 'Active Issues' : 'Order History'}
                    </h2>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {filteredOrders.length} {activeTab === 'new' ? 'Pending' : activeTab === 'issues' ? 'Issues' : 'Orders'}
                    </span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {activeTab === 'new' ? 'Review and accept incoming tailoring tasks' :
                     activeTab === 'active' ? 'Manage and track live active orders' :
                     activeTab === 'history' ? 'View completed and past orders' :
                     activeTab === 'issues' ? 'Orders with active customer issues needing rework' :
                     'Manage and track all tailoring tasks'}
                </p>

                {/* Search & Filter Header */}
                <div className="mt-5 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Order ID or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#843D9B] text-[12px] text-gray-900 shadow-sm"
                        />
                    </div>

                    <div className="flex bg-gray-200/50 rounded-2xl p-1 gap-1 overflow-x-auto">
                        {['all', 'new', 'active', 'issues', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                    activeTab === tab ? "bg-white text-[#843D9B] shadow-md shadow-black/5" : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                {tab === 'all' ? 'All' : tab === 'new' ? 'New' : tab === 'active' ? 'Active' : tab === 'issues' ? 'Issues' : 'History'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-2 md:px-0">
                <div className="hidden md:block">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Orders Management</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage and track production status</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Order ID or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#843D9B] text-[12px] text-gray-900 shadow-sm"
                        />
                    </div>

                    <div className="flex bg-gray-200/50 rounded-2xl p-1 gap-1 overflow-x-auto">
                        {['all', 'new', 'active', 'issues', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                    activeTab === tab ? "bg-white text-[#843D9B] shadow-md shadow-black/5" : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                {tab === 'all' ? 'All' : tab === 'new' ? 'New' : tab === 'active' ? 'Active' : tab === 'issues' ? 'Issues' : 'History'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="h-8 w-8 border-[3px] border-[#843D9B] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                            <Layers size={32} />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No orders found in this section</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 px-3 md:px-0">
                        {filteredOrders.map((order) => {
                            const isNew = order.status === 'pending' || (!order.acceptedAt && order.status === 'pending');
                            return (
                                <div key={order._id} className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#843D9B]/10 transition-all flex flex-col group">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex flex-col gap-0.5 md:gap-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[9px] md:text-[10px] font-black uppercase bg-[#FDE5D2] text-[#843D9B] px-2 md:px-3 py-1 rounded-md md:rounded-lg border border-[#843D9B]/10 w-fit">
                                                    #{order.orderId || 'ALT123456'}
                                                </span>
                                                <span className={cn(
                                                    "text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                                                    ['delivered', 'product-delivered', 'order-completed'].includes(order.status) ? "bg-green-50 text-green-700 border-green-200" :
                                                    order.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                                                    "bg-purple-50 text-[#843D9B] border-purple-100"
                                                )}>
                                                    {order.status?.replace(/-/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-tighter">Received {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {order.exchangeStatus && order.exchangeStatus !== 'none' && (
                                                <div className="flex items-center justify-center px-2 bg-purple-100 text-primary text-[9px] font-black uppercase rounded-lg border border-purple-200 animate-pulse">
                                                    Exchange
                                                </div>
                                            )}
                                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xs group-hover:scale-110 transition-transform">
                                                {order.customer?.name?.charAt(0) || 'C'}
                                            </div>
                                        </div>
                                    </div>

                                    <h4 className="text-sm md:text-base font-black text-gray-900 leading-tight mb-3 md:mb-4">
                                        {order.customer?.name}
                                    </h4>

                                    <div className="flex-1 bg-gray-50 p-2.5 md:p-3 rounded-xl md:rounded-[1.5rem] border border-gray-100 mb-3 md:mb-5 flex items-center gap-2.5 md:gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100 relative">
                                            {getItemImage(order.items?.[0]) ? (
                                                <img src={getItemImage(order.items[0])} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Scissors size={16} className="md:w-[18px] md:h-[18px] text-primary" />
                                            )}
                                            {(order.items?.length || 0) > 1 && (
                                                <span className="absolute bottom-0 right-0 bg-primary text-white text-[8px] font-black px-1 rounded-tl">
                                                    {order.items.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] md:text-xs font-black text-gray-900 truncate">
                                                {formatOrderItemsTitle(order.items, { fallback: 'Custom Design' })}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5 md:mt-1 text-gray-400">
                                                <MapPin size={10} className="shrink-0" />
                                                <p className="text-[9px] md:text-[10px] font-bold truncate">
                                                    {order.deliveryAddress?.street || 'Local Pick-up'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAction('View Detail', order)}
                                            className="flex-1 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                        >
                                            Details
                                        </button>
                                        {isNew ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                                disabled={updatingOrders[order._id]}
                                                className="flex-[1.5] py-2.5 md:py-3 bg-[#843D9B] rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-[#843D9B]/20 hover:bg-[#4E2460] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {updatingOrders[order._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : 'Accept Order'}
                                            </button>
                                        ) : (
                                            (() => {
                                                if (order.reportedIssue && !['resolved', 'rejected', 'closed'].includes(order.reportedIssue.status)) {
                                                    return (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/partner/issues/${order.reportedIssue._id}`); }}
                                                            className="flex-[1.5] py-2.5 md:py-3 bg-red-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            Manage Issue
                                                        </button>
                                                    );
                                                }

                                                if (['delivered', 'product-delivered', 'order-completed'].includes(order.status)) {
                                                    return (
                                                        <button 
                                                            onClick={() => handleAction('View Detail', order)}
                                                            className="flex-[1.5] py-2.5 md:py-3 bg-green-50 border border-green-200 rounded-xl text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                        >
                                                            <CheckCircle2 size={14} className="text-green-600" /> Completed
                                                        </button>
                                                    );
                                                }

                                                if (order.status === 'cancelled') {
                                                    return (
                                                        <button 
                                                            onClick={() => handleAction('View Detail', order)}
                                                            className="flex-[1.5] py-2.5 md:py-3 bg-red-50 border border-red-200 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                        >
                                                            <X size={14} className="text-red-600" /> Cancelled
                                                        </button>
                                                    );
                                                }

                                                const flow = order.fabricPickupRequired 
                                                    ? [
                                                        // Only after fabric has actually arrived (partner drop-off or customer self-dropoff)
                                                        { current: 'fabric-delivered', next: 'fabric-received', label: 'Receive Fabric' },
                                                        { current: 'waiting-for-customer-dropoff', next: 'fabric-received', label: 'Receive Fabric' },
                                                        { current: 'fabric-received', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'in-progress', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'cutting', next: 'stitching', label: 'Start Stitching' },
                                                        { current: 'stitching', next: 'quality-check', label: 'Mark Completed' },
                                                        { current: 'quality-check', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready-for-pickup', next: 'out-for-delivery', label: 'Dispatch' },
                                                        { current: 'ready-for-delivery', next: 'out-for-delivery', label: 'Dispatch' },
                                                        { current: 'out-for-delivery', next: 'delivered', label: 'Mark Delivered' }
                                                    ]
                                                    : [
                                                        { current: 'measurements-approved', next: 'order-received', label: 'Receive Order' },
                                                        { current: 'accepted', next: 'order-received', label: 'Receive Order' },
                                                        { current: 'order-received', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'waiting-for-customer-dropoff', next: 'fabric-received', label: 'Receive Fabric' },
                                                        { current: 'fabric-received', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'in-progress', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'cutting', next: 'stitching', label: 'Start Stitching' },
                                                        { current: 'stitching', next: 'quality-check', label: 'Mark Completed' },
                                                        { current: 'quality-check', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready-for-pickup', next: 'out-for-delivery', label: 'Dispatch' },
                                                        { current: 'ready-for-delivery', next: 'out-for-delivery', label: 'Dispatch' },
                                                        { current: 'out-for-delivery', next: 'delivered', label: 'Mark Delivered' }
                                                    ];
                                                
                                                if (order.advancePaymentStatus !== 'paid' && order.paymentStatus !== 'paid') {
                                                    return (
                                                        <div className="flex-1 text-center py-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                                                            <Clock size={12} className="text-amber-600 animate-pulse" /> Awaiting customer payment
                                                        </div>
                                                    );
                                                }

                                                // Customer→tailor fabric must physically arrive before tailor can mark received
                                                const awaitingCustomerFabric =
                                                    order.fabricPickupRequired &&
                                                    ['accepted', 'measurements-approved', 'order-received', 'fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status);

                                                if (awaitingCustomerFabric) {
                                                    let awaitingLabel = 'Awaiting fabric delivery';
                                                    if (order.status === 'fabric-picked-up') {
                                                        awaitingLabel = 'Fabric in transit — share OTP';
                                                    } else if (order.status === 'fabric-ready-for-pickup') {
                                                        awaitingLabel = 'Awaiting fabric pickup';
                                                    } else if (order.advancePaymentStatus !== 'paid' && order.paymentStatus !== 'paid') {
                                                        awaitingLabel = 'Awaiting customer payment';
                                                    } else if (order.fabricDeliveryPreference === 'self') {
                                                        awaitingLabel = 'Awaiting customer fabric drop-off';
                                                    } else if (!order.fabricDeliveryPreference || order.fabricDeliveryPreference === 'pending') {
                                                        awaitingLabel = 'Awaiting fabric option from customer';
                                                    }
                                                    return (
                                                        <div className="flex-1 text-center py-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                            <Clock size={12} /> {awaitingLabel}
                                                        </div>
                                                    );
                                                }

                                                const currentStatusForFlow = order.status;
                                                const nextStep = flow.find(f => f.current === currentStatusForFlow);
                                                
                                                if (order.status === 'out-for-delivery' && order.deliveryMethod === 'tailor') {
                                                    return (
                                                        <div className="flex-1 text-center py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Use the OTP form in the live tracking area above to complete delivery
                                                        </div>
                                                    );
                                                }

                                                if (!nextStep) {
                                                    return (
                                                        <button 
                                                            onClick={() => handleAction('View Detail', order)}
                                                            className="flex-[1.5] py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            View Detail
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (nextStep.current === 'quality-check' || (order.status === 'ready-for-pickup' && order.deliveryMethod !== 'self') || (order.status === 'ready-for-delivery' && order.deliveryMethod !== 'self')) {
                                                                setDispatchOrder({ order, targetStatus: nextStep.next });
                                                            } else {
                                                                handleStatusUpdate(order._id, nextStep.next);
                                                            }
                                                        }}
                                                        disabled={updatingOrders[order._id]}
                                                        className="flex-[1.5] py-2.5 md:py-3 bg-gray-900 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {updatingOrders[order._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : nextStep.label}
                                                    </button>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Slide-over Detail Panel */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => {
                            setIsModalOpen(false);
                            setSelectedOrder(null);
                            sessionStorage.removeItem('tailorSelectedOrderId');
                        }}
                    />
                    <div className="relative w-full max-w-xl bg-[#F5F5F5] h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col">
                        <OrderDetailModal 
                            order={selectedOrder} 
                            isOpen={isModalOpen} 
                            onClose={() => {
                                setIsModalOpen(false);
                                setSelectedOrder(null);
                                sessionStorage.removeItem('tailorSelectedOrderId');
                            }} 
                        />
                    </div>
                </div>
            )}

            {/* Delivery Dispatch Modal */}
            {dispatchOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => !isDispatching && setDispatchOrder(null)}
                    />
                    <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-gray-900">Assign Delivery Partner</h3>
                            <button onClick={() => !isDispatching && setDispatchOrder(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-6">Select how you want to dispatch this order for delivery.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleDispatchAction('broadcast')}
                                disabled={isDispatching}
                                className="w-full p-4 border border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 rounded-2xl flex items-center gap-4 transition-all text-left group disabled:opacity-60"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                    {isDispatching && dispatchingMethod === 'broadcast' ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Truck size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-blue-900 mb-0.5 group-hover:text-blue-700">Broadcast to Partners</h4>
                                    <p className="text-[10px] font-bold text-blue-600/70">Send request to all available delivery agents.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleDispatchAction('manual')}
                                disabled={isDispatching}
                                className="w-full p-4 border border-amber-100 bg-amber-50 hover:bg-amber-100 hover:border-amber-200 rounded-2xl flex items-center gap-4 transition-all text-left group disabled:opacity-60"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                                    {isDispatching && dispatchingMethod === 'manual' ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : <User size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-amber-900 mb-0.5 group-hover:text-amber-700">Manual Assignment</h4>
                                    <p className="text-[10px] font-bold text-amber-600/70">Admin will manually select a partner.</p>
                                </div>
                            </button>

                            {isGarmentStoreOrder(dispatchOrder.order) && (
                            <button 
                                onClick={() => handleDispatchAction('shiprocket')}
                                disabled={isDispatching}
                                className="w-full p-4 border border-purple-100 bg-purple-50 hover:bg-purple-100 hover:border-purple-200 rounded-2xl flex items-center gap-4 transition-all text-left group disabled:opacity-60"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                                    {isDispatching && dispatchingMethod === 'shiprocket' ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Package size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-purple-900 mb-0.5 group-hover:text-primary">Shiprocket Delivery</h4>
                                    <p className="text-[10px] font-bold text-primary/70">Courier pickup for garment orders (long distance).</p>
                                </div>
                            </button>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Orders;
