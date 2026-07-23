import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Plus, Package, User, Phone, Ruler, ChevronDown, ChevronUp,
    IndianRupee, StickyNote, CheckCircle2, Clock
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const GARMENT_TYPES = ['Shirt', 'Pant', 'Suit', 'Kurta', 'Blouse', 'Skirt', 'Lehenga', 'Sherwani', 'Anarkali', 'Jacket/Blazer', 'Alteration'];

const MEASUREMENT_FIELDS = [
    { key: 'chest', label: 'Chest / Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'length', label: 'Length' },
    { key: 'neck', label: 'Neck' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'inseam', label: 'Inseam' },
];

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TABS = [
    { key: '', label: 'All' },
    ...STATUS_OPTIONS.map((s) => ({ key: s.value, label: s.label })),
];

const emptyForm = {
    offlineCustomer: '',
    garmentType: 'Shirt',
    totalAmount: '',
    advancePaid: '',
    status: 'pending',
    notes: '',
    measurementUnit: 'inches',
    measurements: Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, ''])),
};

const statusStyle = (status) => {
    switch (status) {
        case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
        case 'ready': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const paymentStyle = (status) => {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

const formatStatus = (status) =>
    (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AdminOfflineOrders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [prefillCustomerLabel, setPrefillCustomerLabel] = useState('');
    const [stats, setStats] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/admin/offline-orders/stats');
            if (res.data?.success) setStats(res.data.data);
        } catch {
            /* non-blocking */
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100 };
            if (statusFilter) params.status = statusFilter;
            if (searchQuery.trim()) params.search = searchQuery.trim();
            const customerId = searchParams.get('customer');
            if (customerId) params.offlineCustomer = customerId;

            const res = await api.get('/admin/offline-orders', { params });
            setOrders(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch offline orders:', error);
            toast.error('Failed to load offline orders');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchQuery, searchParams]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const t = setTimeout(fetchOrders, searchQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [fetchOrders, searchQuery]);

    // Prefill create modal when landing with ?customer= & ?new=1
    useEffect(() => {
        const customerId = searchParams.get('customer');
        const openNew = searchParams.get('new') === '1';
        if (!customerId || !openNew) return;

        (async () => {
            try {
                const res = await api.get(`/admin/offline-customers/${customerId}`);
                const c = res.data.data.customer;
                setFormData((prev) => ({ ...prev, offlineCustomer: c._id }));
                setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
                setCustomerOptions([{ _id: c._id, name: c.name, phone: c.phone }]);
                setIsModalOpen(true);
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('new');
                    return next;
                }, { replace: true });
            } catch {
                /* ignore */
            }
        })();
    }, [searchParams, setSearchParams]);

    const fetchCustomerOptions = async (term = '') => {
        setIsLoadingCustomers(true);
        try {
            const res = await api.get('/admin/offline-customers', {
                params: { isActive: 'true', limit: 30, ...(term ? { search: term } : {}) },
            });
            setCustomerOptions(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load customers');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const t = setTimeout(() => fetchCustomerOptions(customerSearch), customerSearch ? 250 : 0);
        return () => clearTimeout(t);
    }, [isModalOpen, customerSearch]);

    const openCreateModal = () => {
        const customerId = searchParams.get('customer');
        setFormData({
            ...emptyForm,
            offlineCustomer: customerId || '',
            measurements: Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, ''])),
        });
        setShowMeasurements(false);
        setCustomerSearch('');
        setPrefillCustomerLabel('');
        setIsModalOpen(true);
        if (customerId) {
            api.get(`/admin/offline-customers/${customerId}`)
                .then((res) => {
                    const c = res.data.data.customer;
                    setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
                    setCustomerOptions([{ _id: c._id, name: c.name, phone: c.phone }]);
                })
                .catch(() => {});
        }
    };

    const openDetail = async (order) => {
        try {
            const res = await api.get(`/admin/offline-orders/${order._id}`);
            setSelectedOrder(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load order');
        }
    };

    const buildMeasurementsPayload = () => {
        const out = {};
        MEASUREMENT_FIELDS.forEach(({ key }) => {
            const raw = formData.measurements[key];
            if (raw !== '' && raw !== null && raw !== undefined) {
                const n = Number(raw);
                if (!Number.isNaN(n) && n > 0) out[key] = n;
            }
        });
        return out;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.offlineCustomer) {
            toast.error('Select an offline customer');
            return;
        }
        const garmentType = (formData.garmentType || '').trim();
        if (!garmentType) {
            toast.error('Garment / service type is required');
            return;
        }
        const totalAmount = Number(formData.totalAmount);
        const advancePaid = Number(formData.advancePaid) || 0;
        if (Number.isNaN(totalAmount) || totalAmount < 0) {
            toast.error('Enter a valid price');
            return;
        }
        if (advancePaid < 0 || advancePaid > totalAmount) {
            toast.error('Advance must be between 0 and total price');
            return;
        }

        setIsSaving(true);
        try {
            await api.post('/admin/offline-orders', {
                offlineCustomer: formData.offlineCustomer,
                garmentType,
                totalAmount,
                advancePaid,
                status: formData.status,
                notes: formData.notes.trim(),
                measurementUnit: formData.measurementUnit,
                measurements: buildMeasurementsPayload(),
            });
            toast.success('Offline order created');
            setIsModalOpen(false);
            setFormData(emptyForm);
            fetchOrders();
            fetchStats();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to create order');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        if (!selectedOrder || selectedOrder.status === status) return;
        setIsUpdatingStatus(true);
        try {
            const res = await api.patch(`/admin/offline-orders/${selectedOrder._id}/status`, { status });
            setSelectedOrder(res.data.data);
            toast.success(`Status updated to ${formatStatus(status)}`);
            fetchOrders();
            fetchStats();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handlePaymentUpdate = async () => {
        if (!selectedOrder) return;
        const raw = window.prompt(
            'Update advance / amount received (₹)',
            String(selectedOrder.advancePaid || 0)
        );
        if (raw === null) return;
        const advancePaid = Number(raw);
        if (Number.isNaN(advancePaid) || advancePaid < 0) {
            toast.error('Invalid amount');
            return;
        }
        if (advancePaid > (selectedOrder.totalAmount || 0)) {
            toast.error('Advance cannot exceed total');
            return;
        }
        setIsUpdatingStatus(true);
        try {
            const res = await api.put(`/admin/offline-orders/${selectedOrder._id}`, { advancePaid });
            setSelectedOrder(res.data.data);
            toast.success('Payment updated');
            fetchOrders();
            fetchStats();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to update payment');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const customerFilterId = searchParams.get('customer');
    const measurementsMap =
        selectedOrder?.measurements instanceof Map
            ? Object.fromEntries(selectedOrder.measurements)
            : selectedOrder?.measurements || {};

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offline Orders</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Walk-in shop orders — separate from online marketplace orders
                    </p>
                    {customerFilterId && (
                        <button
                            onClick={() => {
                                setSearchParams({});
                            }}
                            className="mt-2 text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                        >
                            Clear customer filter
                        </button>
                    )}
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
                >
                    <Plus size={16} /> New Offline Order
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                        <p className="text-lg font-black text-primary mt-1">
                            ₹{(stats.totalRevenue || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected</p>
                        <p className="text-lg font-black text-gray-900 mt-1">
                            ₹{(stats.totalCollected || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                        <p className="text-lg font-black text-amber-600 mt-1">
                            ₹{(stats.pendingPayments || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders</p>
                        <p className="text-lg font-black text-gray-900 mt-1">{stats.totalOrders || 0}</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key || 'all'}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                                statusFilter === tab.key
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:w-64 w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search order, customer, garment..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative min-h-[280px]">
                {isLoading && (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3" />
                    </div>
                )}

                {!isLoading && orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 p-12">
                        <Package size={48} className="opacity-20" />
                        <p className="text-sm font-semibold">No offline orders found</p>
                        <p className="text-xs text-gray-400 text-center">
                            Create an order against an{' '}
                            <Link to="/admin/offline-customers" className="text-primary font-bold hover:underline">
                                offline customer
                            </Link>
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Garment</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => openDetail(order)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-primary">
                                                    {order.orderId}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleDateString()
                                                        : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">
                                                    {order.offlineCustomer?.name || '—'}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {order.offlineCustomer?.phone || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-700">{order.garmentType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-primary">
                                                ₹{(order.totalAmount || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${paymentStyle(order.paymentStatus)}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${statusStyle(order.status)}`}>
                                                {formatStatus(order.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail drawer */}
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
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                        Offline Order
                                    </p>
                                    <h2 className="text-xl font-black tracking-tight text-gray-900 mt-1">
                                        {selectedOrder.orderId}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                                        {selectedOrder.garmentType}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${statusStyle(selectedOrder.status)}`}>
                                            {formatStatus(selectedOrder.status)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${paymentStyle(selectedOrder.paymentStatus)}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl text-center">
                                        <IndianRupee size={18} className="mx-auto text-primary mb-1" />
                                        <p className="text-xl font-black text-gray-900">
                                            ₹{(selectedOrder.totalAmount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            Total
                                        </p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl text-center">
                                        <CheckCircle2 size={18} className="mx-auto text-primary mb-1" />
                                        <p className="text-xl font-black text-gray-900">
                                            ₹{(selectedOrder.advancePaid || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            Received
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs font-bold text-amber-800">
                                    Balance due: ₹
                                    {Math.max(
                                        0,
                                        (selectedOrder.totalAmount || 0) - (selectedOrder.advancePaid || 0)
                                    ).toLocaleString()}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} /> Customer
                                    </h3>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {selectedOrder.offlineCustomer?.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone size={14} className="text-primary" />
                                            {selectedOrder.offlineCustomer?.phone}
                                        </div>
                                        {selectedOrder.offlineCustomer?._id && (
                                            <Link
                                                to={`/admin/offline-customers`}
                                                className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline inline-block mt-1"
                                            >
                                                View in Offline Customers
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {Object.keys(measurementsMap).length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <Ruler size={12} /> Measurements ({selectedOrder.measurementUnit || 'inches'})
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(measurementsMap).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
                                                >
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        {key}
                                                    </p>
                                                    <p className="text-sm font-black text-gray-900">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedOrder.notes && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <StickyNote size={12} /> Notes
                                        </h3>
                                        <p className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                            {selectedOrder.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Update Status
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleStatusUpdate(opt.value)}
                                                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                    selectedOrder.status === opt.value
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedOrder.history?.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                            History
                                        </h3>
                                        <div className="space-y-2">
                                            {[...selectedOrder.history].reverse().map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="text-[10px] text-gray-500 border-l-2 border-primary/30 pl-3 py-1"
                                                >
                                                    <span className="font-bold text-gray-700">
                                                        {formatStatus(h.status)}
                                                    </span>
                                                    {h.message ? ` — ${h.message}` : ''}
                                                    <div className="text-gray-400 mt-0.5">
                                                        {h.timestamp
                                                            ? new Date(h.timestamp).toLocaleString()
                                                            : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white">
                                <button
                                    onClick={handlePaymentUpdate}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-widest disabled:opacity-60"
                                >
                                    Update Payment Received
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">
                                    New Offline Order
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 flex-1 overflow-y-auto space-y-5">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Offline Customer *
                                    </label>
                                    {prefillCustomerLabel && formData.offlineCustomer ? (
                                        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                                            <span className="text-sm font-bold text-gray-900 truncate">
                                                {prefillCustomerLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, offlineCustomer: '' });
                                                    setPrefillCustomerLabel('');
                                                }}
                                                className="text-[10px] font-bold text-primary uppercase shrink-0"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                placeholder="Search customer by name or phone..."
                                                className="w-full px-4 py-3 mb-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                            />
                                            <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                                                {isLoadingCustomers ? (
                                                    <p className="p-3 text-xs text-gray-400 text-center">Loading...</p>
                                                ) : customerOptions.length === 0 ? (
                                                    <p className="p-3 text-xs text-gray-400 text-center">
                                                        No customers —{' '}
                                                        <Link to="/admin/offline-customers" className="text-primary font-bold">
                                                            add one
                                                        </Link>
                                                    </p>
                                                ) : (
                                                    customerOptions.map((c) => (
                                                        <button
                                                            key={c._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, offlineCustomer: c._id });
                                                                setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors ${
                                                                formData.offlineCustomer === c._id
                                                                    ? 'bg-primary/10 font-bold'
                                                                    : 'font-medium text-gray-700'
                                                            }`}
                                                        >
                                                            {c.name}
                                                            <span className="text-[10px] text-gray-400 ml-2">{c.phone}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Garment / Service *
                                    </label>
                                    <div className="space-y-2">
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                list="garment-options-list"
                                                value={formData.garmentType}
                                                onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                                                placeholder="Type or pick garment / service (e.g. Shirt, Alteration)..."
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary pr-28"
                                                required
                                            />
                                            <select
                                                value={GARMENT_TYPES.includes(formData.garmentType) ? formData.garmentType : ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setFormData({ ...formData, garmentType: e.target.value });
                                                    }
                                                }}
                                                className="absolute right-2 px-2 py-1.5 text-xs font-bold bg-gray-100 border border-gray-200 rounded-lg text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition-colors max-w-[105px]"
                                            >
                                                <option value="">Category</option>
                                                {GARMENT_TYPES.map((g) => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <datalist id="garment-options-list">
                                            {GARMENT_TYPES.map((g) => (
                                                <option key={g} value={g} />
                                            ))}
                                        </datalist>

                                        {/* Quick selection chips */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span className="text-[10px] text-gray-400 font-semibold mr-1">Quick Select:</span>
                                            {GARMENT_TYPES.slice(0, 7).map((g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, garmentType: g })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                                                        formData.garmentType === g
                                                            ? 'bg-primary text-white font-bold shadow-sm'
                                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-primary/50 font-medium'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={formData.totalAmount}
                                            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Advance Received (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={formData.advancePaid}
                                            onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Initial Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                    >
                                        {STATUS_OPTIONS.filter((s) => s.value !== 'cancelled').map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Measurements (optional, same fields as ME / tailor) */}
                                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowMeasurements((v) => !v)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-bold text-gray-700"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Ruler size={14} className="text-primary" />
                                            Measurements (optional)
                                        </span>
                                        {showMeasurements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {showMeasurements && (
                                        <div className="p-4 space-y-3">
                                            <div className="flex gap-2">
                                                {['inches', 'cm'].map((u) => (
                                                    <button
                                                        key={u}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, measurementUnit: u })}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                            formData.measurementUnit === u
                                                                ? 'bg-primary text-white border-primary'
                                                                : 'bg-white text-gray-500 border-gray-200'
                                                        }`}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {MEASUREMENT_FIELDS.map((field) => (
                                                    <div key={field.key}>
                                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                            {field.label}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={formData.measurements[field.key]}
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    measurements: {
                                                                        ...formData.measurements,
                                                                        [field.key]: e.target.value,
                                                                    },
                                                                })
                                                            }
                                                            placeholder="0.0"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Fabric, design notes, due date..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {isSaving ? 'Creating...' : 'Create Order'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOfflineOrders;
