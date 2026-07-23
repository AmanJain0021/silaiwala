import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Plus, Edit2, User, MapPin, Phone, ShoppingBag,
    CheckCircle2, Ban, FileText, StickyNote, IndianRupee, Ruler, ScanSearch
} from 'lucide-react';
import api from '../../../utils/api';
import { getOfflineStatusLabel, offlineStatusStyle } from '../constants/offlineOrderStatus';
import { toast } from 'react-hot-toast';

const emptyForm = { name: '', phone: '', address: '', notes: '' };
const emptyMeasurementForm = {
    label: '',
    garmentType: '',
    unit: 'inches',
    notes: '',
    measurements: {
        chest: '',
        waist: '',
        hips: '',
        shoulder: '',
        length: '',
        neck: '',
        sleeve: '',
        inseam: '',
    },
};

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
];

const AdminOfflineCustomers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailOrders, setDetailOrders] = useState([]);
    const [detailStats, setDetailStats] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lookupPhone, setLookupPhone] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);
    const [measurementForm, setMeasurementForm] = useState(emptyMeasurementForm);
    const [savedMeasurements, setSavedMeasurements] = useState([]);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100 };
            if (selectedTab === 'active') params.isActive = 'true';
            if (selectedTab === 'inactive') params.isActive = 'false';
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await api.get('/admin/offline-customers', { params });
            setCustomers(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch offline customers:', error);
            toast.error('Failed to load offline customers');
        } finally {
            setIsLoading(false);
        }
    }, [selectedTab, searchQuery]);

    useEffect(() => {
        const t = setTimeout(fetchCustomers, searchQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [fetchCustomers, searchQuery]);

    const openDetail = async (customer) => {
        setSelectedCustomer(customer);
        setDetailOrders([]);
        setDetailStats(null);
        setIsDetailLoading(true);
        try {
            const res = await api.get(`/admin/offline-customers/${customer._id}`);
            setSelectedCustomer(res.data.data.customer);
            setDetailOrders(res.data.data.orders || []);
            setDetailStats(res.data.data.stats || null);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load customer details');
        } finally {
            setIsDetailLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        setFormData(emptyForm);
        setSavedMeasurements([]);
        setMeasurementForm(emptyMeasurementForm);
        setIsModalOpen(true);
    };

    const openEditModal = (customer, e) => {
        e?.stopPropagation();
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            address: customer.address || '',
            notes: customer.notes || '',
        });
        setSavedMeasurements(customer.savedMeasurements || []);
        setMeasurementForm(emptyMeasurementForm);
        setIsModalOpen(true);
    };

    const handleLookup = async () => {
        if (!lookupPhone.trim()) {
            toast.error('Enter a phone number to search');
            return;
        }

        setIsLookingUp(true);
        try {
            const res = await api.get('/admin/offline-customers/lookup', {
                params: { phone: lookupPhone.trim() },
            });
            setLookupResult(res.data);
            if (res.data?.found && res.data?.data?.customer) {
                toast.success('Offline customer found');
                await openDetail(res.data.data.customer);
            } else {
                toast('No offline customer found. You can create one below.', { icon: 'ℹ️' });
                setEditingCustomer(null);
                setFormData((prev) => ({ ...prev, phone: lookupPhone.trim() }));
                setSavedMeasurements([]);
                setMeasurementForm(emptyMeasurementForm);
                setIsModalOpen(true);
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Lookup failed');
        } finally {
            setIsLookingUp(false);
        }
    };

    const addMeasurementProfile = () => {
        if (!measurementForm.garmentType.trim()) {
            toast.error('Garment type is required for measurement profile');
            return;
        }

        const normalizedMeasurements = Object.fromEntries(
            Object.entries(measurementForm.measurements)
                .filter(([, value]) => value !== '')
                .map(([key, value]) => [key, Number(value)])
                .filter(([, value]) => !Number.isNaN(value))
        );

        setSavedMeasurements((prev) => ([
            ...prev,
            {
                label: measurementForm.label.trim(),
                garmentType: measurementForm.garmentType.trim(),
                unit: measurementForm.unit,
                notes: measurementForm.notes.trim(),
                measurements: normalizedMeasurements,
                createdAt: new Date().toISOString(),
            },
        ]));
        setMeasurementForm(emptyMeasurementForm);
    };

    const removeMeasurementProfile = (index) => {
        setSavedMeasurements((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.phone.trim()) {
            toast.error('Name and phone are required');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                notes: formData.notes.trim(),
                savedMeasurements,
            };

            if (editingCustomer) {
                await api.put(`/admin/offline-customers/${editingCustomer._id}`, payload);
                toast.success('Offline customer updated');
            } else {
                await api.post('/admin/offline-customers', payload);
                toast.success('Offline customer added');
            }

            setIsModalOpen(false);
            setFormData(emptyForm);
            setEditingCustomer(null);
            fetchCustomers();

            if (selectedCustomer && editingCustomer && selectedCustomer._id === editingCustomer._id) {
                openDetail({ _id: editingCustomer._id });
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to save customer');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (customer) => {
        setIsUpdating(true);
        try {
            if (customer.isActive) {
                await api.delete(`/admin/offline-customers/${customer._id}`);
                toast.success('Customer deactivated');
            } else {
                await api.put(`/admin/offline-customers/${customer._id}`, { isActive: true });
                toast.success('Customer reactivated');
            }
            fetchCustomers();
            if (selectedCustomer?._id === customer._id) {
                openDetail({ _id: customer._id });
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusStyle = (isActive) =>
        isActive
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-red-100 text-red-700 border-red-200';

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offline Customers</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Walk-in customers logged from the shop — separate from app customers
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
                >
                    <Plus size={16} /> Add Offline Customer
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <div className="flex-1">
                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                            Quick Phone Lookup
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={lookupPhone}
                                onChange={(e) => setLookupPhone(e.target.value)}
                                placeholder="Search walk-in customer by phone..."
                                className="w-full pl-9 pr-4 py-3 text-sm font-medium bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleLookup}
                        disabled={isLookingUp}
                        className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <ScanSearch size={16} /> {isLookingUp ? 'Searching...' : 'Find Customer'}
                    </button>
                </div>
                {lookupResult && (
                    <p className="mt-3 text-xs font-medium text-gray-500">
                        {lookupResult.found
                            ? `Found existing customer and opened profile drawer.`
                            : `No offline customer found for ${lookupPhone}.`}
                    </p>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedTab(tab.key)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                                selectedTab === tab.key
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
                        placeholder="Search by name or phone..."
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

                {!isLoading && customers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 p-12">
                        <User size={48} className="opacity-20" />
                        <p className="text-sm font-semibold">No offline customers found</p>
                        <p className="text-xs text-gray-400">Add a walk-in customer to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Orders</th>
                                    <th className="px-6 py-4">Total Spent</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {customers.map((customer) => (
                                    <tr
                                        key={customer._id}
                                        onClick={() => openDetail(customer)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                                    {(customer.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                                                        {customer.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        Added {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-700">{customer.phone}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-900">{customer.orderCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-primary">
                                                ₹{(customer.totalSpent || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(customer.isActive)}`}>
                                                {customer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => openEditModal(customer, e)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
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
                {selectedCustomer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedCustomer(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shrink-0">
                                        {(selectedCustomer.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-black tracking-tight text-gray-900 truncate">
                                            {selectedCustomer.name}
                                        </h2>
                                        <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">
                                            Offline · Walk-in
                                        </p>
                                        <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${getStatusStyle(selectedCustomer.isActive)}`}>
                                            {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {isDetailLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-primary to-primary-dark border-none p-4 rounded-2xl shadow-sm text-center text-white">
                                                <div className="flex justify-center mb-1 text-white/80">
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <p className="text-2xl font-black">{detailStats?.orderCount ?? 0}</p>
                                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">
                                                    Offline Orders
                                                </p>
                                            </div>
                                            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                                <div className="flex justify-center mb-1 text-primary">
                                                    <IndianRupee size={20} />
                                                </div>
                                                <p className="text-2xl font-black text-gray-900">
                                                    ₹{(detailStats?.totalSpent || 0).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                    Total Spent
                                                </p>
                                            </div>
                                        </div>

                                        {(detailStats?.pendingBalance || 0) > 0 && (
                                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
                                                <CheckCircle2 size={14} />
                                                Pending balance: ₹{detailStats.pendingBalance.toLocaleString()}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                                <User size={12} /> Contact
                                            </h3>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                    <Phone size={16} className="text-primary opacity-70 shrink-0" />
                                                    {selectedCustomer.phone}
                                                </div>
                                                {selectedCustomer.address ? (
                                                    <div className="flex items-start gap-3 text-sm font-medium text-gray-700">
                                                        <MapPin size={16} className="text-primary opacity-70 shrink-0 mt-0.5" />
                                                        {selectedCustomer.address}
                                                    </div>
                                                ) : null}
                                                {selectedCustomer.notes ? (
                                                    <div className="flex items-start gap-3 text-sm font-medium text-gray-700">
                                                        <StickyNote size={16} className="text-primary opacity-70 shrink-0 mt-0.5" />
                                                        {selectedCustomer.notes}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                                <FileText size={12} /> Offline Order History
                                            </h3>
                                            {detailOrders.length === 0 ? (
                                                <div className="bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                                    No offline orders yet
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {detailOrders.map((order) => (
                                                        <div
                                                            key={order._id}
                                                            className="bg-gray-50 border border-gray-100 p-3 rounded-xl"
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black text-gray-900 truncate">
                                                                        {order.garmentType}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                                        {order.orderId} ·{' '}
                                                                        {order.createdAt
                                                                            ? new Date(order.createdAt).toLocaleDateString()
                                                                            : ''}
                                                                    </p>
                                                                </div>
                                                                <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${offlineStatusStyle(order.status)}`}>
                                                                    {getOfflineStatusLabel(order.status)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-sm font-black text-primary">
                                                                    ₹{(order.totalAmount || 0).toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-500 capitalize">
                                                                    {order.paymentStatus}
                                                                    {order.advancePaid > 0
                                                                        ? ` · Adv ₹${order.advancePaid.toLocaleString()}`
                                                                        : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                                <Ruler size={12} /> Saved Measurements
                                            </h3>
                                            {(selectedCustomer.savedMeasurements || []).length === 0 ? (
                                                <div className="bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                                    No saved measurements yet
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedCustomer.savedMeasurements.map((profile, index) => (
                                                        <div key={`${profile.garmentType}-${index}`} className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="text-xs font-black text-gray-900">
                                                                        {profile.label || profile.garmentType}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                                        {profile.garmentType} · {profile.unit || 'inches'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {Object.entries(profile.measurements || {}).map(([key, value]) => (
                                                                    <span
                                                                        key={key}
                                                                        className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-600"
                                                                    >
                                                                        {key}: {value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {profile.notes ? (
                                                                <p className="mt-2 text-[10px] text-gray-500 font-medium">{profile.notes}</p>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white flex flex-col gap-2">
                                {selectedCustomer.isActive && (
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/admin/offline-orders?customer=${selectedCustomer._id}&new=1`
                                            )
                                        }
                                        className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> New Offline Order
                                    </button>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => openEditModal(selectedCustomer)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-700 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                                    >
                                        Edit Customer
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(selectedCustomer)}
                                        disabled={isUpdating}
                                        className={`p-3 border rounded-xl transition-colors ${
                                            selectedCustomer.isActive
                                                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                        }`}
                                        title={selectedCustomer.isActive ? 'Deactivate' : 'Reactivate'}
                                    >
                                        {isUpdating ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                        ) : (
                                            <Ban size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add / Edit modal */}
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
                                    {editingCustomer ? 'Edit Offline Customer' : 'Add Offline Customer'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Customer full name"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="10-digit mobile number"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Address (optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Street, city, pincode..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Preferences, fabric notes, etc."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm resize-none"
                                    />
                                </div>

                                <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <Ruler size={12} /> Saved Measurements
                                        </h3>
                                        <span className="text-[10px] font-bold text-primary">
                                            {savedMeasurements.length} profile{savedMeasurements.length === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    {savedMeasurements.length > 0 && (
                                        <div className="space-y-2">
                                            {savedMeasurements.map((profile, index) => (
                                                <div key={`${profile.garmentType}-${index}`} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">
                                                                {profile.label || profile.garmentType}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 font-medium">
                                                                {profile.garmentType} · {profile.unit}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMeasurementProfile(index)}
                                                            className="text-[10px] font-bold text-red-500 hover:text-red-600"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={measurementForm.label}
                                            onChange={(e) => setMeasurementForm({ ...measurementForm, label: e.target.value })}
                                            placeholder="Profile label (e.g. Suit Set)"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            value={measurementForm.garmentType}
                                            onChange={(e) => setMeasurementForm({ ...measurementForm, garmentType: e.target.value })}
                                            placeholder="Garment type *"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.keys(measurementForm.measurements).map((key) => (
                                            <input
                                                key={key}
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={measurementForm.measurements[key]}
                                                onChange={(e) => setMeasurementForm({
                                                    ...measurementForm,
                                                    measurements: {
                                                        ...measurementForm.measurements,
                                                        [key]: e.target.value,
                                                    },
                                                })}
                                                placeholder={key}
                                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                            />
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
                                        <textarea
                                            rows={2}
                                            value={measurementForm.notes}
                                            onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                                            placeholder="Measurement notes (optional)"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary transition-colors shadow-sm resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addMeasurementProfile}
                                            className="px-4 py-3 bg-primary/10 text-primary text-xs font-black rounded-xl hover:bg-primary/15 transition-all uppercase tracking-widest"
                                        >
                                            Add Profile
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {isSaving ? 'Saving...' : editingCustomer ? 'Update' : 'Add Customer'}
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

export default AdminOfflineCustomers;
