import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ClipboardList,
    Building2,
    Calendar,
    Clock,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Info,
    MoreHorizontal,
    Search,
    Filter,
    Sparkles,
    X,
    FileText,
    Scissors
} from 'lucide-react';
import api from '../../../utils/api';

const statusConfig = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50', icon: <Clock size={14} />, label: 'Lead Received' },
    reviewing: { color: 'text-blue-500', bg: 'bg-blue-50', icon: <Search size={14} />, label: 'Reviewing' },
    quoted: { color: 'text-purple-500', bg: 'bg-purple-50', icon: <ClipboardList size={14} />, label: 'Quote Ready' },
    accepted: { color: 'text-green-500', bg: 'bg-green-50', icon: <CheckCircle2 size={14} />, label: 'Accepted' },
    'in-production': { color: 'text-[#2D2F6E]', bg: 'bg-indigo-50', icon: <MoreHorizontal size={14} />, label: 'In Production' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 size={14} />, label: 'Delivered' },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-100', icon: <AlertCircle size={14} />, label: 'Closed' }
};

const MyBulkOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/bulk-orders/my');
                setOrders(res.data.data);
            } catch (error) {
                console.error('Failed to fetch bulk orders:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-[#2D2F6E] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-10">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-all active:scale-90"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0 leading-none">
                    <h1 className="text-base font-black text-gray-900 truncate">Bulk Orders</h1>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Wholesale Tracking</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-4">
                {/* Search / Filter Placeholder - Compact */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input
                            type="text"
                            placeholder="Search inquiry ID..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-medium outline-none"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400">
                        <Filter size={14} />
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <ClipboardList size={28} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">No Bulk Inquiries Found</h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Scale your team's look Today</p>
                        <button
                            onClick={() => navigate('/bulk-order')}
                            className="mt-8 px-8 py-3 bg-[#2D2F6E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#2D2F6E]/20"
                        >
                            Start First Bulk Request
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {orders.map((order) => {
                            const config = statusConfig[order.status] || statusConfig.pending;
                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl shadow-gray-200/40 border border-white group relative overflow-hidden cursor-pointer"
                                >
                                    {/* Quote Available Badge - Compact Version */}
                                    {order.status === 'quoted' && (
                                        <div className="absolute top-0 right-0 p-1.5 px-3 bg-gradient-to-l from-[#2D2F6E] to-[#ff8da8] text-white rounded-bl-xl shadow-md z-10 transition-transform group-hover:scale-105">
                                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                                                <Sparkles size={8} /> Quote Ready
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 border border-gray-50 shrink-0">
                                            <Building2 size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black text-gray-900 leading-none truncate mb-0.5">{order.organizationName || order.contactPerson}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tight">#{order.orderId.slice(-6)}</span>
                                                <div className={`px-1.5 py-0.5 rounded-md flex items-center gap-1 ${config.bg} ${config.color} border border-current/5`}>
                                                    {React.cloneElement(config.icon, { size: 8 })}
                                                    <span className="text-[6px] font-black uppercase tracking-tight">{config.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                                        <div className="bg-gray-50/30 px-2 py-1.5 rounded-lg border border-gray-50/50 flex justify-between items-center">
                                            <span className="text-[6px] text-gray-400 font-black uppercase tracking-tight">Item</span>
                                            <span className="text-[8px] font-black text-gray-900 truncate max-w-[50%]">{order.serviceType}</span>
                                        </div>
                                        <div className="bg-gray-50/30 px-2 py-1.5 rounded-lg border border-gray-50/50 flex justify-between items-center">
                                            <span className="text-[6px] text-gray-400 font-black uppercase tracking-tight">Units</span>
                                            <span className="text-[8px] font-black text-gray-900">{order.estimatedQuantity}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="text-gray-300" size={8} />
                                            <span className="text-[7px] font-bold text-gray-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[#2D2F6E]">
                                            <ChevronRight size={10} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Detail Drawer */}
                <AnimatePresence>
                    {selectedOrder && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                                onClick={() => setSelectedOrder(null)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 top-16 sm:top-20 bg-white rounded-t-[2.5rem] sm:rounded-t-[3rem] z-[70] flex flex-col overflow-hidden shadow-2xl"
                            >
                                {/* Drawer Header - Compact */}
                                <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            {selectedOrder.orderId}
                                            <span className={`px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] uppercase tracking-widest font-black border ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                                                {statusConfig[selectedOrder.status].label}
                                            </span>
                                        </h2>
                                        <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Submitted: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 sm:p-2.5 bg-white text-gray-400 border border-gray-100 rounded-full shadow-sm"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Drawer Body - Compact */}
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20 scrollbar-hide">

                                    {/* Quote Section (if available) */}
                                    {selectedOrder.status === 'quoted' && selectedOrder.quote && (
                                        <section className="bg-gradient-to-br from-[#2D2F6E]/10 to-indigo-50 p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] border border-[#2D2F6E]/20 shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                                            <div className="absolute -right-4 -top-4 w-20 sm:w-24 h-20 sm:h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                            <h3 className="text-[10px] sm:text-sm font-black uppercase text-[#2D2F6E] tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 italic">
                                                <div className="px-1.5 py-0.5 bg-[#2D2F6E] rounded text-white italic scale-x-[-1]">
                                                    <FileText size={10} strokeWidth={3} />
                                                </div>
                                                Official Quote
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
                                                <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#2D2F6E]/10">
                                                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 sm:mb-1.5">Unit Price</p>
                                                    <p className="text-md sm:text-xl font-black text-gray-900 tracking-tight">₹{selectedOrder.quote.pricePerUnit.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#2D2F6E]/10">
                                                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 sm:mb-1.5">Total Quote</p>
                                                    <p className="text-md sm:text-xl font-black text-[#2D2F6E] tracking-tight">₹{selectedOrder.quote.totalAmount.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-[#2D2F6E]/20 flex flex-col items-center justify-center col-span-2 mt-2 shadow-inner bg-indigo-50/30">
                                                    <p className="text-[10px] text-[#2D2F6E] font-black uppercase tracking-[0.2em] mb-1">Security Deposit Required</p>
                                                    <p className="text-2xl sm:text-3xl font-black text-[#2D2F6E] tracking-tighter">₹{selectedOrder.quote.depositRequired?.toLocaleString() || '0'}</p>
                                                    <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest text-center">Pay this amount to confirm your order & start production</p>
                                                </div>
                                            </div>
                                            {selectedOrder.quote.adminNotes && (
                                                <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white text-[10px] text-gray-600 font-medium leading-relaxed italic text-center">
                                                    " {selectedOrder.quote.adminNotes} "
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* Location Section */}
                                    <section className="space-y-2">
                                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <Building2 size={12} className="text-[#2D2F6E]" /> Service Location
                                        </h3>
                                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-50">
                                                <Info size={14} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-800 leading-snug">{selectedOrder.location.address}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{selectedOrder.location.city}, {selectedOrder.location.pincode}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Measurement Details */}
                                    <section className="space-y-3">
                                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <Scissors size={12} className="text-[#2D2F6E]" /> Measurement Strategy
                                        </h3>
                                        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm border-l-4 border-l-[#2D2F6E]">
                                            <p className="text-[10px] font-black text-gray-900 uppercase mb-1">
                                                {selectedOrder.measurementMethod === 'standard-sizes' ? 'Standard Sizing' :
                                                    selectedOrder.measurementMethod === 'custom-sheet' ? 'Custom Measurement Sheet' :
                                                        'On-site Professional Measurement'}
                                            </p>
                                            <p className="text-[9px] text-gray-400 font-medium leading-tight mb-4">
                                                {selectedOrder.measurementMethod === 'standard-sizes' ? 'We will stitch based on the size distribution provided below.' :
                                                    selectedOrder.measurementMethod === 'custom-sheet' ? 'Customer will provide an Excel/CSV sheet with detailed body measurements.' :
                                                        'Silaiwala will send a professional tailor to the customer location for measurements.'}
                                            </p>

                                            {selectedOrder.measurementMethod === 'standard-sizes' && selectedOrder.sizeDistribution && (
                                                <div className="grid grid-cols-5 gap-1.5 p-2 bg-gray-50 rounded-xl">
                                                    {Object.entries(selectedOrder.sizeDistribution).map(([size, qty]) => (
                                                        qty > 0 && (
                                                            <div key={size} className="text-center bg-white py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                                <p className="text-[8px] font-black text-[#2D2F6E] mb-0.5">{size}</p>
                                                                <p className="text-[10px] font-black text-gray-900">{qty}</p>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Request Section */}
                                    <section className="space-y-3">
                                        <h3 className="text-[9px] sm:text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <ClipboardList size={12} className="text-[#2D2F6E]" /> Requirements
                                        </h3>
                                        <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <p className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-none mb-1.5 truncate">{selectedOrder.serviceType}</p>
                                                    <p className="text-[9px] sm:text-[11px] font-bold text-[#2D2F6E] uppercase tracking-[0.2em] italic">{selectedOrder.orderType} Category</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-md sm:text-lg font-black text-gray-900 leading-none">{selectedOrder.estimatedQuantity}</p>
                                                    <p className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Units</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gray-50 w-full" />
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-50 rounded-lg text-[#2D2F6E]">
                                                    <Info size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fabric Choice</p>
                                                    <p className="text-[10px] font-bold text-gray-700 capitalize">{selectedOrder.fabricPreference.replace(/-/g, ' ')}</p>
                                                </div>
                                            </div>
                                            {selectedOrder.notes && (
                                                <div className="p-3.5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <FileText size={10} /> My Notes
                                                    </p>
                                                    <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                                                        "{selectedOrder.notes}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Bottom Action (if quoted) */}
                                {selectedOrder.status === 'quoted' && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 sm:gap-4">
                                        <button
                                            onClick={() => navigate('/checkout/summary', { state: { bulkOrderId: selectedOrder._id } })}
                                            className="flex-1 py-3.5 sm:py-4 bg-[#2D2F6E] text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                                        >
                                            Accept Quote & Pay
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Info Card - Compact */}
                <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/30 flex flex-col sm:flex-row items-center gap-4 mx-1">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#2D2F6E] shrink-0">
                        <Info size={20} />
                    </div>
                    <div className="text-center sm:text-left">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">About Bulk Pricing</h4>
                        <p className="text-[9px] text-gray-500 font-medium leading-tight">
                            Orders are manually reviewed. Once quoted, approve to start production.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyBulkOrders;
