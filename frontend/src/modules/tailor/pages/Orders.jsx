import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Check, X, Scissors, Layers, CheckCircle2, Truck, Phone, MapPin, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../../../utils/cn';

const Orders = () => {
    const { user } = useTailorAuth();
    const location = useLocation();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('new');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Production Notes State for Active Orders
    const [productionNotes, setProductionNotes] = useState({});
    const [noteInput, setNoteInput] = useState('');

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

    const handleStatusUpdate = async (orderId, status) => {
        try {
            const response = await api.patch(`/tailors/orders/${orderId}/status`, { status });
            if (response.data.success) {
                if (status === 'accepted') {
                    setActiveTab('active');
                } else {
                    fetchOrders();
                }
                
                if (selectedOrder && selectedOrder._id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    useEffect(() => {
        const socket = io(SOCKET_URL);
        if (user?._id) socket.emit('join', `user_${user._id}`);
        socket.on('new_order', () => { if (activeTab === 'new') fetchOrders(); });
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

        return (
            <div className="fixed inset-0 z-[60] bg-[#F5F5F5] flex flex-col animate-in fade-in duration-200 overflow-y-auto pb-24">
                {/* Header */}
                <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                    <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-[17px] font-black text-[#2D2F6E] tracking-tight">SEWZELLA</h1>
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
                        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${isPending ? 'bg-red-50 text-[#2D2F6E]' : 'bg-green-50 text-green-600'}`}>
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
                                    <button className="w-10 h-10 bg-[#FDE5D2] border border-[#2D2F6E]/20 text-[#2D2F6E] rounded-2xl flex items-center justify-center">
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                                <div className="pt-3 border-t border-gray-50 flex items-start gap-2">
                                    <MapPin size={16} className="text-[#2D2F6E] mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[12px] text-gray-700 font-medium leading-relaxed">
                                            {[order.deliveryAddress?.street, order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.zipCode].filter(Boolean).join(', ')}
                                        </p>
                                        <button className="text-[11px] font-black text-[#2D2F6E] uppercase tracking-wider mt-1 block">View Map</button>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder matching Figma */}
                            <div className="bg-white rounded-3xl p-4 border border-gray-100">
                                <div className="bg-gray-200 h-44 rounded-2xl relative overflow-hidden flex items-center justify-center">
                                    {/* Map Graphic Mock */}
                                    <div className="absolute inset-0 bg-[#E2E8F0] opacity-80" />
                                    <div className="relative w-12 h-12 bg-[#FDE5D2] border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                        <MapPin size={24} className="text-[#2D2F6E]" />
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

                            {/* Production Status Stepper */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100">
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-6">Production Status</p>
                                {(() => {
                                    const steps = [
                                        { key: 'accepted',         label: 'Received' },
                                        { key: 'cutting',          label: 'Cutting'  },
                                        { key: 'stitching',        label: 'Stitching'},
                                        { key: 'ready-for-pickup', label: 'Ready'    },
                                    ];
                                    const currentIdx = steps.findIndex(s => s.key === order.status);
                                    return (
                                        <div className="flex items-center justify-between relative">
                                            {/* Connector line */}
                                            <div className="absolute top-5 left-5 right-5 h-1 bg-gray-100 z-0" />
                                            <div
                                                className="absolute top-5 left-5 h-1 bg-[#2D2F6E] z-0 transition-all duration-500"
                                                style={{ width: currentIdx < 0 ? '0%' : `${(currentIdx / (steps.length - 1)) * 100}%` }}
                                            />
                                            {steps.map((step, idx) => {
                                                const done   = currentIdx > idx;
                                                const active = currentIdx === idx;
                                                return (
                                                    <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                                                        <button 
                                                            onClick={() => handleStatusUpdate(order._id, step.key)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                done   ? 'bg-[#2D2F6E] border-[#2D2F6E]' :
                                                                active ? 'bg-white border-[#2D2F6E] shadow-md' :
                                                                         'bg-white border-gray-200'
                                                            }`}
                                                        >
                                                            {done
                                                                ? <Check size={16} strokeWidth={3} className="text-white" />
                                                                : <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-[#2D2F6E]' : 'bg-gray-200'}`} />
                                                            }
                                                        </button>
                                                        <span className={`text-[10px] font-black uppercase tracking-wide ${
                                                            active ? 'text-[#2D2F6E]' : 'text-gray-400'
                                                        }`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
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
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-700 outline-none focus:border-[#2D2F6E] resize-none h-20"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => handleAddNote(order._id)}
                                        className="text-xs font-black text-[#2D2F6E] uppercase tracking-wider flex items-center gap-1"
                                    >
                                        + Add Note
                                    </button>
                                </div>

                                <div className="space-y-2 mt-2">
                                    {(productionNotes[order._id] || []).map((note, i) => (
                                        <div key={i} className="bg-red-50/50 border-l-4 border-[#2D2F6E] p-3 rounded-r-xl">
                                            <p className="text-[10px] font-bold text-[#2D2F6E]">{note.time}</p>
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
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Order Items ({order.items?.length || 0})</p>
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.selectedFabric?.image || item.selectedFabric?.images?.[0] ? (
                                        <img src={item.selectedFabric?.image || item.selectedFabric?.images?.[0]} className="w-full h-full object-cover" />
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
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${item.deliveryType === 'express' ? 'bg-red-50 text-[#2D2F6E] border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {item.deliveryType || 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Customer Measurements Section */}
                    {order.items?.some(item => {
                        const m = item.measurements;
                        if (!m) return false;
                        if (m instanceof Map) return m.size > 0;
                        return Object.keys(m).length > 0;
                    }) && (
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">📐 Customer Measurements</p>
                                <span className="text-[9px] font-black uppercase bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100">Provided</span>
                            </div>
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
                                            <p className="text-[10px] font-bold text-[#2D2F6E] uppercase tracking-wider">
                                                Item {idx + 1}: {item.service?.title || 'Custom Garment'}
                                            </p>
                                        )}
                                        
                                        {/* Measurement Type Badge */}
                                        {measurements.type && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[9px] font-black uppercase bg-indigo-50 text-[#2D2F6E] px-2.5 py-1 rounded-full border border-indigo-100">
                                                    {measurements.type === 'slip' ? '📎 Uploaded Slip' : measurements.type === 'saved' ? '💾 Saved Profile' : '✏️ Self Measured'}
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
                        <div className="bg-[#1A1A1A] text-white rounded-3xl p-5 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="text-red-400">ℹ️</span> Special Instructions
                            </p>
                            <p className="text-[12px] text-gray-200 leading-relaxed font-medium">
                                "Please ensure optimal fitting around the waist. Use premium thread. Customer has requested delivery before weekend."
                            </p>
                        </div>
                    )}

                    {isPending && (
                        /* Bottom Actions for Pending Order */
                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-[#F5F5F5] pb-4 z-10">
                            <button 
                                onClick={() => handleAction('Reject Order', order)}
                                className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 text-xs font-black uppercase rounded-2xl active:scale-95 transition-all shadow-sm"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => { handleAction('Accept Order', order); onClose(); }}
                                className="flex-[2] py-4 bg-[#2D2F6E] text-white text-xs font-black uppercase rounded-2xl shadow-lg shadow-[#2D2F6E]/25 active:scale-95 transition-all flex items-center justify-center gap-1"
                            >
                                Accept Order
                            </button>
                        </div>
                    )}

                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#2D2F6E] selection:text-white">
            
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
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#2D2F6E] text-[12px] text-gray-900 shadow-sm"
                        />
                    </div>

                    <div className="flex bg-gray-200/50 rounded-2xl p-1 gap-1">
                        {['new', 'active', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    activeTab === tab ? "bg-white text-[#2D2F6E] shadow-md shadow-black/5" : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                {tab === 'new' ? 'New' : tab === 'active' ? 'Active' : 'History'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="h-8 w-8 border-[3px] border-[#2D2F6E] border-t-transparent rounded-full animate-spin"></div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredOrders.map((order) => {
                            const isNew = order.status === 'pending';
                            return (
                                <div key={order._id} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#2D2F6E]/10 transition-all flex flex-col group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase bg-[#FDE5D2] text-[#2D2F6E] px-3 py-1 rounded-lg border border-[#2D2F6E]/10 w-fit">
                                                #{order.orderId || 'ALT123456'}
                                            </span>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Received {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xs group-hover:scale-110 transition-transform">
                                            {order.customer?.name?.charAt(0) || 'C'}
                                        </div>
                                    </div>

                                    <h4 className="text-base font-black text-gray-900 leading-tight mb-4">
                                        {order.customer?.name}
                                    </h4>

                                    <div className="flex-1 bg-gray-50 p-3 rounded-[1.5rem] border border-gray-100 mb-5 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100">
                                            {order.items?.[0]?.selectedFabric?.image ? (
                                                <img src={order.items[0].selectedFabric.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <Scissors size={18} className="text-[#2D2F6E]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-900 truncate">
                                                {order.items?.[0]?.service?.title || 'Custom Design'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-gray-400">
                                                <MapPin size={10} className="shrink-0" />
                                                <p className="text-[10px] font-bold truncate">
                                                    {order.deliveryAddress?.street || 'Local Pick-up'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAction('View Detail', order)}
                                            className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                        >
                                            Details
                                        </button>
                                        {isNew ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                                className="flex-[1.5] py-3 bg-[#2D2F6E] rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-[#2D2F6E]/20 hover:bg-[#1e1f4a] active:scale-95 transition-all"
                                            >
                                                Accept Order
                                            </button>
                                        ) : (
                                            (() => {
                                                const flow = [
                                                    { current: 'accepted', next: 'cutting', label: 'Start Cutting' },
                                                    { current: 'cutting', next: 'stitching', label: 'Start Stitching' },
                                                    { current: 'stitching', next: 'ready-for-pickup', label: 'Mark Ready' }
                                                ];
                                                const nextStep = flow.find(f => f.current === order.status);
                                                
                                                return (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (nextStep) {
                                                                handleStatusUpdate(order._id, nextStep.next);
                                                            } else {
                                                                handleAction('View Detail', order);
                                                            }
                                                        }}
                                                        className="flex-[1.5] py-3 bg-gray-900 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black active:scale-95 transition-all"
                                                    >
                                                        {nextStep ? nextStep.label : 'Update Status'}
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
        </div>
    );
};

export default Orders;
