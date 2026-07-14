import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Package, Truck, CheckCircle2, AlertTriangle,
    ExternalLink, Loader2, MapPin, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
    'NEW': 'bg-blue-50 text-blue-700 border-blue-100',
    'PICKUP SCHEDULED': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'PICKED UP': 'bg-violet-50 text-violet-700 border-violet-100',
    'IN TRANSIT': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'OUT FOR DELIVERY': 'bg-teal-50 text-teal-700 border-teal-100',
    'DELIVERED': 'bg-green-50 text-green-700 border-green-100',
    'CANCELED': 'bg-red-50 text-red-700 border-red-100',
    'RTO': 'bg-orange-50 text-orange-700 border-orange-100',
    'RTO INITIATED': 'bg-orange-50 text-orange-700 border-orange-100',
    'RTO DELIVERED': 'bg-amber-50 text-amber-700 border-amber-100',
    'UNKNOWN': 'bg-gray-50 text-gray-500 border-gray-100',
};

const getStatusColor = (status) => STATUS_COLORS[status?.toUpperCase()] || STATUS_COLORS['UNKNOWN'];

const formatCurrency = (val) => val ? `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0';
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

const ShiprocketShipments = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [summary, setSummary] = useState({ total: 0, totalValue: 0, byStatus: {}, failedPickupLocations: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchShipments = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = { page, limit: pagination.limit };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter) params.status = statusFilter;

            const res = await api.get('/admin/shiprocket/shipments', { params });
            
            setShipments(res.data.data.shipments);
            setSummary(res.data.data.summary);
            setPagination(res.data.data.pagination);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Error fetching shipments:', error);
            toast.error('Failed to load shipments');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments(1);
    }, [debouncedSearch, statusFilter]);

    const statCards = [
        { 
            label: 'Total Shipments', 
            value: summary.total, 
            color: 'text-purple-600', bg: 'bg-purple-100', 
            icon: <Package size={20} /> 
        },
        { 
            label: 'Total Shipment Value', 
            value: formatCurrency(summary.totalValue), 
            color: 'text-green-600', bg: 'bg-green-100', 
            icon: <Truck size={20} /> 
        },
        { 
            label: 'Delivered', 
            value: summary.byStatus?.['DELIVERED']?.count || 0, 
            color: 'text-emerald-600', bg: 'bg-emerald-100', 
            icon: <CheckCircle2 size={20} /> 
        },
        { 
            label: 'In Transit', 
            value: (summary.byStatus?.['IN TRANSIT']?.count || 0) + (summary.byStatus?.['OUT FOR DELIVERY']?.count || 0), 
            color: 'text-cyan-600', bg: 'bg-cyan-100', 
            icon: <Truck size={20} /> 
        },
        { 
            label: 'Failed Pickup Locations', 
            value: summary.failedPickupLocations || 0, 
            color: 'text-amber-600', bg: 'bg-amber-100', 
            icon: <AlertTriangle size={20} /> 
        },
    ];

    const allStatuses = Object.keys(summary.byStatus || {}).sort();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Shiprocket Shipments</h1>
                    <p className="text-xs font-medium text-gray-500 mt-1">All courier shipments across tailors</p>
                </div>
                <button 
                    onClick={() => fetchShipments(pagination.page)}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={16} className="text-gray-600" />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start gap-4"
                    >
                        <div className={`p-3 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500">{stat.label}</h3>
                            <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Order ID or AWB..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-primary placeholder:text-gray-400"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Filter size={14} /> Filters
                        </button>
                        {statusFilter && (
                            <button
                                onClick={() => setStatusFilter('')}
                                className="flex items-center gap-1 px-3 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                                <X size={10} /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-100"
                        >
                            <div className="p-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by Shiprocket Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {allStatuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : `${getStatusColor(s)}`}`}
                                        >
                                            {s || 'Unknown'} ({summary.byStatus[s]?.count || 0})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 size={24} className="animate-spin text-primary" />
                            <span className="ml-3 text-sm font-bold text-gray-500">Loading shipments...</span>
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16">
                            <Package size={48} className="text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-gray-400">No Shiprocket shipments found</p>
                            <p className="text-xs text-gray-400 mt-1">Shipments will appear here once orders are shipped via Shiprocket</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-t border-gray-100">
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tailor</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">AWB / Courier</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup Loc.</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Updated</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Track</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.map((s, idx) => (
                                    <motion.tr
                                        key={s._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-black text-gray-900">{s.orderId}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatDate(s.createdAt)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{s.tailor.name}</p>
                                            {s.tailor.shopName && (
                                                <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{s.tailor.shopName}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{s.customer.name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-black text-gray-900 font-mono">{s.shiprocket.awbCode || '—'}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{s.shiprocket.courierName || 'Not assigned'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(s.shiprocket.currentStatus)}`}>
                                                {s.shiprocket.currentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-black text-gray-900">{formatCurrency(s.totalAmount)}</p>
                                            <p className={`text-[10px] font-bold ${s.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {s.paymentStatus?.toUpperCase()}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={10} className={s.tailor.isShiprocketConfigured ? 'text-green-500' : 'text-amber-500'} />
                                                <span className="text-[10px] font-bold text-gray-600 truncate max-w-[80px]" title={s.tailor.pickupLocation}>
                                                    {s.tailor.pickupLocation}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] text-gray-500 font-medium">{formatDateTime(s.updatedAt)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {s.shiprocket.trackingUrl ? (
                                                <a
                                                    href={s.shiprocket.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors inline-flex"
                                                    title="Track Shipment"
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 font-bold">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchShipments(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} className="text-gray-600" />
                            </button>
                            <span className="text-xs font-black text-gray-700 px-3">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                onClick={() => fetchShipments(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={14} className="text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiprocketShipments;
