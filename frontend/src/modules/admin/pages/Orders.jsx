import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, X, User, MapPin, CheckCircle2, Package, Scissors, CreditCard, ChevronRight, Truck, Clock } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminOrders = () => {
    const [selectedTab, setSelectedTab] = useState('All Orders');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ordersData, setOrdersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [manageOrderData, setManageOrderData] = useState(null);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // States for Assignments
    const [tailorsList, setTailorsList] = useState([]);
    const [deliveryList, setDeliveryList] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignRole, setAssignRole] = useState(null); // 'tailor' or 'deliveryPartner'

    const tabs = ['All Orders', 'Stitching Service', 'Readymade Store'];

    const fetchOrders = async () => {
        try {
            const res = await api.get('/admin/orders');
            const formatted = res.data.data.map(o => ({
                id: o.orderId || o._id.substring(0, 8),
                fullId: o._id,
                date: new Date(o.createdAt).toLocaleDateString(),
                customer: o.customer?.name || 'Unknown Customer',
                phone: o.customer?.phoneNumber || 'N/A',
                email: o.customer?.email || 'N/A',
                address: o.deliveryAddress ? `${o.deliveryAddress.street}, ${o.deliveryAddress.city}` : 'Shipping address provided',
                service: o.items?.[0]?.service?.title || o.items?.[0]?.product?.name || 'Custom Request',
                type: o.items?.[0]?.product ? 'Store' : 'Stitching',
                tailor: o.tailor?.name || 'Unassigned',
                tailorId: o.tailor?._id,
                deliveryPartner: o.deliveryPartner?.name || 'Unassigned',
                deliveryPartnerId: o.deliveryPartner?._id,
                amount: `₹${(o.totalAmount || 0).toLocaleString()}`,
                status: o.status || 'pending',
                paymentStatus: o.paymentStatus || 'pending',
                measurements: 'Standard Profile',
                trackingHistory: o.trackingHistory || []
            }));
            setOrdersData(formatted);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setOrdersData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const [tailorsRes, deliveryRes] = await Promise.all([
                api.get('/admin/users?role=tailor'),
                api.get('/admin/users?role=delivery')
            ]);
            setTailorsList(tailorsRes.data.data.map(t => ({
                id: t._id,
                name: t.name,
                phone: t.phoneNumber,
                isActive: t.isActive,
                joined: new Date(t.createdAt).toLocaleDateString()
            })) || []);
            setDeliveryList(deliveryRes.data.data.map(d => ({
                id: d._id,
                name: d.name,
                phone: d.phoneNumber,
                isActive: d.isActive,
                status: d.isActive ? 'Online' : 'Offline',
                joined: new Date(d.createdAt).toLocaleDateString()
            })) || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchVal = params.get('search');
        if (searchVal) setSearchQuery(searchVal);

        fetchOrders();
        fetchUsers();
    }, []);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setIsUpdatingStatus(true);
        setStatusDropdownOpen(false);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
            if (selectedOrder && selectedOrder.fullId === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
        setIsUpdatingStatus(true);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { paymentStatus: newPaymentStatus });
            fetchOrders();
            if (selectedOrder && selectedOrder.fullId === orderId) {
                setSelectedOrder(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
            }
            toast.success(`Payment status updated to ${newPaymentStatus}`);
        } catch (err) {
            console.error('Failed to update payment status:', err);
            toast.error('Failed to update payment status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleUpdateDeliveryFee = async (orderId, newFee) => {
        setIsUpdatingStatus(true);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { deliveryFee: Number(newFee) });
            toast.success(`Delivery earning updated to ₹${newFee}`);
            
            // Re-fetch order details to immediately reflect changes in the modal
            const res = await api.get(`/admin/orders/${orderId}`);
            if (res.data.success) setManageOrderData(res.data.data);
            
            fetchOrders();
        } catch (err) {
            console.error('Failed to update delivery fee:', err);
            toast.error('Failed to update delivery fee');
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

            await api.put(`/admin/orders/${selectedOrder.fullId}/status`, updateData);

            fetchOrders();
            // Update selected order UI
            if (selectedOrder) {
                const userName = (assignRole === 'tailor' ? tailorsList : deliveryList).find(u => u._id === userId)?.name || 'Assigned';
                setSelectedOrder(prev => ({
                    ...prev,
                    [assignRole]: userName,
                    [`${assignRole}Id`]: userId
                }));
            }
        } catch (err) {
            console.error('Failed to assign:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleManageOrderDetails = async (orderId) => {
        setIsLoadingDetails(true);
        try {
            const res = await api.get(`/admin/orders/${orderId}`);
            if (res.data.success) {
                setManageOrderData(res.data.data);
                setIsManageOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch order details:', err);
            toast.error('Failed to load order details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const filteredOrders = ordersData.filter(o => {
        const matchesTab =
            selectedTab === 'All Orders' ||
            (selectedTab === 'Stitching Service' && o.type === 'Stitching') ||
            (selectedTab === 'Readymade Store' && o.type === 'Store');

        const matchesSearch =
            o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.service.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'accepted': return 'bg-indigo-50 text-primary border-indigo-100';
            case 'ready-for-pickup': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'out-for-delivery': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const availableStatuses = [
        "pending", "fabric-ready-for-pickup", "fabric-picked-up", "fabric-delivered",
        "accepted", "in-progress", "completed", "ready-for-pickup",
        "out-for-delivery", "delivered", "failed-delivery", "cancelled"
    ];

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order Management</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage and track all customer orders from end to end</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                        />
                    </div>
                    <button className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-primary transition-colors shrink-0 border border-transparent">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative">
                {isLoading && (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3"></div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-4">Order ID & Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Service / Type</th>
                                <th className="px-6 py-4">Assigned Tailor</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-primary uppercase group-hover:underline">{order.id}</span>
                                            <span className="text-[10px] text-gray-500 font-medium mt-0.5">{order.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">{order.customer}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{order.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">{order.service}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">{order.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        {order.tailor !== 'N/A' && (
                                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                                {order.tailor.charAt(0)}
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-gray-700">{order.tailor}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-gray-900">{order.amount}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                                {order.status.replace(/-/g, ' ')}
                                            </span>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-xs font-bold">
                                        No orders found for this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-out Detail Drawer */}
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
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                        Order {selectedOrder.id}
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border ${getStatusStyle(selectedOrder.status)}`}>
                                            {selectedOrder.status.replace(/-/g, ' ')}
                                        </span>
                                    </h2>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1">Placed on {selectedOrder.date}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 bg-white text-gray-400 hover:text-red-500 border border-gray-100 rounded-full shadow-sm hover:bg-red-50 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                                {/* Customer Info */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} /> Customer Details
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                                        <p className="text-sm font-bold text-gray-900">{selectedOrder.customer}</p>
                                        <p className="text-xs text-gray-600 font-medium">{selectedOrder.phone} • {selectedOrder.email}</p>
                                        <div className="flex items-start gap-2 pt-2 mt-2 border-t border-gray-200">
                                            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-[11px] text-gray-500 font-medium">{selectedOrder.address}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Spec */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Package size={12} /> Service Specifications
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{selectedOrder.service}</p>
                                                <p className="text-[10px] font-bold text-primary uppercase mt-1">{selectedOrder.type}</p>
                                            </div>
                                            <p className="text-sm font-black text-primary">{selectedOrder.amount}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                            <div>
                                                <p className="text-[9px] uppercase text-gray-400 font-bold">Measurements</p>
                                                <p className="text-xs font-bold text-gray-700 mt-0.5">{selectedOrder.measurements}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-gray-400 font-bold">Fabric Source</p>
                                                <p className="text-xs font-bold text-gray-700 mt-0.5">
                                                    {selectedOrder.items?.some(i => i.fabricSource === 'customer') ? 'Customer Pickup' : 'Self/Provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment & Payment */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2">
                                            <Scissors size={12} /> Assignments
                                        </h3>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold">Tailor</p>
                                                <p className="text-xs font-bold text-primary">{selectedOrder.tailor}</p>
                                            </div>
                                            <button onClick={() => { setAssignRole('tailor'); setIsAssignModalOpen(true); }} className="text-[10px] font-bold text-primary hover:underline">Reassign</button>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold">Delivery Partner</p>
                                                <p className="text-xs font-bold text-primary">{selectedOrder.deliveryPartner}</p>
                                            </div>
                                            <button onClick={() => { setAssignRole('deliveryPartner'); setIsAssignModalOpen(true); }} className="text-[10px] font-bold text-primary hover:underline">Reassign</button>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2 mb-3">
                                            <CreditCard size={12} /> Payment
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold">Status</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {selectedOrder.paymentStatus.toLowerCase() === 'paid' ? <CheckCircle2 size={14} className="text-green-500" /> : <div className="w-2 h-2 rounded-full bg-orange-400" />}
                                            <p className="text-xs font-bold text-gray-900 capitalize">{selectedOrder.paymentStatus}</p>
                                        </div>
                                        {selectedOrder.paymentStatus.toLowerCase() !== 'paid' && (
                                            <button
                                                onClick={() => handleUpdatePaymentStatus(selectedOrder.fullId, 'paid')}
                                                className="mt-2 text-[10px] font-black uppercase text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-all w-full flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle2 size={10} /> Mark as Paid
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tracking History Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Tracking Timeline
                                    </h3>
                                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {selectedOrder.trackingHistory.length > 0 ? (
                                            [...selectedOrder.trackingHistory].reverse().map((event, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-primary scale-125' : 'bg-gray-300'}`} />
                                                    <div className="bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{event.status.replace(/-/g, ' ')}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(event.timestamp).toLocaleDateString()}</p>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">{event.message}</p>
                                                        {event.proof && (
                                                            <a href={event.proof} target="_blank" rel="noreferrer" className="mt-2 block w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                                                                <img src={event.proof} alt="Proof" className="w-full h-full object-cover" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-gray-400 font-medium italic">No tracking updates yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Bottom */}
                            <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between gap-3 relative">
                                <div className="relative">
                                    <button
                                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                        className="px-6 py-3 border border-gray-200 text-gray-700 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest min-w-[150px]"
                                    >
                                        {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                                    </button>
                                    <AnimatePresence>
                                        {statusDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                                            >
                                                {availableStatuses.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleUpdateStatus(selectedOrder.fullId, status)}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary uppercase tracking-wider"
                                                    >
                                                        {status.replace(/-/g, ' ')}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={() => handleManageOrderDetails(selectedOrder.fullId)}
                                    disabled={isLoadingDetails || selectedOrder.isCustomBooking}
                                    className="px-6 py-3 bg-[#2D2F6E] text-white text-xs font-bold rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-[#2D2F6E]/20 transition-all uppercase tracking-wider flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingDetails ? 'Loading...' : 'Manage Order Details'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ===== MANAGE ORDER DETAILS MODAL ===== */}
            <AnimatePresence>
                {isManageOpen && manageOrderData && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                        onClick={() => setIsManageOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                        <Package size={18} className="text-[#2D2F6E]" />
                                        Order Details — {manageOrderData.orderId || manageOrderData._id?.substring(0, 8)}
                                    </h2>
                                    <p className="text-[10px] text-gray-500 font-medium mt-1">
                                        Full order breakdown with items, pricing, and delivery info
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsManageOpen(false)}
                                    className="p-2 bg-white text-gray-400 hover:text-red-500 border border-gray-100 rounded-full shadow-sm hover:bg-red-50 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body — Scrollable */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5">

                                {/* Summary Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">Status</p>
                                        <p className={`text-xs font-bold mt-1 capitalize ${manageOrderData.status === 'delivered' || manageOrderData.status === 'completed' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {manageOrderData.status?.replace(/-/g, ' ')}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">Payment</p>
                                        <p className={`text-xs font-bold mt-1 capitalize ${manageOrderData.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                            {manageOrderData.paymentStatus || 'pending'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">Total Amount</p>
                                        <p className="text-xs font-bold text-gray-900 mt-1">₹{(manageOrderData.totalAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">Order Date</p>
                                        <p className="text-xs font-bold text-gray-900 mt-1">{new Date(manageOrderData.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Customer & Address */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                        <h4 className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                                            <User size={12} /> Customer
                                        </h4>
                                        <p className="text-sm font-bold text-gray-900">{manageOrderData.customer?.name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{manageOrderData.customer?.phoneNumber || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{manageOrderData.customer?.email || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                        <h4 className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                                            <MapPin size={12} /> Delivery Address
                                        </h4>
                                        {manageOrderData.deliveryAddress ? (
                                            <div className="text-xs text-gray-700 space-y-0.5">
                                                <p className="font-medium">{manageOrderData.deliveryAddress.street}</p>
                                                <p>{manageOrderData.deliveryAddress.city}, {manageOrderData.deliveryAddress.state}</p>
                                                <p className="text-gray-500">{manageOrderData.deliveryAddress.zipCode}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 font-medium">No address provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* Team Assignments */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                                        <h4 className="text-[10px] font-semibold uppercase text-blue-400 tracking-wider mb-2 flex items-center gap-1.5">
                                            <Scissors size={12} /> Assigned Tailor
                                        </h4>
                                        {manageOrderData.tailor ? (
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{manageOrderData.tailor.name || manageOrderData.tailor.shopName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{manageOrderData.tailor.phoneNumber || 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-orange-500 font-medium">Not yet assigned</p>
                                        )}
                                    </div>
                                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl relative">
                                        <h4 className="text-[10px] font-semibold uppercase text-orange-400 tracking-wider mb-2 flex items-center gap-1.5">
                                            <Truck size={12} /> Delivery Partner
                                        </h4>
                                        {manageOrderData.deliveryPartner ? (
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{manageOrderData.deliveryPartner.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{manageOrderData.deliveryPartner.phoneNumber || 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-orange-500 font-medium">Not yet assigned</p>
                                        )}
                                        <div className="mt-3 pt-3 border-t border-orange-200/50 flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] uppercase text-orange-400 font-bold">Delivery Earning</p>
                                                <p className="text-xs font-bold text-gray-900 mt-0.5">₹{manageOrderData.deliveryFee || 0}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const fee = window.prompt("Enter new Delivery Boy Earning (₹):", manageOrderData.deliveryFee || 50);
                                                    if (fee !== null && fee.trim() !== '' && !isNaN(fee)) {
                                                        handleUpdateDeliveryFee(manageOrderData.fullId || manageOrderData._id, fee);
                                                    }
                                                }}
                                                className="text-[10px] font-bold text-primary hover:underline bg-white px-2 py-1 rounded border border-gray-200"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h4 className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1.5">
                                        <Package size={12} /> Order Items ({manageOrderData.items?.length || 0})
                                    </h4>
                                    <div className="space-y-3">
                                        {manageOrderData.items && manageOrderData.items.length > 0 ? (
                                            manageOrderData.items.map((item, idx) => (
                                                <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {item.service?.title || item.product?.name || `Item ${idx + 1}`}
                                                            </p>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                                <span className="text-[10px] text-gray-500">
                                                                    <span className="font-semibold text-gray-400">Qty:</span> {item.quantity || 1}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500">
                                                                    <span className="font-semibold text-gray-400">Fabric:</span> {item.fabricSource || 'N/A'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500">
                                                                    <span className="font-semibold text-gray-400">Delivery:</span> {item.deliveryType || 'standard'}
                                                                </span>
                                                            </div>
                                                            {/* Style Add-ons */}
                                                            {item.styleAddons && item.styleAddons.length > 0 && (
                                                                <div className="mt-2 pt-2 border-t border-gray-50">
                                                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Style Add-ons</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.styleAddons.map((addon, addonIdx) => (
                                                                            <span key={addonIdx} className="text-[10px] bg-indigo-50 text-[#2D2F6E] px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
                                                                                {addon.name} (+₹{addon.price || 0})
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Measurements */}
                                                            {item.measurements && Object.keys(item.measurements).length > 0 && (
                                                                <div className="mt-2 pt-2 border-t border-gray-50">
                                                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Measurements</p>
                                                                    <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                                                                        {Object.entries(item.measurements).map(([key, val]) => (
                                                                            val && typeof val !== 'object' && (
                                                                                <span key={key} className="text-[10px] text-gray-600">
                                                                                    <span className="text-gray-400 capitalize">{key}:</span> {val}"
                                                                                </span>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right ml-4 shrink-0">
                                                            <p className="text-sm font-bold text-[#2D2F6E]">₹{(item.price || 0).toLocaleString()}</p>
                                                            {item.styleAddonsTotal > 0 && (
                                                                <p className="text-[10px] text-gray-400 mt-0.5">+₹{item.styleAddonsTotal} add-ons</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-6 text-xs font-medium text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                                No items found for this order.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1.5">
                                        <CreditCard size={12} /> Price Breakdown
                                    </h4>
                                    <div className="space-y-2">
                                        {manageOrderData.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs">
                                                <span className="text-gray-600 font-medium">{item.service?.title || item.product?.name || `Item ${idx + 1}`} (x{item.quantity || 1})</span>
                                                <span className="font-bold text-gray-900">₹{(item.price || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {manageOrderData.deliveryCharge > 0 && (
                                            <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                                                <span className="text-gray-600 font-medium">Delivery Charge</span>
                                                <span className="font-bold text-gray-900">₹{manageOrderData.deliveryCharge}</span>
                                            </div>
                                        )}
                                        {manageOrderData.discount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-green-600 font-medium">Discount</span>
                                                <span className="font-bold text-green-600">-₹{manageOrderData.discount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                                            <span className="font-bold text-gray-900">Total</span>
                                            <span className="font-bold text-[#2D2F6E]">₹{(manageOrderData.totalAmount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Timeline */}
                                {manageOrderData.trackingHistory && manageOrderData.trackingHistory.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1.5">
                                            <Clock size={12} /> Tracking History ({manageOrderData.trackingHistory.length} events)
                                        </h4>
                                        <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                            {[...manageOrderData.trackingHistory].reverse().map((event, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-[#2D2F6E]' : 'bg-gray-300'}`} />
                                                    <div className="bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">{event.status?.replace(/-/g, ' ')}</p>
                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                {new Date(event.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-medium mt-1">{event.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => setIsManageOpen(false)}
                                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assign Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-black text-gray-900 capitalize">Assign {assignRole === 'tailor' ? 'Tailor' : 'Delivery Partner'}</h3>
                                <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {(assignRole === 'tailor' ? tailorsList : deliveryList).map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleAssign(user.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-bold flex justify-between items-center ${user.isActive ? 'border-gray-100 hover:border-primary hover:bg-primary/5 bg-white text-gray-700' : 'border-gray-50 bg-gray-50 opacity-50 cursor-not-allowed text-gray-400'}`}
                                        disabled={!user.isActive}
                                    >
                                        <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">Joined: {user.joined}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-medium">{user.phone}</span>
                                            <p className={`text-[8px] uppercase tracking-widest mt-0.5 ${user.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                {user.isActive ? 'Verified & Active' : 'Suspended'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                                {(assignRole === 'tailor' ? tailorsList : deliveryList).length === 0 && (
                                    <div className="text-center p-4 text-xs font-medium text-gray-400">No active {assignRole === 'tailor' ? 'tailors' : 'delivery partners'} found.</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrders;
