import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Check, X, Scissors, Layers, CheckCircle2, Truck, Phone, MapPin, MessageSquare, Clock, ArrowLeft, Package, Calendar, User, Loader2, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../../../utils/cn';
import LiveDeliveryTracker from '../../../shared/components/LiveDeliveryTracker';
import toast from 'react-hot-toast';
import MeasurementDetail from './MeasurementDetail';

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

    // Production Notes State for Active Orders
    const [productionNotes, setProductionNotes] = useState({});
    const [noteInput, setNoteInput] = useState('');

    // Dispatch Delivery Modal State
    const [dispatchOrder, setDispatchOrder] = useState(null);
    const [isDispatching, setIsDispatching] = useState(false);
    const [updatingOrders, setUpdatingOrders] = useState({});
    const [dispatchingMethod, setDispatchingMethod] = useState(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/tailors/orders?status=${activeTab}`);
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrder) {
            const isReadyMade = selectedOrder.items?.some(item => item.productType === 'store_item');
            if (isReadyMade && !selectedOrder.shiprocketDetails?.shipmentId) {
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
                if (status === 'accepted') {
                    setActiveTab('active');
                } else {
                    fetchOrders();
                }
                
                if (selectedOrder && selectedOrder._id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status });
                }
                return response.data;
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleDispatchAction = async (method) => {
        if (!dispatchOrder) return;
        setDispatchingMethod(method);
        setIsDispatching(true);
        try {
            await handleStatusUpdate(dispatchOrder.order._id, dispatchOrder.targetStatus, { 
                autoAssign: method === 'auto',
                deliveryMethod: method 
            });
            setDispatchOrder(null);
        } finally {
            setIsDispatching(false);
            setDispatchingMethod(null);
        }
    };

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
            
            // Refresh orders to get latest status
            fetchOrders();
            // Update selected order with new details so UI updates instantly
            if (response?.data?.data && selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(response.data.data);
                // Also trigger validation check if shipment was just created
                if (action === 'create-shipment') {
                   setShiprocketValidation(null);
                }
            }
        } catch (error) {
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
        if (userId) socket.emit('join', `user_${userId}`);
        socket.on('receive_new_order', () => { fetchOrders(); });
        
        // Refresh orders when delivery partner accepts/rejects (real-time update)
        socket.on('order_status_updated', (data) => {
            fetchOrders();
            // If the updated order is currently open in modal, refresh it
            setSelectedOrder(prev => {
                if (prev && (prev._id === data._id || prev.orderId === data.orderId)) {
                    return { ...prev, ...data };
                }
                return prev;
            });
        });

        socket.on('new_notification', (data) => {
            // Refresh if a delivery partner accepted or rejected our task
            if (['PARTNER_ACCEPTED', 'PARTNER_ASSIGNED'].includes(data.type)) {
                fetchOrders();
            }
        });

        return () => socket.disconnect();
    }, [activeTab, user?._id]);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    useEffect(() => {
        if (location.state) {
            if (location.state.highlightOrderTitle) setSearchQuery(location.state.highlightOrderTitle);
            if (location.state.orderStatus) {
                const status = location.state.orderStatus;
                if (status === 'Pending' || status === 'Active') setActiveTab('active');
                if (status === 'Done') setActiveTab('history');
            }
        }
    }, [location]);

    // Handle auto-opening order detail modal from notifications
    useEffect(() => {
        if (location.state?.highlightOrderId && orders.length > 0) {
            const targetOrder = orders.find(o => o._id === location.state.highlightOrderId);
            if (targetOrder) {
                setSelectedOrder(targetOrder);
                setIsModalOpen(true);
                // Clear the state so it doesn't re-open on refresh
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, orders]);

    // Sync selectedOrder with the latest data from the orders list
    useEffect(() => {
        if (selectedOrder && orders.length > 0) {
            const updatedOrder = orders.find(o => o._id === selectedOrder._id);
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
        const orderId = order.orderId || '';
        const customerName = order.customer?.name || '';
        const serviceTitle = order.items?.[0]?.service?.title || '';

        return orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleAction = (action, order) => {
        if (action === 'View Detail') {
            setSelectedOrder(order);
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

                    {isPending ? (
                        /* ── VIEW 1: PENDING ACCEPT ── */
                        <>
                            {/* Customer Details */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-black text-lg">
                                            {order.customer?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-black text-gray-900">{order.customer?.name}</p>
                                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">{order.customer?.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <button className="w-10 h-10 bg-[#FDE5D2] border border-[#843D9B]/20 text-[#843D9B] rounded-2xl flex items-center justify-center">
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                                <div className="pt-3 border-t border-gray-50 flex items-start gap-2">
                                    <MapPin size={16} className="text-[#843D9B] mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[12px] text-gray-700 font-medium leading-relaxed">
                                            {[order.deliveryAddress?.street, order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.zipCode].filter(Boolean).join(', ')}
                                        </p>
                                        <button className="text-[11px] font-black text-[#843D9B] uppercase tracking-wider mt-1 block">View Map</button>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder matching Figma */}
                            <div className="bg-white rounded-3xl p-4 border border-gray-100">
                                <div className="bg-gray-200 h-44 rounded-2xl relative overflow-hidden flex items-center justify-center">
                                    {/* Map Graphic Mock */}
                                    <div className="absolute inset-0 bg-[#E2E8F0] opacity-80" />
                                    <div className="relative w-12 h-12 bg-[#FDE5D2] border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                        <MapPin size={24} className="text-[#843D9B]" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ── VIEW 2: IN PROGRESS WITH STEPPER ── */
                        <>
                            {/* Customer Profile Row */}
                            <div className="bg-white rounded-3xl p-4 border border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-black text-sm">
                                    {order.customer?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                                    <p className="text-sm font-black text-gray-900">{order.customer?.name}</p>
                                </div>
                            </div>

                            {/* Shiprocket Delivery Section (For Ready-Made Products) */}
                            {order.items?.some(item => !!item.product && !item.service && !item.isAlteration && !item.isCustomDesign) && order.items.every(item => !item.service && !item.isAlteration && !item.isCustomDesign) && (
                                <div className="bg-white rounded-3xl p-5 border border-purple-100 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                                            <Package size={14} className="text-[#843D9B]" /> 
                                            Shiprocket Delivery
                                        </p>
                                        <span className="text-[9px] font-black uppercase bg-purple-50 text-purple-600 px-2 py-1 rounded-full border border-purple-100">Ready-Made</span>
                                    </div>

                                    {!order.shiprocketDetails?.shipmentId ? (
                                        <div className="flex flex-col gap-3">
                                            {shiprocketValidation && !shiprocketValidation.isValid && (
                                                <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100">
                                                    <p className="font-bold text-xs uppercase mb-1">Validation Errors</p>
                                                    <ul className="list-disc pl-4 text-[11px] font-medium space-y-0.5">
                                                        {shiprocketValidation.errors.map((err, idx) => (
                                                            <li key={idx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <button 
                                                disabled={updatingOrders[order._id] || (shiprocketValidation && !shiprocketValidation.isValid)}
                                                onClick={() => handleShiprocketAction('create-shipment', order._id)}
                                                className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all"
                                            >
                                                {updatingOrders[order._id] ? 'Generating...' : 'Generate Shipment'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Shipment ID</span>
                                                    <span className="text-xs font-black text-gray-900">{order.shiprocketDetails.shipmentId}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</span>
                                                    <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                                        {order.shiprocketDetails.currentStatus || 'NEW'}
                                                    </span>
                                                </div>
                                                {order.shiprocketDetails.awbCode && (
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AWB / Courier</span>
                                                        <span className="text-xs font-black text-gray-900">{order.shiprocketDetails.awbCode} ({order.shiprocketDetails.courierName})</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                {!order.shiprocketDetails.awbCode ? (
                                                    <button 
                                                        onClick={() => handleShiprocketAction('generate-awb', order._id)}
                                                        disabled={updatingOrders[order._id]}
                                                        className="col-span-2 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                                                    >
                                                        {updatingOrders[order._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate AWB'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        {!order.shiprocketDetails.pickupScheduled ? (
                                                            <button 
                                                                onClick={() => handleShiprocketAction('schedule-pickup', order._id)}
                                                                disabled={updatingOrders[order._id]}
                                                                className="py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                                                            >
                                                                {updatingOrders[order._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Schedule Pickup'}
                                                            </button>
                                                        ) : (
                                                            <div className="py-2.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-200 flex items-center justify-center">
                                                                Pickup Scheduled
                                                            </div>
                                                        )}
                                                        
                                                        <button 
                                                            onClick={() => handleShiprocketAction('label', order._id)}
                                                            disabled={updatingOrders[order._id]}
                                                            className="py-2.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                                                        >
                                                            {updatingOrders[order._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Print Label'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Production Status Stepper */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100">
                                {(() => {
                                    const isReadyMade = order.items?.some(item => item.product);
                                    const isAlteration = order.items?.some(item => item.isAlteration) || order.isAlteration;

                                    const steps = isAlteration ? [
                                        { key: 'order-received',     label: 'Order Received' },
                                        { key: 'fabric-received',    label: 'Garment Received' },
                                        { key: 'in-progress',        label: 'Alteration Started' },
                                        { key: 'quality-check',      label: 'Completed' },
                                        { key: 'ready-for-delivery', label: 'Ready For Delivery' },
                                        { key: 'delivered',          label: 'Delivered' }
                                    ] : order.isBridalConsultation ? [
                                        { key: 'pending',            label: 'Request Received' },
                                        { key: 'accepted',           label: 'Consultation Accepted' },
                                        { key: 'measurements-approved', label: 'Measurements Taken' },
                                        { key: 'in-progress',        label: 'Stitching Started' },
                                        { key: 'quality-check',      label: 'Completed' },
                                        { key: 'ready-for-delivery', label: 'Ready For Delivery' },
                                        { key: 'delivered',          label: 'Delivered' }
                                    ] : isReadyMade ? [
                                        { key: 'order-received',     label: 'Order Received' },
                                        { key: 'in-progress',        label: 'Processing & Packing' },
                                        { key: 'ready-for-delivery', label: 'Ready To Dispatch' },
                                        { key: 'delivered',          label: 'Delivered' }
                                    ] : [
                                        ...(order.isMeasurementHome ? [{ key: 'measurements-approved', label: 'Measurements Done' }] : []),
                                        { key: 'order-received',     label: 'Order Received' },
                                        { key: 'fabric-received',    label: 'Fabric Received' },
                                        { key: 'cutting',            label: 'Cutting' },
                                        { key: 'stitching',          label: 'Stitching' },
                                        { key: 'quality-check',      label: 'Completed' },
                                        { key: 'ready-for-delivery', label: 'Ready For Delivery' },
                                        { key: 'delivered',          label: 'Delivered' }
                                    ];
                                    
                                    const statusOrder = [
                                        'pending',
                                        'accepted',
                                        'measurement-requested',
                                        'measurement-assigned',
                                        'measurement-accepted',
                                        'measurement-otp-verified',
                                        'measurements-uploaded',
                                        'measurements-approved',
                                        'pickup-assigned',
                                        'fabric-ready-for-pickup',
                                        'fabric-picked-up',
                                        'fabric-delivered',
                                        'order-received',
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
                                    
                                    const currentStatusWeight = statusOrder.indexOf(order.status);
                                    
                                    let currentIdx = -1;
                                    steps.forEach((step, idx) => {
                                        const stepWeight = statusOrder.indexOf(step.key);
                                        // Some older statuses might map to equivalent weights
                                        if (currentStatusWeight >= stepWeight || 
                                            (order.status === 'ready-for-pickup' && step.key === 'ready-for-delivery')) {
                                            currentIdx = idx;
                                        }
                                    });
                                    return (
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[13px] font-black text-gray-900 flex items-center gap-2">
                                                    <Package size={16} className="text-[#843D9B]" />
                                                    Live Tracking
                                                </h3>
                                                <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 animate-pulse">
                                                    Real-time
                                                </div>
                                            </div>

                                            {/* Status Progress Banner */}
                                            <div className="mb-4 p-3 bg-gradient-to-br from-[#843D9B] to-blue-900 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Current Milestone</p>
                                                    <h2 className="text-xl font-black tracking-tight leading-none mb-2 capitalize">
                                                        {order.status.replace(/-/g, ' ')}
                                                    </h2>
                                                    <p className="text-[10px] text-white/70 font-medium">
                                                        Order status updated to {order.status.replace(/-/g, ' ')}
                                                    </p>
                                                </div>
                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                    <Calendar size={48} />
                                                </div>
                                            </div>

                                            {/* Instructional Note */}
                                            <div className="mb-4 bg-amber-50/80 border border-amber-100 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                    <span className="text-amber-500">ℹ️</span> Update Instructions
                                                </p>
                                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                                    Click on the next stage to update the order status. <strong className="font-black">Note:</strong> Once you update a status, you cannot go back.
                                                </p>
                                            </div>

                                            {/* Vertical Timeline */}
                                            <div className="relative pl-2 py-2">
                                                {/* Vertical Progress Line */}
                                                <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-gray-100 -z-0">
                                                    <div 
                                                        className="w-full bg-green-500 transition-all duration-1000 ease-in-out origin-top" 
                                                        style={{ height: `${(Math.max(0, currentIdx) / (Math.max(1, steps.length - 1))) * 100}%` }}
                                                    />
                                                </div>
                                                
                                                <div className="flex flex-col gap-4 relative z-10">
                                                    {steps.map((step, idx) => {
                                                        const isCompleted = idx <= currentIdx;
                                                        const isCurrent = idx === currentIdx;
                                                        
                                                        // Calculate time from history
                                                        const historyEntry = (order.trackingHistory || []).find(h => {
                                                            if (step.key === 'fabric-delivered') return ['fabric-ready-for-pickup', 'fabric-picked-up', 'fabric-delivered'].includes(h.status);
                                                            if (step.key === 'delivered') return h.status === 'delivered';
                                                            if (step.key === 'out-for-delivery') return h.status === 'out-for-delivery';
                                                            return h.status === step.key;
                                                        });
                                                        const timeStr = historyEntry ? new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);

                                                        const handleStepClick = () => {
                                                            if (updatingOrders[order._id]) return;
                                                            // Prevent backwards or redundant updates
                                                            if (idx <= currentIdx) return;
                                                            
                                                            // Enforce strictly sequential updates (only the next immediate stage)
                                                            if (idx !== currentIdx + 1) {
                                                                toast.error("Please update stages in sequential order.", {
                                                                    icon: '⚠️',
                                                                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                                                });
                                                                return;
                                                            }
                                                            
                                                            if (step.key === 'measurements-approved') {
                                                                toast.error("Waiting for customer to approve measurements.", {
                                                                    icon: '⏳',
                                                                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                                                });
                                                                return;
                                                            }
                                                            
                                                            if (step.key === 'ready-for-delivery' || step.key === 'ready-for-pickup') {
                                                                setDispatchOrder({ order, targetStatus: step.key });
                                                            } else {
                                                                handleStatusUpdate(order._id, step.key);
                                                            }
                                                        };

                                                        return (
                                                            <div key={step.key} className={`flex items-start gap-3 group ${idx <= currentIdx ? 'cursor-default' : 'cursor-pointer'}`} onClick={handleStepClick}>
                                                                {/* Dot / Icon Container */}
                                                                <div className={cn(
                                                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-700 bg-white border-2 shrink-0",
                                                                    isCompleted ? "border-green-500 text-green-500 shadow-sm" : "border-gray-200 text-gray-300 hover:border-[#843D9B] hover:text-[#843D9B]",
                                                                    isCurrent && "ring-4 ring-green-100 scale-110 z-20"
                                                                )}>
                                                                    {updatingOrders[order._id] && isCurrent ? (
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                                                                    ) : isCompleted ? (
                                                                        <Check size={14} strokeWidth={4} className="animate-in zoom-in duration-300" />
                                                                    ) : (
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                                    )}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 pt-0.5">
                                                                    <div className="flex justify-between items-center gap-2">
                                                                        <h4 className={cn(
                                                                            "text-[13px] font-black uppercase tracking-wide transition-colors duration-500",
                                                                            isCompleted ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"
                                                                        )}>
                                                                            {step.label}
                                                                        </h4>
                                                                        <p className={cn(
                                                                            "text-[10px] font-bold transition-opacity duration-500 flex items-center gap-1",
                                                                            isCompleted ? "text-gray-500 opacity-100" : "text-gray-300 opacity-100"
                                                                        )}>
                                                                            {timeStr ? (
                                                                                <>{timeStr}</>
                                                                            ) : (
                                                                                <span className="flex items-center gap-1"><Clock size={10} /> Pending</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    {isCurrent && step.key !== 'delivered' && (
                                                                        <p className="text-[10px] text-green-600 font-bold mt-1 animate-pulse">
                                                                            In progress...
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Production Notes Section */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">Production Notes</p>
                                <textarea
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    placeholder="Add a technical note for this order..."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-700 outline-none focus:border-[#843D9B] resize-none h-20"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => handleAddNote(order._id)}
                                        className="text-xs font-black text-[#843D9B] uppercase tracking-wider flex items-center gap-1"
                                    >
                                        + Add Note
                                    </button>
                                </div>

                                <div className="space-y-2 mt-2">
                                    {(productionNotes[order._id] || []).map((note, i) => (
                                        <div key={i} className="bg-red-50/50 border-l-4 border-[#843D9B] p-3 rounded-r-xl">
                                            <p className="text-[10px] font-bold text-[#843D9B]">{note.time}</p>
                                            <p className="text-[12px] text-gray-700 mt-0.5 leading-relaxed font-medium">{note.text}</p>
                                        </div>
                                    ))}
                                    {(!productionNotes[order._id] || productionNotes[order._id].length === 0) && (
                                        <p className="text-[11px] text-gray-400 italic">No notes added yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

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
                                    {item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.service?.image || item.service?.images?.[0] ? (
                                        <img src={item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.service?.image || item.service?.images?.[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <Scissors size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-[15px] font-black text-gray-900 leading-snug">{item.service?.title || 'Custom Garment'}</h4>
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
                                // Handle both plain object and possible Map (though lean() should make it an object)
                                const entries = Object.entries(
                                    measurements instanceof Map ? Object.fromEntries(measurements) : measurements
                                ).filter(([key]) => key !== 'type' && key !== 'slipImage' && key !== 'notes');

                                // We only return null if there is absolutely NO measurement data at all
                                if (entries.length === 0 && !measurements.slipImage && !measurements.type) return null;

                                return (
                                    <div key={idx} className="space-y-3">
                                        {order.items.length > 1 && (
                                            <p className="text-[10px] font-bold text-[#843D9B] uppercase tracking-wider">
                                                Item {idx + 1}: {item.service?.title || 'Custom Garment'}
                                            </p>
                                        )}
                                        
                                        {/* Measurement Type Badge */}
                                        {measurements.type && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[9px] font-black uppercase bg-indigo-50 text-[#843D9B] px-2.5 py-1 rounded-full border border-indigo-100">
                                                    {measurements.type === 'slip' ? '📎 Uploaded Slip' : 
                                                     measurements.type === 'saved' ? '💾 Saved Profile' : 
                                                     measurements.type === 'home' ? '🏠 Tailor at Home' : 
                                                     measurements.type === 'sample' ? '👕 Sample Garment' : 
                                                     '✏️ Self Measured'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Slip Image (if measurement was uploaded as slip) */}
                                        {measurements.slipImage && (
                                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Measurement Slip</p>
                                                <img 
                                                    src={measurements.slipImage} 
                                                    alt="Measurement Slip" 
                                                    className="w-full max-h-60 object-contain rounded-xl border border-gray-200"
                                                />
                                            </div>
                                        )}

                                        {/* Measurement Values Grid */}
                                        {entries.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {entries.map(([key, value]) => {
                                                    const isImage = typeof value === 'string' && (value.startsWith('data:image') || value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i));
                                                    return (
                                                        <div key={key} className={`bg-gray-50 rounded-xl p-3 border border-gray-100 ${isImage ? 'col-span-2' : ''}`}>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                                                            </p>
                                                            {isImage ? (
                                                                <img 
                                                                    src={value} 
                                                                    alt={key} 
                                                                    className="w-full max-h-60 object-contain rounded-xl border border-gray-200 mt-1 bg-white"
                                                                />
                                                            ) : (
                                                                <p className="text-[14px] font-black text-gray-900">
                                                                    {typeof value === 'number' ? `${value}"` : (typeof value === 'object' ? 'Configured' : (value || '—'))}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Customer Notes for this item */}
                                        {measurements.notes && (
                                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mt-2">
                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Customer Notes</p>
                                                <p className="text-[12px] text-gray-700 font-medium italic">"{measurements.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isPending && (
                        /* Special Instructions (Pending accept view) */
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
                    {order.pickupDeliveryOtp && order.pickupOtpVerified === false && ['ready-for-pickup', 'ready-for-delivery'].includes(order.status) && (
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
                    {order.dropoffDeliveryOtp && order.dropoffOtpVerified === false && ['fabric-picked-up'].includes(order.status) && (
                        <div className="mb-4 p-4 bg-green-50 rounded-3xl border border-green-100 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase text-green-700 tracking-wider">Delivery OTP</p>
                                <p className="text-[12px] text-gray-600 font-medium">Share with delivery partner to receive fabric</p>
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
                    })}

                    {(() => {
                        const isPickupPhaseStatus = ['fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status);
                        const isDropoffPhaseStatus = ['ready-for-delivery', 'out-for-delivery'].includes(order.status);
                        const hasActivePickupPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus);
                        const hasActiveDropoffPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.dropoffDeliveryStatus);
                        // Also show "Searching" state when partner has been notified (pending) but not yet accepted
                        const isSearchingPickup = order.pickupPartner && order.pickupDeliveryStatus === 'pending';
                        const isSearchingDropoff = order.dropoffPartner && order.dropoffDeliveryStatus === 'pending';

                        const shouldShowForPickup = (isPickupPhaseStatus || hasActivePickupPartner || isSearchingPickup) && order.fabricDeliveryPreference === 'partner';
                        const shouldShowForDropoff = isDropoffPhaseStatus || hasActiveDropoffPartner || isSearchingDropoff;

                        if (shouldShowForPickup || shouldShowForDropoff) {
                            return <LiveDeliveryTracker order={order} socket={socketInstance} />;
                        }
                        return null;
                    })()}

                    {isPending && (
                        /* Bottom Actions */
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
                    <h2 className="text-[18px] font-black text-gray-900 tracking-tight">New Orders</h2>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {filteredOrders.length} Pending
                    </span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Review and accept incoming tailoring tasks</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-2 md:px-0">
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
                        {['all', 'new', 'active', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                    activeTab === tab ? "bg-white text-[#843D9B] shadow-md shadow-black/5" : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                {tab === 'all' ? 'All' : tab === 'new' ? 'New' : tab === 'active' ? 'Active' : 'History'}
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
                            const isNew = order.status === 'pending';
                            return (
                                <div key={order._id} className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#843D9B]/10 transition-all flex flex-col group">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex flex-col gap-0.5 md:gap-1">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase bg-[#FDE5D2] text-[#843D9B] px-2 md:px-3 py-1 rounded-md md:rounded-lg border border-[#843D9B]/10 w-fit">
                                                #{order.orderId || 'ALT123456'}
                                            </span>
                                            <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-tighter">Received {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xs group-hover:scale-110 transition-transform">
                                            {order.customer?.name?.charAt(0) || 'C'}
                                        </div>
                                    </div>

                                    <h4 className="text-sm md:text-base font-black text-gray-900 leading-tight mb-3 md:mb-4">
                                        {order.customer?.name}
                                    </h4>

                                    <div className="flex-1 bg-gray-50 p-2.5 md:p-3 rounded-xl md:rounded-[1.5rem] border border-gray-100 mb-3 md:mb-5 flex items-center gap-2.5 md:gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100">
                                            {order.items?.[0]?.selectedFabric?.image || order.items?.[0]?.selectedFabric?.images?.[0] || order.items?.[0]?.service?.image || order.items?.[0]?.service?.images?.[0] ? (
                                                <img src={order.items[0].selectedFabric?.image || order.items[0].selectedFabric?.images?.[0] || order.items[0].service?.image || order.items[0].service?.images?.[0]} className="w-full h-full object-cover" />
                                            ) : (
                                                <Scissors size={16} className="md:w-[18px] md:h-[18px] text-[#843D9B]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] md:text-xs font-black text-gray-900 truncate">
                                                {order.items?.[0]?.service?.title || 'Custom Design'}
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
                                                const flow = order.fabricPickupRequired 
                                                    ? [
                                                        { current: 'measurements-approved', next: 'fabric-received', label: 'Receive Fabric' },
                                                        { current: 'fabric-delivered', next: 'fabric-received', label: 'Receive Fabric' },
                                                        { current: 'fabric-received', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'cutting', next: 'stitching', label: 'Start Stitching' },
                                                        { current: 'stitching', next: 'quality-check', label: 'Mark Completed' },
                                                        { current: 'quality-check', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready-for-delivery', next: 'out-for-delivery', label: 'Dispatch' }
                                                    ]
                                                    : [
                                                        { current: 'measurements-approved', next: 'fabric-received', label: 'Receive Fabric/Order' },
                                                        { current: 'accepted', next: 'fabric-received', label: 'Receive Fabric/Order' },
                                                        { current: 'fabric-received', next: 'cutting', label: 'Start Cutting' },
                                                        { current: 'cutting', next: 'stitching', label: 'Start Stitching' },
                                                        { current: 'stitching', next: 'quality-check', label: 'Mark Completed' },
                                                        { current: 'quality-check', next: 'ready-for-delivery', label: 'Mark Ready' },
                                                        { current: 'ready-for-delivery', next: 'out-for-delivery', label: 'Dispatch' }
                                                    ];
                                                
                                                // Handle intermediate statuses for flow
                                                let currentStatusForFlow = order.status;
                                                if (['fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status)) {
                                                    // While delivery driver is bringing fabric, next tailor action awaits delivery
                                                    currentStatusForFlow = 'fabric-delivered'; 
                                                }
 
                                                const nextStep = flow.find(f => f.current === currentStatusForFlow);
                                                
                                                return (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (nextStep) {
                                                                if (nextStep.current === 'quality-check' || order.status === 'ready-for-pickup' || order.status === 'ready-for-delivery') {
                                                                    setDispatchOrder({ order, targetStatus: nextStep.next });
                                                                } else {
                                                                    handleStatusUpdate(order._id, nextStep.next);
                                                                }
                                                            } else {
                                                                handleAction('View Detail', order);
                                                            }
                                                        }}
                                                        disabled={updatingOrders[order._id]}
                                                        className="flex-[1.5] py-2.5 md:py-3 bg-gray-900 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {updatingOrders[order._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : (nextStep ? nextStep.label : 'Update Status')}
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
                        onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }}
                    />
                    <div className="relative w-full max-w-xl bg-[#F5F5F5] h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col">
                        <OrderDetailModal 
                            order={selectedOrder} 
                            isOpen={isModalOpen} 
                            onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }} 
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

                            <button 
                                onClick={() => handleDispatchAction('shiprocket')}
                                disabled={isDispatching}
                                className="w-full p-4 border border-purple-100 bg-purple-50 hover:bg-purple-100 hover:border-purple-200 rounded-2xl flex items-center gap-4 transition-all text-left group disabled:opacity-60"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                                    {isDispatching && dispatchingMethod === 'shiprocket' ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <Package size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-purple-900 mb-0.5 group-hover:text-purple-700">Shiprocket Delivery</h4>
                                    <p className="text-[10px] font-bold text-purple-600/70">Handover to courier service for long distance.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
