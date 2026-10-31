import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, X, Building2, User, Phone, Mail, Package,
    ChevronRight, RefreshCw, Info, CheckCircle2, AlertCircle, DollarSign,
    FileText, Scissors, Plus, Calendar, MapPin, Sparkles, Layers,
    Check, ArrowRight, Clock, ShieldCheck
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const statusConfig = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50', label: 'New Lead' },
    reviewing: { color: 'text-blue-500', bg: 'bg-blue-50', label: 'Reviewing' },
    quoted: { color: 'text-purple-500', bg: 'bg-purple-50', label: 'Quoted' },
    accepted: { color: 'text-green-500', bg: 'bg-green-50', label: 'Awaiting Assignment' },
    'accepted-by-tailor': { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Master Tailor Assigned' },
    'fabric-ready-for-pickup': { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Fabric Scheduled' },
    'in-production': { color: 'text-[#843D9B]', bg: 'bg-indigo-50', label: 'In Production' },
    'ready-for-pickup': { color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Quality Checked' },
    shipped: { color: 'text-sky-600', bg: 'bg-sky-50', label: 'In Transit' },
    delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Finalized' },
    rejected: { color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-100', label: 'Cancelled' }
};

const initialFormData = {
    customerId: null,
    organizationName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    orderType: 'corporate',
    serviceType: '',
    estimatedQuantity: 20,
    fabricPreference: 'platform-provided',
    expectedDeliveryDate: '',
    address: '',
    city: '',
    pincode: '',
    measurementMethod: 'standard-sizes',
    sizeDistribution: { S: 5, M: 5, L: 5, XL: 5, XXL: 0 },
    notes: '',
    // Direct Quote
    includeQuote: false,
    pricePerUnit: '',
    totalAmount: '',
    depositPercentage: '20',
    depositRequired: '',
    adminNotes: '',
    // Initial assignment
    tailor: '',
    status: 'pending'
};

const AdminBulkOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isQuoting, setIsQuoting] = useState(false);
    const [tailors, setTailors] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    
    // Create Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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
            setOrders(ordersRes.data.data || []);
            setTailors(tailorsRes.data.data || []);
            setDeliveryPartners(deliveryRes.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Search Customers for Bulk Order Creation
    useEffect(() => {
        if (!customerSearch.trim()) {
            setCustomerResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingCustomers(true);
            try {
                const res = await api.get('/admin/users', {
                    params: { role: 'customer', search: customerSearch.trim(), limit: 10 }
                });
                const users = res.data?.data?.users || res.data?.data || res.data?.users || [];
                setCustomerResults(users);
            } catch (err) {
                console.error("Failed to search customers:", err);
            } finally {
                setIsSearchingCustomers(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [customerSearch]);

    const handleSelectCustomer = (cust) => {
        setSelectedCustomer(cust);
        setFormData(prev => ({
            ...prev,
            customerId: cust._id,
            contactPerson: cust.name || '',
            phoneNumber: cust.phoneNumber || '',
            email: cust.email || '',
            organizationName: cust.profile?.organizationName || prev.organizationName || ''
        }));
        setCustomerResults([]);
        setCustomerSearch('');
    };

    const handleClearSelectedCustomer = () => {
        setSelectedCustomer(null);
        setFormData(prev => ({
            ...prev,
            customerId: null
        }));
    };

    // Calculate sum of sizes
    const totalSizesCount = Object.values(formData.sizeDistribution || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);

    const handleSizeChange = (sizeKey, val) => {
        const numVal = Math.max(0, parseInt(val) || 0);
        const updatedSizes = { ...formData.sizeDistribution, [sizeKey]: numVal };
        const newTotal = Object.values(updatedSizes).reduce((acc, v) => acc + (Number(v) || 0), 0);
        
        setFormData(prev => ({
            ...prev,
            sizeDistribution: updatedSizes,
            estimatedQuantity: newTotal > 0 ? newTotal : prev.estimatedQuantity
        }));
    };

    const handleQuoteCalculation = (unitPriceStr, qty = formData.estimatedQuantity) => {
        const unit = parseFloat(unitPriceStr) || 0;
        const total = unit * (parseFloat(qty) || 0);
        const depPct = parseFloat(formData.depositPercentage) || 20;
        const deposit = (total * depPct) / 100;

        setFormData(prev => ({
            ...prev,
            pricePerUnit: unitPriceStr,
            totalAmount: total > 0 ? total.toString() : '',
            depositRequired: Math.round(deposit).toString()
        }));
    };

    const handleCreateBulkOrder = async (e) => {
        e.preventDefault();

        if (!formData.contactPerson.trim()) {
            toast.error('Contact Person name is required');
            return;
        }
        if (!formData.phoneNumber.trim()) {
            toast.error('Phone number is required');
            return;
        }
        if (!formData.serviceType.trim()) {
            toast.error('Garment / Service type is required (e.g., School Uniform)');
            return;
        }
        if (Number(formData.estimatedQuantity) < 10) {
            toast.error('Minimum bulk quantity is 10 units');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                customerId: formData.customerId,
                organizationName: formData.organizationName,
                contactPerson: formData.contactPerson,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                orderType: formData.orderType,
                serviceType: formData.serviceType,
                estimatedQuantity: Number(formData.estimatedQuantity),
                fabricPreference: formData.fabricPreference,
                expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
                location: {
                    address: formData.address || 'Address provided by phone',
                    city: formData.city || 'Local City',
                    pincode: formData.pincode || '110001'
                },
                measurementMethod: formData.measurementMethod,
                sizeDistribution: formData.sizeDistribution,
                notes: formData.notes,
                quote: formData.includeQuote && formData.totalAmount ? {
                    pricePerUnit: Number(formData.pricePerUnit) || 0,
                    totalAmount: Number(formData.totalAmount) || 0,
                    depositRequired: Number(formData.depositRequired) || 0,
                    adminNotes: formData.adminNotes || 'Created and quoted directly by Admin'
                } : undefined,
                tailor: formData.tailor || undefined,
                status: formData.status
            };

            const res = await api.post('/bulk-orders', payload);
            toast.success(`Bulk Order ${res.data?.data?.orderId || 'Created'} successfully!`);
            
            setIsCreateModalOpen(false);
            setFormData(initialFormData);
            setSelectedCustomer(null);
            setCreateStep(1);
            
            await fetchOrders();
            if (res.data?.data) {
                setSelectedOrder(res.data.data);
            }
        } catch (err) {
            console.error("Bulk Order creation error:", err);
            toast.error(err.response?.data?.message || 'Failed to create bulk order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/bulk-orders/${orderId}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchOrders();
            if (selectedOrder?._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to update status');
        }
    };

    const handleSendQuote = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/bulk-orders/${selectedOrder._id}`, {
                status: 'quoted',
                quote: {
                    pricePerUnit: parseFloat(quoteDraft.pricePerUnit),
                    totalAmount: parseFloat(quoteDraft.totalAmount),
                    depositRequired: parseFloat(quoteDraft.depositRequired),
                    adminNotes: quoteDraft.adminNotes
                },
                message: `Quotation sent: ₹${quoteDraft.totalAmount} with deposit ₹${quoteDraft.depositRequired}.`
            });
            toast.success('Quote generated and sent to customer');
            setIsQuoting(false);
            fetchOrders();
            setSelectedOrder(prev => ({
                ...prev,
                status: 'quoted',
                quote: {
                    pricePerUnit: parseFloat(quoteDraft.pricePerUnit),
                    totalAmount: parseFloat(quoteDraft.totalAmount),
                    depositRequired: parseFloat(quoteDraft.depositRequired),
                    adminNotes: quoteDraft.adminNotes
                }
            }));
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to send quote');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesQuery = (
            (o.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto flex flex-col min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                Bulk Orders & Corporate
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                    {orders.length} Inquiries
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Manage school uniforms, institutional stitching, corporate wear & high-volume production
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setFormData(initialFormData);
                            setCreateStep(1);
                            setIsCreateModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Create Bulk Order</span>
                    </button>
                    <button
                        onClick={fetchOrders}
                        title="Refresh list"
                        className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl border border-gray-200 transition-all"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by organization, contact person, ID or garment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs font-bold text-gray-600 bg-gray-50 border border-transparent rounded-xl px-3 py-2 outline-none cursor-pointer focus:bg-white focus:border-gray-200"
                        >
                            <option value="all">All Statuses ({orders.length})</option>
                            <option value="pending">New Leads</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="quoted">Quoted</option>
                            <option value="accepted-by-tailor">Master Tailor Assigned</option>
                            <option value="in-production">In Production</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled / Rejected</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length > 0 && (
                    <span className="text-[11px] font-bold text-gray-400 self-center">
                        Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                )}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-4">Inquiry Details</th>
                                <th className="px-6 py-4">Organization / Client</th>
                                <th className="px-6 py-4">Quantity & Sizes</th>
                                <th className="px-6 py-4">Target Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Assigned Tailor</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-4 h-16 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-16">
                                        <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm font-bold text-gray-700">No bulk orders found</p>
                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or click "Create Bulk Order" to add one.</p>
                                    </td>
                                </tr>
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
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-black text-primary uppercase">{order.orderId}</span>
                                                    {order.createdByAdmin && (
                                                        <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200">
                                                            <Sparkles size={9} /> Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-900 font-bold mt-0.5">{order.serviceType}</span>
                                                <span className="text-[10px] text-gray-400 capitalize">{order.orderType} • {order.fabricPreference?.replace('-', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900">{order.organizationName || 'Direct Client'}</span>
                                                <span className="text-[11px] text-gray-600 font-medium">{order.contactPerson}</span>
                                                <span className="text-[10px] text-gray-400">{order.phoneNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-900">{order.estimatedQuantity} Units</span>
                                                <span className="text-[10px] text-gray-400 capitalize">{order.measurementMethod?.replace('-', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                            {order.expectedDeliveryDate ? (
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Calendar size={13} className="text-primary" />
                                                    <span>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                            {order.quote?.totalAmount && (
                                                <p className="text-[10px] font-black text-purple-700 mt-1">₹{order.quote.totalAmount.toLocaleString()}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.tailor ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                                    <Scissors size={13} className="text-indigo-500" />
                                                    <span>{order.tailor.shopName || order.tailor.name || 'Assigned'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    Unassigned
                                                </span>
                                            )}
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

            {/* ═══ CREATE BULK ORDER MODAL (ADMIN) ═══ */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-6 bg-gradient-to-r from-primary/10 via-purple-50 to-white border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-black text-gray-900">Create Bulk Order</h2>
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                                    Admin Portal
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium">Place an institutional or high-volume tailoring order directly</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Step Indicators */}
                                <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/50">
                                    <button
                                        type="button"
                                        onClick={() => setCreateStep(1)}
                                        className={`py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                            createStep === 1 ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                            createStep === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>1</span>
                                        Client Info
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateStep(2)}
                                        className={`py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                            createStep === 2 ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                            createStep === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>2</span>
                                        Garment & Sizes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateStep(3)}
                                        className={`py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                            createStep === 3 ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                            createStep === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>3</span>
                                        Pricing & Assignment
                                    </button>
                                </div>

                                <form onSubmit={handleCreateBulkOrder}>
                                    <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
                                        {/* STEP 1: CLIENT & CONTACT INFO */}
                                        {createStep === 1 && (
                                            <div className="space-y-4">
                                                {/* Search Registered Customer */}
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1.5">
                                                        Select Registered Customer (Optional)
                                                    </label>
                                                    {selectedCustomer ? (
                                                        <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200 rounded-2xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center">
                                                                    {selectedCustomer.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-900">{selectedCustomer.name}</p>
                                                                    <p className="text-[10px] text-gray-500">{selectedCustomer.phoneNumber} • {selectedCustomer.email}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleClearSelectedCustomer}
                                                                className="text-xs font-bold text-red-500 hover:underline px-2 py-1"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Type customer name, phone or email to autofill..."
                                                                value={customerSearch}
                                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-primary focus:bg-white transition-all"
                                                            />
                                                            {isSearchingCustomers && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                                    Searching...
                                                                </div>
                                                            )}

                                                            {customerResults.length > 0 && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-gray-50">
                                                                    {customerResults.map(cust => (
                                                                        <div
                                                                            key={cust._id}
                                                                            onClick={() => handleSelectCustomer(cust)}
                                                                            className="p-3 hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-colors"
                                                                        >
                                                                            <div>
                                                                                <p className="text-xs font-bold text-gray-800">{cust.name}</p>
                                                                                <p className="text-[10px] text-gray-400">{cust.phoneNumber} • {cust.email}</p>
                                                                            </div>
                                                                            <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                                                Select
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Organization / Company Name <span className="text-gray-400">(Optional)</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. St. Xavier School, TechCorp Ltd."
                                                            value={formData.organizationName}
                                                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Contact Person Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. Rajesh Sharma"
                                                            value={formData.contactPerson}
                                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Phone Number *
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            placeholder="10 digit phone number"
                                                            value={formData.phoneNumber}
                                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Email Address
                                                        </label>
                                                        <input
                                                            type="email"
                                                            placeholder="client@organization.com"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Delivery Location */}
                                                <div className="pt-2 border-t border-gray-100">
                                                    <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                                                        <MapPin size={14} className="text-primary" /> Delivery Destination
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="sm:col-span-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Street Address / Office Premises"
                                                                value={formData.address}
                                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <input
                                                                type="text"
                                                                placeholder="City (e.g. Jaipur, Delhi, Mumbai)"
                                                                value={formData.city}
                                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder="Pincode"
                                                                value={formData.pincode}
                                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: GARMENT, SIZES & FABRIC */}
                                        {createStep === 2 && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Order Category / Type *
                                                        </label>
                                                        <select
                                                            value={formData.orderType}
                                                            onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        >
                                                            <option value="corporate">Corporate Wear / Uniforms</option>
                                                            <option value="school">School Uniforms</option>
                                                            <option value="event">Wedding / Event Troupe</option>
                                                            <option value="wholesale">Wholesale / Boutique Stock</option>
                                                            <option value="other">Other Bulk Production</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Garment / Service Description *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. Formal Shirts & Trousers, Navy Blazers"
                                                            value={formData.serviceType}
                                                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Fabric Preference
                                                        </label>
                                                        <select
                                                            value={formData.fabricPreference}
                                                            onChange={(e) => setFormData({ ...formData, fabricPreference: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        >
                                                            <option value="platform-provided">Sewzella Sourced Fabric (Platform)</option>
                                                            <option value="customer-provided">Customer Provides Material</option>
                                                            <option value="open-to-suggestions">Open to Suggestions / Sample Review</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                            Target Delivery Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={formData.expectedDeliveryDate}
                                                            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Measurement Method & Size Distribution */}
                                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                        <div>
                                                            <label className="text-xs font-black uppercase text-gray-700 tracking-wider">
                                                                Standard Size Distribution
                                                            </label>
                                                            <p className="text-[10px] text-gray-400">Total units calculated from sizes: <span className="font-bold text-primary">{totalSizesCount}</span></p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Total Quantity:</label>
                                                            <input
                                                                type="number"
                                                                min="10"
                                                                value={formData.estimatedQuantity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 10;
                                                                    setFormData({ ...formData, estimatedQuantity: val });
                                                                    if (formData.includeQuote && formData.pricePerUnit) {
                                                                        handleQuoteCalculation(formData.pricePerUnit, val);
                                                                    }
                                                                }}
                                                                className="w-20 p-1.5 bg-white border border-gray-300 rounded-lg text-xs font-black text-center"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-5 gap-2 pt-1">
                                                        {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                                            <div key={size} className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Size {size}</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={formData.sizeDistribution[size] || 0}
                                                                    onChange={(e) => handleSizeChange(size, e.target.value)}
                                                                    className="w-full text-center text-xs font-black outline-none border-b border-transparent focus:border-primary"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                                        Production Notes & Fitting Instructions
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Specify logos, embroidery positions, pocket types, special threads, or packaging requirements..."
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:bg-white resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3: QUOTE & ASSIGNMENT */}
                                        {createStep === 3 && (
                                            <div className="space-y-5">
                                                {/* Direct Quote Toggle */}
                                                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign size={18} className="text-primary" />
                                                            <div>
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Include Direct Quotation</h4>
                                                                <p className="text-[10px] text-gray-500 font-medium">Set the agreed rate and required advance deposit immediately</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.includeQuote}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        includeQuote: checked,
                                                                        status: checked ? 'quoted' : 'pending'
                                                                    }));
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                        </label>
                                                    </div>

                                                    {formData.includeQuote && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-purple-100">
                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">
                                                                    Price Per Unit (₹)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="e.g. 450"
                                                                    value={formData.pricePerUnit}
                                                                    onChange={(e) => handleQuoteCalculation(e.target.value)}
                                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">
                                                                    Total Quote (₹)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Auto calculated"
                                                                    value={formData.totalAmount}
                                                                    onChange={(e) => {
                                                                        const tot = e.target.value;
                                                                        const dep = ((parseFloat(tot) || 0) * (parseFloat(formData.depositPercentage) || 20)) / 100;
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            totalAmount: tot,
                                                                            depositRequired: Math.round(dep).toString()
                                                                        }));
                                                                    }}
                                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">
                                                                    Advance Deposit (₹)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="e.g. 2000"
                                                                    value={formData.depositRequired}
                                                                    onChange={(e) => setFormData({ ...formData, depositRequired: e.target.value })}
                                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Direct Master Tailor Assignment */}
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1.5 flex items-center gap-1.5">
                                                        <Scissors size={14} className="text-indigo-600" />
                                                        Assign Master Craftsman / Tailor (Optional)
                                                    </label>
                                                    <select
                                                        value={formData.tailor}
                                                        onChange={(e) => {
                                                            const tailorId = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                tailor: tailorId,
                                                                status: tailorId ? 'accepted-by-tailor' : (prev.includeQuote ? 'quoted' : 'pending')
                                                            }));
                                                        }}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white cursor-pointer"
                                                    >
                                                        <option value="">Leave Unassigned (Assign later)</option>
                                                        {tailors.map(t => (
                                                            <option key={t._id} value={t._id}>
                                                                {t.name} — {t.profile?.shopName || 'Boutique'} ({t.phoneNumber || 'No phone'})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Initial Status Selection */}
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1.5">
                                                        Initial Order Status
                                                    </label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white cursor-pointer"
                                                    >
                                                        <option value="pending">New Lead (Pending Review)</option>
                                                        <option value="reviewing">In Review (Technical Check)</option>
                                                        <option value="quoted">Quoted (Sent to Client)</option>
                                                        <option value="accepted-by-tailor">Accepted & Assigned to Tailor</option>
                                                        <option value="in-production">Direct In-Production</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer Controls */}
                                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                        {createStep > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setCreateStep(createStep - 1)}
                                                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                ← Back
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsCreateModalOpen(false)}
                                                className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {createStep < 3 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (createStep === 1) {
                                                        if (!formData.contactPerson.trim() || !formData.phoneNumber.trim()) {
                                                            toast.error('Please fill Contact Person and Phone Number');
                                                            return;
                                                        }
                                                    }
                                                    setCreateStep(createStep + 1);
                                                }}
                                                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                                            >
                                                <span>Continue</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <RefreshCw size={14} className="animate-spin" />
                                                        <span>Creating Order...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={16} />
                                                        <span>Create Bulk Order</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ SIDEBAR DRAWER (ORDER DETAILS) ═══ */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight">{selectedOrder.orderId}</h2>
                                        {selectedOrder.createdByAdmin && (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                                                Admin Created
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                                        {selectedOrder.organizationName || 'Individual Inquiry'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 border border-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Lead Contact Info */}
                                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                                            {selectedOrder.contactPerson?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-gray-900">{selectedOrder.contactPerson}</h3>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedOrder.orderType} Category</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{selectedOrder.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 truncate">
                                            <Mail size={14} className="text-gray-400" />
                                            <span className="truncate">{selectedOrder.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Requirements Card */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Order Requirements</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 border border-gray-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Garment Type</p>
                                            <p className="text-xs font-black text-gray-800 mt-0.5">{selectedOrder.serviceType}</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Estimated Quantity</p>
                                            <p className="text-xs font-black text-primary mt-0.5">{selectedOrder.estimatedQuantity} Units</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Fabric Source</p>
                                            <p className="text-xs font-black text-gray-800 mt-0.5 capitalize">{selectedOrder.fabricPreference?.replace('-', ' ')}</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Delivery Target</p>
                                            <p className="text-xs font-black text-gray-800 mt-0.5">
                                                {selectedOrder.expectedDeliveryDate ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString() : 'Immediate'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location details */}
                                    {selectedOrder.location && (
                                        <div className="p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl flex items-start gap-2 text-xs font-medium text-gray-600">
                                            <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-gray-800">Delivery Address</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {selectedOrder.location.address}, {selectedOrder.location.city} - {selectedOrder.location.pincode}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Size Matrix */}
                                    {selectedOrder.sizeDistribution && (
                                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Standard Sizes Distribution</p>
                                            <div className="flex gap-2">
                                                {Object.entries(selectedOrder.sizeDistribution).map(([size, count]) => (
                                                    <div key={size} className="flex-1 bg-white p-2 rounded-xl border border-gray-100 text-center">
                                                        <span className="text-[9px] font-bold text-gray-400 block">{size}</span>
                                                        <span className="text-xs font-black text-gray-800">{count || 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedOrder.notes && (
                                        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-1">
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Client Instructions</p>
                                            <p className="text-xs text-gray-700 font-medium">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quotation Engine */}
                                <AnimatePresence>
                                    {isQuoting ? (
                                        <motion.form
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            onSubmit={handleSendQuote}
                                            className="bg-purple-50/50 border border-purple-100 p-6 rounded-[2rem] space-y-4"
                                        >
                                            <div className="flex items-center gap-2 text-primary">
                                                <DollarSign size={18} strokeWidth={3} />
                                                <h3 className="text-sm font-black uppercase tracking-widest">Create Formal Quote</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Unit Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        placeholder="450"
                                                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                        value={quoteDraft.pricePerUnit}
                                                        onChange={(e) => {
                                                            const unit = parseFloat(e.target.value) || 0;
                                                            const total = unit * (selectedOrder.estimatedQuantity || 1);
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
                                                        required
                                                        placeholder="Calculated"
                                                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                                        value={quoteDraft.depositRequired}
                                                        onChange={(e) => setQuoteDraft({ ...quoteDraft, depositRequired: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Admin Remarks</label>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Terms: Fabric verification, lead time 15 days..."
                                                    className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                                                    value={quoteDraft.adminNotes}
                                                    onChange={(e) => setQuoteDraft({ ...quoteDraft, adminNotes: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    Send Quote
                                                </button>
                                                <button type="button" onClick={() => setIsQuoting(false)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        selectedOrder.status === 'pending' || selectedOrder.status === 'reviewing' ? (
                                            <button
                                                onClick={() => setIsQuoting(true)}
                                                className="w-full py-4 border-2 border-dashed border-primary/20 rounded-[2rem] flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all"
                                            >
                                                <DollarSign size={20} />
                                                Create Professional Quote
                                            </button>
                                        ) : (
                                            selectedOrder.quote && (
                                                <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-[2rem] space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2 text-primary">
                                                            <DollarSign size={18} strokeWidth={3} />
                                                            <h3 className="text-sm font-black uppercase tracking-widest">Active Quote</h3>
                                                        </div>
                                                        <span className="text-[10px] font-black text-purple-600 uppercase bg-white px-3 py-1 rounded-full border border-purple-100">
                                                            {selectedOrder.status}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Unit Price</p>
                                                            <p className="text-sm font-black text-primary">₹{selectedOrder.quote.pricePerUnit}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Total Quote</p>
                                                            <p className="text-sm font-black text-primary">₹{selectedOrder.quote.totalAmount?.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Deposit Required</p>
                                                            <p className="text-xs font-bold text-gray-800">₹{selectedOrder.quote.depositRequired?.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] text-purple-400 font-bold uppercase">Payment Status</p>
                                                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                                {selectedOrder.paymentStatus || 'pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )
                                    )}
                                </AnimatePresence>

                                {/* Tailor & Delivery Assignment Section */}
                                <div className="bg-green-50/40 border border-green-100 p-6 rounded-[2rem] space-y-4">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <Building2 size={18} strokeWidth={3} />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Production Assignment</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-500 uppercase block mb-1.5">Master Tailor / Workshop</label>
                                            <div className="relative">
                                                <Scissors size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500/20 appearance-none transition-all cursor-pointer"
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
                                                        <option key={t._id} value={t._id}>{t.name} - {t.profile?.shopName || 'Workshop'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-black text-gray-500 uppercase block mb-1.5">Logistics & Delivery Partner</label>
                                            <div className="relative">
                                                <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-500/20 appearance-none transition-all cursor-pointer"
                                                    value={selectedOrder.deliveryPartner?._id || selectedOrder.deliveryPartner || ''}
                                                    onChange={async (e) => {
                                                        const riderId = e.target.value;
                                                        try {
                                                            await api.put(`/bulk-orders/${selectedOrder._id}`, {
                                                                deliveryPartner: riderId,
                                                                status: 'fabric-ready-for-pickup',
                                                                message: "Logistics partner assigned for material pickup."
                                                            });
                                                            toast.success('Delivery partner assigned successfully');
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

                                {/* Timeline */}
                                <div className="space-y-4 px-2">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inquiry Timeline</h3>
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                        {[...(selectedOrder.history || [])].reverse().map((h, i) => (
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
