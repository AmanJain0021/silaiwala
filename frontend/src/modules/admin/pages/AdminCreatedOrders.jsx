import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, MoreHorizontal, X, User, MapPin, CheckCircle2,
    Package, Scissors, CreditCard, ChevronRight, Truck, Clock, Plus,
    Sparkles, ShieldCheck, Phone, Mail, RefreshCw, Calendar, Ruler,
    AlertCircle, ExternalLink, ArrowRight
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { getToken } from '../../../utils/auth';
import OrderTrackingTimeline from '../components/OrderTrackingTimeline';
import LiveDeliveryTracker from '../../../shared/components/LiveDeliveryTracker';
import { formatOrderItemsTitle } from '../../../utils/orderItems';
import MeasurementDataDisplay from '../../../components/Common/MeasurementDataDisplay';

const AdminCreatedOrders = () => {
    const [socketInstance, setSocketInstance] = useState(null);
    const [selectedTab, setSelectedTab] = useState('All Orders');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ordersData, setOrdersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [manageOrderData, setManageOrderData] = useState(null);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalStitching, setTotalStitching] = useState(0);
    const [totalStore, setTotalStore] = useState(0);
    const limit = 10;

    // States for Assignments
    const [tailorsList, setTailorsList] = useState([]);
    const [deliveryList, setDeliveryList] = useState([]);
    const [measurementExecutivesList, setMeasurementExecutivesList] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignRole, setAssignRole] = useState(null);

    const tabs = ['All Orders', 'Stitching Service', 'Readymade Store'];

    const fetchOrders = async (page = currentPage, query = searchQuery, tab = selectedTab, status = statusFilter) => {
        setIsLoading(true);
        try {
            let typeParam = '';
            if (tab === 'Stitching Service') typeParam = '&type=stitching';
            if (tab === 'Readymade Store') typeParam = '&type=store';

            let statusParam = '';
            if (status && status !== '') statusParam = `&status=${status}`;

            // Pass createdByAdmin=true to only fetch orders created by Admin
            const res = await api.get(`/admin/orders?createdByAdmin=true&page=${page}&limit=${limit}${typeParam}${statusParam}${query ? `&search=${query}` : ''}`);
            const formatted = (res.data.data || []).map(o => ({
                id: o.orderId || o._id.substring(0, 8),
                fullId: o._id,
                date: new Date(o.createdAt).toLocaleDateString(),
                customer: o.customer?.name || 'Unknown Customer',
                customerId: o.customer?._id,
                phone: o.customer?.phoneNumber || o.deliveryAddress?.phone || 'N/A',
                email: o.customer?.email || 'N/A',
                address: o.deliveryAddress ? `${o.deliveryAddress.street || ''}, ${o.deliveryAddress.city || ''}` : 'Address provided',
                deliveryAddress: o.deliveryAddress,
                service: formatOrderItemsTitle(o.items, { fallback: 'Custom Stitching Order' }),
                itemCount: o.items?.length || 0,
                type: (o.items || []).some((i) => i.service || i.isAlteration || i.isCustomDesign)
                    ? 'Stitching'
                    : (o.items || []).some((i) => i.product) ? 'Store' : 'Stitching',
                tailor: o.tailor?.shopName || o.tailor?.name || 'Unassigned',
                tailorId: o.tailor?._id,
                deliveryPartner: o.deliveryPartner?.name || 'Unassigned',
                deliveryPartnerId: o.deliveryPartner?._id,
                amount: `₹${(o.totalAmount || 0).toLocaleString()}`,
                rawAmount: o.totalAmount || 0,
                status: o.status || 'pending',
                paymentStatus: o.paymentStatus || 'pending',
                measurements: o.isMeasurementHome ? 'Tailor at Home' : 'Standard Profile',
                isMeasurementHome: o.isMeasurementHome || false,
                scheduledDate: o.scheduledDate || o.measurementRequest?.scheduledDate || null,
                scheduledTimeSlot: o.scheduledTimeSlot || o.measurementRequest?.scheduledTimeSlot || null,
                scheduledTime: o.scheduledTime || o.measurementRequest?.scheduledTime || null,
                measurementExecutive: o.measurementRequest?.executive?.name || 'Unassigned',
                itemMeasurements: o.items?.[0]?.measurements || null,
                items: o.items || [],
                executiveReport: o.measurementRequest?.report || null,
                trackingHistory: o.trackingHistory || [],
                createdByAdmin: true,
                adminCreator: o.adminCreator?.name || 'Admin Team',
                adminCreatorRole: o.adminCreator?.role || 'admin',
                createdAt: o.createdAt,
                deliveredAt: o.deliveredAt,
                updatedAt: o.updatedAt,
            }));
            setOrdersData(formatted);
            setTotalPages(res.data.pages || 1);
            setTotalOrders(res.data.total || 0);
            setTotalStitching(res.data.totalStitching || 0);
            setTotalStore(res.data.totalStore || 0);
            setCurrentPage(page);
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch admin-created orders:', err);
            setOrdersData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const [tailorsRes, deliveryRes, measurementExecsRes] = await Promise.all([
                api.get('/admin/users?role=tailor'),
                api.get('/admin/users?role=delivery'),
                api.get('/admin/users?role=measurement_executive')
            ]);
            setTailorsList(tailorsRes.data?.data?.map(t => ({
                id: t._id,
                name: t.name || t.shopName,
                phone: t.phoneNumber,
                isActive: t.isActive,
                joined: new Date(t.createdAt).toLocaleDateString()
            })) || []);
            setDeliveryList(deliveryRes.data?.data?.map(d => ({
                id: d._id,
                name: d.name,
                phone: d.phoneNumber,
                isActive: d.isActive,
                status: d.isActive ? 'Online' : 'Offline',
                joined: new Date(d.createdAt).toLocaleDateString()
            })) || []);
            setMeasurementExecutivesList(measurementExecsRes.data?.data?.map(e => ({
                id: e._id,
                name: e.name,
                phone: e.phoneNumber,
                isActive: e.isActive,
                status: e.isActive ? 'Online' : 'Offline',
                joined: new Date(e.createdAt).toLocaleDateString()
            })) || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            auth: { token: getToken() }
        });
        setSocketInstance(socket);

        socket.on('receive_new_order', () => {
            fetchOrders();
        });

        socket.on('order_status_updated', () => {
            fetchOrders();
        });

        fetchUsers();

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(currentPage, searchQuery, selectedTab, statusFilter);
        }, 350);
        return () => clearTimeout(timer);
    }, [currentPage, searchQuery, selectedTab, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTab, statusFilter]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setIsUpdatingStatus(true);
        setStatusDropdownOpen(false);
        try {
            const response = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
            if (selectedOrder && selectedOrder.fullId === orderId) {
                const updatedOrder = response.data?.data;
                setSelectedOrder(prev => ({
                    ...prev,
                    status: newStatus,
                    trackingHistory: updatedOrder?.trackingHistory || prev.trackingHistory
                }));
            }
            toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {
            console.error('Failed to update status:', err);
            toast.error('Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleAssign = async (userId) => {
        setIsUpdatingStatus(true);
        setIsAssignModalOpen(false);
        try {
            const updateData = {};
            updateData[assignRole] = userId;

            const response = await api.put(`/admin/orders/${selectedOrder.fullId}/status`, updateData);
            fetchOrders();
            if (selectedOrder) {
                const list = assignRole === 'tailor' ? tailorsList : assignRole === 'deliveryPartner' ? deliveryList : measurementExecutivesList;
                const userName = list.find(u => u.id === userId || u._id === userId)?.name || 'Assigned';
                setSelectedOrder(prev => ({
                    ...prev,
                    [assignRole]: userName,
                    [`${assignRole}Id`]: userId
                }));
            }
            toast.success(`Successfully assigned to ${assignRole}`);
        } catch (err) {
            console.error('Failed to assign:', err);
            toast.error('Failed to assign partner');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openManageModal = async (order) => {
        setIsLoadingDetails(true);
        setIsManageOpen(true);
        try {
            const res = await api.get(`/admin/orders/${order.fullId}`);
            if (res.data.success) {
                setManageOrderData(res.data.data);
            }
        } catch (err) {
            toast.error('Failed to load order details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in-progress':
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'ready for delivery':
            case 'ready_for_delivery':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Sparkles className="text-[#843D9B]" size={26} />
                        Admin Created Orders
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-[#843D9B] ml-1">
                            Assisted Mode
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Dedicated queue of orders created by administrators on behalf of customers. Full tailor & measurement management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchOrders()}
                        disabled={isLoading}
                        className="px-3.5 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#843D9B]' : ''} />
                        Refresh
                    </button>
                    <Link
                        to="/admin/orders/create"
                        className="px-4 py-2 text-xs font-black text-white bg-[#843D9B] hover:bg-[#733587] rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                        <Plus size={16} />
                        + Create Order for User
                    </Link>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Admin Orders</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">{totalOrders}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold">
                        <Sparkles size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stitching Orders</p>
                        <h3 className="text-2xl font-black text-purple-700 mt-1">{totalStitching}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Scissors size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store / Fabric Orders</p>
                        <h3 className="text-2xl font-black text-indigo-700 mt-1">{totalStore}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <Package size={22} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search & Status Filter */}
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#843D9B]"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="measurement_accepted">Measurement Accepted</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="fabric_ready_for_pickup">Fabric Ready For Pickup</option>
                        <option value="ready_for_delivery">Ready For Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-4">Order ID & Date</th>
                                <th className="py-3 px-4">Customer Details</th>
                                <th className="py-3 px-4">Service & Outfit</th>
                                <th className="py-3 px-4">Assigned Tailor</th>
                                <th className="py-3 px-4">Measurement Executive</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400">
                                        <RefreshCw size={24} className="animate-spin text-[#843D9B] mx-auto mb-2" />
                                        Loading admin created orders...
                                    </td>
                                </tr>
                            ) : ordersData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <Sparkles size={36} className="text-gray-300 mx-auto mb-2" />
                                        <p className="font-bold text-gray-700 text-sm">No admin-created orders found</p>
                                        <p className="text-xs text-gray-400 mt-1">Orders booked via "Create Order for User" will appear right here.</p>
                                        <Link
                                            to="/admin/orders/create"
                                            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#843D9B] text-white rounded-xl text-xs font-bold hover:bg-[#733587] transition-all shadow-sm"
                                        >
                                            <Plus size={14} /> Place First Admin Order
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                ordersData.map((order) => (
                                    <tr
                                        key={order.fullId}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                                    >
                                        {/* Order ID & Date */}
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-[#843D9B] group-hover:underline">{order.id}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{order.date}</span>
                                            <span className="text-[9px] bg-purple-50 text-[#843D9B] font-bold px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-1">
                                                ⚡ by {order.adminCreator}
                                            </span>
                                        </td>

                                        {/* Customer Details */}
                                        <td className="py-3.5 px-4">
                                            <p className="font-bold text-gray-900">{order.customer}</p>
                                            <p className="text-[11px] text-gray-500 font-medium">{order.phone}</p>
                                        </td>

                                        {/* Service & Outfit */}
                                        <td className="py-3.5 px-4">
                                            <p className="font-bold text-gray-900 line-clamp-1">{order.service}</p>
                                            <span className="text-[10px] text-gray-400 font-medium block">
                                                {order.type} • {order.measurements}
                                            </span>
                                        </td>

                                        {/* Assigned Tailor */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-semibold ${order.tailor === 'Unassigned' ? 'text-amber-600' : 'text-gray-900'}`}>
                                                    {order.tailor}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Measurement Executive */}
                                        <td className="py-3.5 px-4">
                                            <span className={`font-semibold ${order.measurementExecutive === 'Unassigned' ? 'text-gray-400' : 'text-purple-700'}`}>
                                                {order.measurementExecutive}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="py-3.5 px-4 font-black text-gray-900">
                                            {order.amount}
                                            <span className={`text-[9px] font-bold block uppercase mt-0.5 ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                                                {order.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openManageModal(order);
                                                }}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all inline-flex items-center gap-1"
                                            >
                                                Manage <ChevronRight size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Drawer Details */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-white">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-lg text-gray-900">{selectedOrder.id}</h3>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#843D9B]">
                                            Admin Created
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Placed on {selectedOrder.date} by {selectedOrder.adminCreator}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Customer Info Card */}
                                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Customer Details</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-black text-sm text-gray-900">{selectedOrder.customer}</h4>
                                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
                                                <Phone size={12} className="text-[#843D9B]" /> {selectedOrder.phone}
                                            </p>
                                            {selectedOrder.email && selectedOrder.email !== 'N/A' && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                    <Mail size={12} className="text-[#843D9B]" /> {selectedOrder.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200/60 text-xs text-gray-600 flex items-start gap-1.5">
                                        <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                                        <span>{selectedOrder.address}</span>
                                    </div>
                                </div>

                                {/* Status & Quick Changer */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Update Order Status</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'pending', label: 'Pending' },
                                            { key: 'measurement_accepted', label: 'Measurement Accepted' },
                                            { key: 'in-progress', label: 'In-Progress' },
                                            { key: 'fabric_ready_for_pickup', label: 'Fabric Ready' },
                                            { key: 'ready_for_delivery', label: 'Ready Delivery' },
                                            { key: 'delivered', label: 'Delivered' },
                                        ].map(s => (
                                            <button
                                                key={s.key}
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleUpdateStatus(selectedOrder.fullId, s.key)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                                                    selectedOrder.status === s.key
                                                        ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <span>{s.label}</span>
                                                {selectedOrder.status === s.key && <CheckCircle2 size={13} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assignments Section */}
                                <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-900">Partner Assignments</p>
                                    
                                    {/* Tailor */}
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Tailor Partner</span>
                                            <span className="font-bold text-xs text-gray-900">{selectedOrder.tailor}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAssignRole('tailor');
                                                setIsAssignModalOpen(true);
                                            }}
                                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#843D9B] rounded-lg text-xs font-bold transition-all"
                                        >
                                            {selectedOrder.tailor === 'Unassigned' ? 'Assign' : 'Reassign'}
                                        </button>
                                    </div>

                                    {/* Measurement Executive */}
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Measurement Executive</span>
                                            <span className="font-bold text-xs text-gray-900">{selectedOrder.measurementExecutive}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAssignRole('measurementExecutive');
                                                setIsAssignModalOpen(true);
                                            }}
                                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#843D9B] rounded-lg text-xs font-bold transition-all"
                                        >
                                            {selectedOrder.measurementExecutive === 'Unassigned' ? 'Assign' : 'Reassign'}
                                        </button>
                                    </div>

                                    {/* Delivery Partner */}
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Delivery Partner</span>
                                            <span className="font-bold text-xs text-gray-900">{selectedOrder.deliveryPartner}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAssignRole('deliveryPartner');
                                                setIsAssignModalOpen(true);
                                            }}
                                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#843D9B] rounded-lg text-xs font-bold transition-all"
                                        >
                                            {selectedOrder.deliveryPartner === 'Unassigned' ? 'Assign' : 'Reassign'}
                                        </button>
                                    </div>
                                </div>

                                {/* Measurements Data Display */}
                                {selectedOrder.itemMeasurements && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                            <Ruler size={13} className="text-[#843D9B]" /> Configured Measurements
                                        </p>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <MeasurementDataDisplay measurements={selectedOrder.itemMeasurements} />
                                        </div>
                                    </div>
                                )}

                                {/* Bill Summary */}
                                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Bill Summary</p>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-gray-600">Total Order Amount</span>
                                        <span className="text-gray-900 text-sm font-black">{selectedOrder.amount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Payment Status</span>
                                        <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assignment Selection Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAssignModalOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <h3 className="font-black text-sm text-gray-900 capitalize">
                                    Assign {assignRole === 'tailor' ? 'Tailor' : assignRole === 'deliveryPartner' ? 'Delivery Partner' : 'Measurement Executive'}
                                </h3>
                                <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto space-y-2">
                                {(assignRole === 'tailor' ? tailorsList : assignRole === 'deliveryPartner' ? deliveryList : measurementExecutivesList).map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => handleAssign(u.id)}
                                        className="p-3 rounded-xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-bold text-xs text-gray-900">{u.name}</p>
                                            <p className="text-[10px] text-gray-500">{u.phone || 'No phone'}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#843D9B]">Select</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCreatedOrders;

