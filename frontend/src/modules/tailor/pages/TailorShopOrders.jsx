import React, { useCallback, useEffect, useState } from 'react';
import {
    Package, Loader2, Store, Search, Phone, Calendar, Ruler,
    AlertTriangle, Sparkles, Scissors, Clock, CheckCircle2, ChevronRight, X, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import OfflineProductionPipeline from '../../admin/components/OfflineProductionPipeline';
import MeasurementDataDisplay from '../../../components/Common/MeasurementDataDisplay';
import {
    OFFLINE_PIPELINE_STEPS,
    getOfflineStatusLabel,
    offlineStatusStyle,
} from '../../admin/constants/offlineOrderStatus';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';

const STATUS_TABS = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'cutting', label: 'Cutting' },
    { key: 'stitching', label: 'Stitching' },
    { key: 'fitting', label: 'Fitting' },
    { key: 'finishing', label: 'Finishing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
];

const TailorShopOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/tailors/offline-orders', { params });
            if (res.data?.success) {
                const list = res.data.data || [];
                setOrders(list);
                setSelected((prev) => {
                    if (!prev) return prev;
                    return list.find((o) => o._id === prev._id) || prev;
                });
            }
        } catch {
            toast.error('Could not load shop orders');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Live socket updates
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });

        const handleUpdate = () => {
            fetchOrders();
        };

        socket.on('receive_new_offline_order', handleUpdate);
        socket.on('offline_order_assigned', handleUpdate);
        socket.on('offline_order_status_update', handleUpdate);

        return () => {
            socket.off('receive_new_offline_order', handleUpdate);
            socket.off('offline_order_assigned', handleUpdate);
            socket.off('offline_order_status_update', handleUpdate);
            socket.disconnect();
        };
    }, [fetchOrders]);

    const handleStatus = async (orderId, status) => {
        setUpdatingId(orderId);
        try {
            const res = await api.patch(`/tailors/offline-orders/${orderId}/status`, { status });
            if (res.data?.success) {
                toast.success(`Updated to ${getOfflineStatusLabel(status)}`);
                await fetchOrders();
                if (selected?._id === orderId) setSelected(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (o.orderId || '').toLowerCase().includes(q) ||
            (o.garmentType || '').toLowerCase().includes(q) ||
            (o.offlineCustomer?.name || '').toLowerCase().includes(q) ||
            (o.offlineCustomer?.phone || '').includes(q)
        );
    });

    return (
        <div className="max-w-3xl mx-auto space-y-5 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Shop Orders</h1>
                        <p className="text-xs text-gray-500">Walk-in and custom workshop orders assigned to you</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-xl uppercase tracking-wider">
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                </div>
            </div>

            {/* Search & Status Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Order ID, Garment or Customer Name/Phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                statusFilter === tab.key
                                    ? 'bg-[#843D9B] text-white shadow-sm shadow-[#843D9B]/20'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={28} />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                    <Package className="mx-auto text-gray-300 mb-3" size={36} />
                    <p className="text-base font-bold text-gray-700">No shop orders found</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {statusFilter === 'active'
                            ? 'You have no active walk-in tasks at the moment.'
                            : 'No orders matched your selected status or search filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => {
                        const isUrgent = order.priority === 'urgent';
                        return (
                            <button
                                key={order._id}
                                type="button"
                                onClick={() => setSelected(order)}
                                className={`w-full text-left bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm hover:shadow-md ${
                                    selected?._id === order._id ? 'border-primary ring-2 ring-primary/10' : 'border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                                #{order.orderId}
                                            </span>
                                            {isUrgent && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[9px] font-black uppercase">
                                                    <AlertTriangle size={10} /> Urgent
                                                </span>
                                            )}
                                            {order.stitchingPackage && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                    {order.stitchingPackage}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-black text-gray-900">{order.garmentType}</h3>

                                        <p className="text-xs text-gray-600 font-medium">
                                            {order.offlineCustomer?.name || 'Walk-in Customer'} · {order.offlineCustomer?.phone || ''}
                                        </p>

                                        {order.expectedCompletionDate && (
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-0.5">
                                                <Calendar size={12} className="text-primary" />
                                                Due: <span className="font-bold text-gray-700">{new Date(order.expectedCompletionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${offlineStatusStyle(order.status)}`}
                                        >
                                            {getOfflineStatusLabel(order.status)}
                                        </span>
                                        <span className="text-xs text-primary font-bold flex items-center gap-0.5 mt-2">
                                            View Details <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Order Details Drawer / Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-primary uppercase tracking-wider">
                                        #{selected.orderId}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${offlineStatusStyle(selected.status)}`}>
                                        {getOfflineStatusLabel(selected.status)}
                                    </span>
                                    {selected.priority === 'urgent' && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase">
                                            Urgent
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-black text-gray-900 mt-1">{selected.garmentType}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {/* Customer Contact Card */}
                            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Customer Details</p>
                                    <p className="text-sm font-black text-gray-900 mt-0.5">{selected.offlineCustomer?.name || 'Walk-in Customer'}</p>
                                    <p className="text-xs text-gray-600 font-medium">{selected.offlineCustomer?.phone || 'No phone provided'}</p>
                                    {selected.offlineCustomer?.address && (
                                        <p className="text-[11px] text-gray-500 mt-1">{selected.offlineCustomer.address}</p>
                                    )}
                                </div>
                                {selected.offlineCustomer?.phone && (
                                    <a
                                        href={`tel:${selected.offlineCustomer.phone}`}
                                        className="px-3.5 py-2 bg-[#843D9B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#6B2F7E] transition-colors shrink-0"
                                    >
                                        <Phone size={13} /> Call
                                    </a>
                                )}
                            </div>

                            {/* Production Status Pipeline */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                                    Update Production Stage
                                </h3>
                                <OfflineProductionPipeline
                                    currentStatus={selected.status}
                                    onSelectStatus={(status) => handleStatus(selected._id, status)}
                                    disabled={updatingId === selected._id}
                                    compact
                                />
                            </div>

                            {/* Key Order Specs */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Stitching Package</span>
                                    <span className="font-bold capitalize">{selected.stitchingPackage || 'Basic'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Fabric Source</span>
                                    <span className="font-bold capitalize">{selected.fabricSource === 'sewzella' ? 'Platform / SewZella' : 'Customer Provided'}</span>
                                </div>
                                {selected.expectedCompletionDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Expected Completion</span>
                                        <span className="font-bold text-gray-900">
                                            {new Date(selected.expectedCompletionDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                                {selected.notes && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-gray-500 font-medium block mb-1">Tailoring Notes:</span>
                                        <p className="font-medium text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                                            {selected.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Measurements Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                                        <Ruler size={15} className="text-primary" /> Body Measurements
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        Unit: <strong className="text-primary">{selected.measurementUnit || 'inches'}</strong>
                                    </span>
                                </div>

                                {selected.measurements && Object.keys(selected.measurements).length > 0 ? (
                                    <MeasurementDataDisplay
                                        measurements={selected.measurements}
                                        className="bg-white"
                                    />
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No detailed measurement fields recorded.</p>
                                )}

                                {/* Measurement Reference Photos */}
                                {selected.measurementPhotos && selected.measurementPhotos.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Reference Photos</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selected.measurementPhotos.map((photo, i) => (
                                                <a key={i} href={photo} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 aspect-square">
                                                    <img src={photo} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Style Add-ons & Customizations */}
                            {(() => {
                                const slotLabels = {
                                    neck: 'Neck Design',
                                    sleeve: 'Sleeve Style',
                                    bottom: 'Bottom Style',
                                    embroidery: 'Embroidery Work',
                                    lacePiping: 'Lace / Piping',
                                    lining: 'Inner Lining',
                                    other: 'Customization'
                                };

                                const rawAddons = selected.styleAddons || selected.addons || [];
                                const addons = Array.isArray(rawAddons) ? rawAddons.filter(a => a && (a.name || a.title || Number(a.price) > 0)) : [];

                                const rawCusts = selected.customizations || {};
                                const custEntries = [];
                                if (rawCusts && typeof rawCusts === 'object') {
                                    for (const [key, val] of Object.entries(rawCusts)) {
                                        if (!val) continue;
                                        if (typeof val === 'string') {
                                            const trimmed = val.trim();
                                            if (trimmed) {
                                                custEntries.push({
                                                    key,
                                                    label: slotLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                                    name: trimmed,
                                                    price: 0,
                                                    refImage: '',
                                                    description: ''
                                                });
                                            }
                                        } else if (typeof val === 'object') {
                                            if (val.enabled === false) continue;
                                            const name = val.name || val.title || '';
                                            const refImage = val.refImage || val.image || '';
                                            const price = Number(val.price) || 0;
                                            const description = val.description || '';
                                            if (name || refImage || price > 0 || description) {
                                                custEntries.push({
                                                    key,
                                                    label: slotLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                                    name: name || 'Selected Option',
                                                    price,
                                                    refImage,
                                                    description
                                                });
                                            }
                                        }
                                    }
                                }

                                if (addons.length === 0 && custEntries.length === 0) return null;

                                return (
                                    <div className="space-y-3 pt-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles size={15} className="text-primary" /> Style Add-ons & Customizations
                                            </span>
                                            <span className="text-[9px] font-black uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                                {addons.length + custEntries.length} Specs
                                            </span>
                                        </h3>

                                        {addons.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Style Add-ons</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {addons.map((addon, i) => {
                                                        const img = addon.image || addon.refImage;
                                                        return (
                                                            <div key={i} className="p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center gap-2.5">
                                                                {img ? (
                                                                    <img
                                                                        src={img}
                                                                        alt={addon.name}
                                                                        className="w-12 h-12 object-cover rounded-lg shrink-0 border border-indigo-100 cursor-pointer shadow-xs"
                                                                        onClick={() => window.open(img, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black shrink-0">
                                                                        ✨
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-xs font-bold text-gray-900 truncate">{addon.name}</p>
                                                                        {Number(addon.price) > 0 && (
                                                                            <span className="text-xs font-black text-primary ml-1">+₹{addon.price}</span>
                                                                        )}
                                                                    </div>
                                                                    {addon.category && (
                                                                        <span className="text-[9px] text-gray-500 capitalize">{addon.category}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {custEntries.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Garment Customizations</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {custEntries.map((cust) => (
                                                        <div key={cust.key} className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col justify-between gap-1.5">
                                                            <div>
                                                                <div className="flex justify-between items-center text-xs font-bold">
                                                                    <span className="text-gray-500 uppercase text-[9px] font-black">{cust.label}:</span>
                                                                    <span className="text-gray-900 font-black">{cust.name}</span>
                                                                    {cust.price > 0 && <span className="text-primary font-black text-xs">+₹{cust.price}</span>}
                                                                </div>
                                                                {cust.description && (
                                                                    <p className="text-[10px] text-gray-500 italic mt-0.5">{cust.description}</p>
                                                                )}
                                                            </div>
                                                            {cust.refImage && (
                                                                <div className="mt-1">
                                                                    <img
                                                                        src={cust.refImage}
                                                                        alt={cust.name}
                                                                        className="h-20 w-auto rounded-lg object-cover border border-purple-200 cursor-pointer shadow-xs"
                                                                        onClick={() => window.open(cust.refImage, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/80">
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorShopOrders;
