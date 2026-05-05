import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Building2, User, Phone, Mail, Package, ChevronRight, Clock, Info, CheckCircle2, AlertCircle, DollarSign, FileText, Scissors } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const statusConfig = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50', label: 'New Lead' },
    reviewing: { color: 'text-blue-500', bg: 'bg-blue-50', label: 'Reviewing' },
    quoted: { color: 'text-purple-500', bg: 'bg-purple-50', label: 'Quoted' },
    accepted: { color: 'text-green-500', bg: 'bg-green-50', label: 'Awaiting Assignment' },
    'accepted-by-tailor': { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Master Tailor Assigned' },
    'fabric-ready-for-pickup': { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Fabric Scheduled' },
    'in-production': { color: 'text-[#2D2F6E]', bg: 'bg-indigo-50', label: 'In Production' },
    'ready-for-pickup': { color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Quality Checked' },
    shipped: { color: 'text-sky-600', bg: 'bg-sky-50', label: 'In Transit' },
    delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Finalized' },
    rejected: { color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-100', label: 'Cancelled' }
};

const AdminBulkOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isQuoting, setIsQuoting] = useState(false);
    const [tailors, setTailors] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [quoteDraft, setQuoteDraft] = useState({
        pricePerUnit: '',
        totalAmount: '',
        depositPercentage: '20',
        depositRequired: '',
        adminNotes: ''
    });

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, tailorsRes, deliveryRes] = await Promise.all([
                api.get('/bulk-orders'),
                api.get('/admin/users?role=tailor'),
                api.get('/admin/delivery-partners')
            ]);
            setOrders(ordersRes.data.data);
            setTailors(tailorsRes.data.data);
            setDeliveryPartners(deliveryRes.data.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/bulk-orders/${orderId}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchOrders();
            if (selectedOrder?._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleSendQuote = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/bulk-orders/${selectedOrder._id}`, {
                status: 'quoted',
                quote: {
                    ...quoteDraft,
                    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days valid
                },
                message: "Quote sent to customer for review."
            });
            toast.success('Quote sent successfully!');
            fetchOrders();
            setIsQuoting(false);
            setSelectedOrder(null);
        } catch (error) {
            toast.error('Failed to send quote');
        }
    };

    const filteredOrders = orders.filter(o =>
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bulk Inquiries</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage wholesale, corporate, and school orders</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search organization or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                        />
                    </div>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl border border-transparent transition-all"
                >
                    <Clock size={18} />
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-4">Inquiry details</th>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Inquiry Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4 h-16 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredOrders.map((order) => {
                                const config = statusConfig[order.status] || statusConfig.pending;
                                return (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-primary uppercase">{order.orderId}</span>
                                                <span className="text-[10px] text-gray-900 font-bold mt-0.5">{order.serviceType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900">{order.organizationName || 'Individual'}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{order.contactPerson}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{order.estimatedQuantity} Units</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight size={18} className="text-gray-300 ml-auto group-hover:text-primary transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                                        Bulk ID: {selectedOrder.orderId}
                                    </h2>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1">Wholesale Inquiry Received</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 border border-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* Lead Details */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Building2 size={12} /> Contact Information
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Company</p>
                                            <p className="text-xs font-black text-gray-900">{selectedOrder.organizationName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Point of Contact</p>
                                            <p className="text-xs font-black text-gray-900">{selectedOrder.contactPerson}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={12} className="text-gray-300" />
                                            <p className="text-xs font-bold text-gray-600">{selectedOrder.phoneNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail size={12} className="text-gray-300" />
                                            <p className="text-xs font-bold text-gray-600 truncate">{selectedOrder.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Location */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Info size={12} /> Service Location
                                    </h3>
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-50 text-blue-500">
                                            <Building2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 leading-tight">{selectedOrder.location.address}</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">
                                                {selectedOrder.location.city}, {selectedOrder.location.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Request */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Package size={12} /> Inquiry details
                                    </h3>
                                    <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm space-y-5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xl font-black text-gray-900 leading-none">{selectedOrder.serviceType}</p>
                                                <p className="text-[10px] font-bold text-primary uppercase mt-2 tracking-widest">{selectedOrder.orderType} Usage</p>
                                            </div>
                                            <div className="text-right bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                                <p className="text-lg font-black text-gray-900">{selectedOrder.estimatedQuantity}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Units</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Fabric Preference</p>
                                                <p className="text-xs font-black text-gray-900 capitalize">{selectedOrder.fabricPreference.replace(/-/g, ' ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Measurement Method</p>
                                                <p className="text-xs font-black text-primary capitalize">{selectedOrder.measurementMethod.replace(/-/g, ' ')}</p>
                                            </div>
                                        </div>

                                        {/* Size Distribution Grid (Admin view) */}
                                        {selectedOrder.measurementMethod === 'standard-sizes' && selectedOrder.sizeDistribution && (
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Requested Size Breakdown</p>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {Object.entries(selectedOrder.sizeDistribution).map(([size, qty]) => (
                                                        <div key={size} className="text-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                            <p className="text-[9px] font-black text-gray-400 mb-0.5">{size}</p>
                                                            <p className="text-xs font-black text-gray-900">{qty || 0}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.notes && (
                                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                                                <p className="text-[9px] font-black text-amber-600 uppercase mb-1.5 flex items-center gap-1.5"><FileText size={10} /> Client Special Instructions</p>
                                                <p className="text-[11px] text-gray-700 font-medium leading-relaxed">"{selectedOrder.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quoting Area (Only if Send Quote is active) */}
                                <AnimatePresence>
                                    {isQuoting ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] space-y-4"
                                        >
                                            <div className="flex items-center gap-2 text-primary">
                                                <DollarSign size={18} strokeWidth={3} />
                                                <h3 className="text-sm font-black uppercase tracking-widest">Create Formal Quote</h3>
                                            </div>
                                            <form onSubmit={handleSendQuote} className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Price / Unit (₹)</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="0.00"
                                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                            value={quoteDraft.pricePerUnit}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                const total = price * selectedOrder.estimatedQuantity;
                                                                const deposit = (total * (parseFloat(quoteDraft.depositPercentage) || 0)) / 100;
                                                                setQuoteDraft({
                                                                    ...quoteDraft,
                                                                    pricePerUnit: e.target.value,
                                                                    totalAmount: total.toString(),
                                                                    depositRequired: Math.round(deposit).toString()
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Total Quote (₹)</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="Calculated"
                                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                            value={quoteDraft.totalAmount}
                                                            onChange={(e) => {
                                                                const total = parseFloat(e.target.value) || 0;
                                                                const deposit = (total * (parseFloat(quoteDraft.depositPercentage) || 0)) / 100;
                                                                setQuoteDraft({
                                                                    ...quoteDraft,
                                                                    totalAmount: e.target.value,
                                                                    depositRequired: Math.round(deposit).toString()
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Deposit %</label>
                                                        <input
                                                            type="number"
                                                            placeholder="20"
                                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                            value={quoteDraft.depositPercentage}
                                                            onChange={(e) => {
                                                                const percent = parseFloat(e.target.value) || 0;
                                                                const total = parseFloat(quoteDraft.totalAmount) || 0;
                                                                const deposit = (total * percent) / 100;
                                                                setQuoteDraft({
                                                                    ...quoteDraft,
                                                                    depositPercentage: e.target.value,
                                                                    depositRequired: Math.round(deposit).toString()
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Security Deposit (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Security fee"
                                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                            value={quoteDraft.depositRequired}
                                                            onChange={(e) => setQuoteDraft({ ...quoteDraft, depositRequired: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Admin Remarks</label>
                                                    <textarea
                                                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-primary/20 resize-none h-16"
                                                        placeholder="Fabric details, timeline etc."
                                                        value={quoteDraft.adminNotes}
                                                        onChange={(e) => setQuoteDraft({ ...quoteDraft, adminNotes: e.target.value })}
                                                    ></textarea>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Send Quote</button>
                                                    <button type="button" onClick={() => setIsQuoting(false)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        selectedOrder.status === 'pending' || selectedOrder.status === 'reviewing' ? (
                                            <button
                                                onClick={() => setIsQuoting(true)}
                                                className="w-full py-5 bg-primary text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                                            >
                                                <DollarSign size={20} />
                                                Create Professional Quote
                                            </button>
                                        ) : (
                                            selectedOrder.quote && (
                                                <div className="bg-purple-50 border border-purple-100 p-6 rounded-[2rem] space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-purple-600">
                                                            <DollarSign size={18} strokeWidth={3} />
                                                            <h3 className="text-sm font-black uppercase tracking-widest">Existing Quote</h3>
                                                        </div>
                                                        <span className="text-[10px] font-black text-purple-400 uppercase bg-white px-3 py-1 rounded-full">{selectedOrder.status}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Unit Price</p>
                                                            <p className="text-sm font-black text-purple-700">₹{selectedOrder.quote.pricePerUnit}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Total Quote</p>
                                                            <p className="text-sm font-black text-purple-700">₹{selectedOrder.quote.totalAmount}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )
                                    )}
                                </AnimatePresence>

                                {/* Professional Assignment Section */}
                                {['accepted', 'accepted-by-tailor', 'fabric-ready-for-pickup', 'in-production'].includes(selectedOrder.status) && (
                                    <div className="bg-green-50/50 border border-green-100 p-6 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <Building2 size={18} strokeWidth={3} />
                                            <h3 className="text-sm font-black uppercase tracking-widest">Assign Professionals</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5">Assign Tailor (Master Craftsman)</label>
                                                    <div className="relative">
                                                        <Scissors size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <select
                                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500/20 appearance-none transition-all cursor-pointer"
                                                            value={selectedOrder.tailor?._id || selectedOrder.tailor || ''}
                                                            onChange={async (e) => {
                                                                const tailorId = e.target.value;
                                                                try {
                                                                    await api.put(`/bulk-orders/${selectedOrder._id}`, {
                                                                        tailor: tailorId,
                                                                        status: 'accepted-by-tailor',
                                                                        message: "Master Tailor assigned to Bulk Production."
                                                                    });
                                                                    toast.success('Tailor assigned successfully');
                                                                    fetchOrders();
                                                                    setSelectedOrder(prev => ({ ...prev, tailor: tailorId, status: 'accepted-by-tailor' }));
                                                                } catch (err) {
                                                                    toast.error('Assignment failed');
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select Tailor Shop</option>
                                                            {tailors.map(t => (
                                                                <option key={t._id} value={t._id}>{t.name} - {t.profile?.shopName || 'Shop'}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5">Assign Logistics Partner</label>
                                                    <div className="relative">
                                                        <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <select
                                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500/20 appearance-none transition-all cursor-pointer"
                                                            value={selectedOrder.deliveryPartner?._id || selectedOrder.deliveryPartner || ''}
                                                            onChange={async (e) => {
                                                                const riderId = e.target.value;
                                                                try {
                                                                    await api.put(`/bulk-orders/${selectedOrder._id}`, {
                                                                        deliveryPartner: riderId,
                                                                        status: 'fabric-ready-for-pickup',
                                                                        message: "Logistics partner assigned for material pickup."
                                                                    });
                                                                    toast.success('Rider assigned successfully');
                                                                    fetchOrders();
                                                                    setSelectedOrder(prev => ({ ...prev, deliveryPartner: riderId, status: 'fabric-ready-for-pickup' }));
                                                                } catch (err) {
                                                                    toast.error('Assignment failed');
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select Delivery Partner</option>
                                                            {deliveryPartners.map(d => (
                                                                <option key={d._id} value={d._id}>{d.name} ({d.isActive ? 'Online' : 'Offline'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="space-y-4 px-2">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inquiry Timeline</h3>
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                        {[...selectedOrder.history].reverse().map((h, i) => (
                                            <div key={i} className="pl-6 relative">
                                                <div className="absolute left-[5px] top-2 h-2 w-2 rounded-full bg-gray-200 border-2 border-white" />
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{h.status}</p>
                                                    <p className="text-[9px] text-gray-300 font-bold">{new Date(h.timestamp).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{h.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Status Footer */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder._id, 'reviewing')}
                                    className="py-3 px-4 border border-blue-100 text-blue-600 bg-blue-50/30 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    Mark as Reviewing
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                                    className="py-3 px-4 border border-gray-100 text-gray-400 bg-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                                >
                                    Reject Inquiry
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminBulkOrders;
