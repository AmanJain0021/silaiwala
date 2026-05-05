import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, X, User, MapPin, CheckCircle2, Truck, Star, Phone, Clock, FileText, Ban, Power, Package, ShieldCheck } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminDelivery = () => {
    const [selectedTab, setSelectedTab] = useState('All Partners');
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [deliveryData, setDeliveryData] = useState([]);
    const [pendingData, setPendingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [unassignedTasks, setUnassignedTasks] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState({}); // { orderId: partnerId }

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [partnersRes, pendingRes] = await Promise.all([
                api.get('/admin/delivery-partners'),
                api.get('/admin/delivery-partners/pending')
            ]);
            
            setDeliveryData(partnersRes.data.data.map(p => ({
                id: p._id,
                name: p.name,
                phone: p.phoneNumber || 'N/A',
                isVerified: p.isVerified,
                vehicle: p.profile?.vehicleType || 'Reg. Vehicle',
                rating: p.profile?.rating || 5.0,
                totalDeliveries: p.profile?.totalDeliveries || 0,
                activeTasks: 0,
                status: p.isActive ? 'Online' : 'Offline',
                joined: new Date(p.createdAt).toLocaleDateString()
            })));

            setPendingData(pendingRes.data.data.map(p => ({
                id: p._id,
                name: p.name,
                phone: p.phoneNumber,
                status: 'Pending Review',
                vehicle: p.profile?.vehicleType || 'Not Specified',
                vehicleNumber: p.profile?.vehicleNumber,
                documents: p.profile?.documents || [],
                submittedDate: new Date(p.createdAt).toLocaleDateString()
            })));
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load delivery data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnassignedTasks = async () => {
        try {
            const res = await api.get('/admin/orders?deliveryPartner=unassigned');
            const data = res.data.data.map(o => ({
                id: o.orderId || o._id.substring(0, 8),
                fullId: o._id,
                type: o.status.includes('fabric') ? 'Pickup' : 'Delivery',
                from: o.status.includes('fabric') ? o.customer?.name : o.tailor?.shopName || 'Tailor Shop',
                to: o.status.includes('fabric') ? o.tailor?.shopName || 'Tailor Shop' : o.customer?.name,
                timeSlot: 'ASAP',
                status: o.status
            }));
            setUnassignedTasks(data);
        } catch (err) {
            console.error('Failed to fetch unassigned tasks:', err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchUnassignedTasks();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/delivery-partners/${id}/approve`);
            setSelectedApp(null);
            toast.success('Rider approved successfully');
            fetchData();
        } catch (error) {
            console.error('Approval failed', error);
            toast.error('Failed to approve rider');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.delete(`/admin/delivery-partners/${id}/reject`);
            setSelectedApp(null);
            toast.success('Rider application rejected');
            fetchData();
        } catch (error) {
            console.error('Rejection failed', error);
            toast.error('Failed to reject application');
        }
    };

    const handleUpdateUserStatus = async (partnerId, isActive) => {
        try {
            await api.put(`/admin/users/${partnerId}/status`, { isActive });
            toast.success(isActive ? 'Partner activated' : 'Partner suspended');
            fetchData();
            if (selectedPartner && selectedPartner.id === partnerId) {
                setSelectedPartner(prev => ({ ...prev, status: isActive ? 'Online' : 'Offline' }));
            }
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update status');
        }
    };

    const handleAssignTask = async (orderId, partnerId) => {
        if (!partnerId) return toast.error('Please select a partner');
        setIsAssigning(true);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { deliveryPartner: partnerId });
            toast.success('Task assigned successfully');
            
            // Clear pending assignment for this order
            setPendingAssignments(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });

            fetchUnassignedTasks();
            fetchData();
        } catch (err) {
            console.error('Failed to assign task:', err);
            toast.error('Failed to assign task');
        } finally {
            setIsAssigning(false);
        }
    };

    const tabs = ['All Partners', 'Pending Applications', 'Manual Assignment'];

    const filteredPartners = deliveryData.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.phone.includes(searchQuery)
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Online': return 'bg-green-100 text-green-700 border-green-200';
            case 'Offline': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Management</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Monitor dispatch, view partner tracking, and manage payouts</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                            {tab === 'Manual Assignment' && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {unassignedTasks.length}
                                </span>
                            )}
                            {tab === 'Pending Applications' && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {pendingData.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search partners..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative">
                {isLoading && (
                     <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                         <div className="h-full bg-primary animate-pulse w-1/3"></div>
                     </div>
                )}
                {selectedTab === 'All Partners' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Rider Details</th>
                                    <th className="px-6 py-4">Vehicle Info</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Active Tasks</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPartners.map((partner) => (
                                    <tr
                                        key={partner.id}
                                        onClick={() => setSelectedPartner(partner)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-primary font-black text-sm">
                                                    {partner.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{partner.name}</span>
                                                        {partner.isVerified && (
                                                            <ShieldCheck size={12} className="text-primary fill-pink-50" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium">{partner.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-700">{partner.vehicle}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
                                                    <Star size={12} className="fill-orange-500" /> {partner.rating}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium">{partner.totalDeliveries} Deliveries</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${partner.activeTasks > 0 ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                                                {partner.activeTasks} Task{partner.activeTasks !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider flex w-max items-center gap-1.5 ${getStatusStyle(partner.status)}`}>
                                                <span className={`block w-1.5 h-1.5 rounded-full ${partner.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                {partner.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : selectedTab === 'Pending Applications' ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                        {pendingData.map((app) => (
                            <div key={app.id} className="bg-white border text-left border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-primary font-black text-lg">
                                            {app.name.charAt(0)}
                                        </div>
                                        <span className="px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider bg-orange-100 text-orange-700 border-orange-200">
                                            Pending Review
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-gray-900 mt-4">{app.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                                        <Truck size={12} className="text-gray-400" /> {app.vehicle}
                                    </div>
                                    <div className="flex gap-4 mt-4 text-[10px] text-gray-400 font-bold">
                                        <div className="flex items-center gap-1">
                                            <Phone size={12} /> {app.phone}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} /> {app.submittedDate}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button onClick={() => setSelectedApp(app)} className="w-full py-2.5 bg-gray-50 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-black uppercase tracking-widest rounded-xl border border-gray-100">
                                        Review KYC
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pendingData.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <CheckCircle2 size={40} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No pending applications</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Unassigned Tasks</h3>
                            <button className="text-xs font-bold text-primary hover:underline">Auto-Assign All</button>
                        </div>
                        {unassignedTasks.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Package size={40} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-sm font-bold text-gray-500">No unassigned tasks found</p>
                            </div>
                        ) : unassignedTasks.map((order) => (
                            <div key={order.fullId} className="bg-white border text-left border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase text-primary">{order.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${order.type === 'Pickup' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {order.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-widest">From</p>
                                                <p>{order.from}</p>
                                            </div>
                                        </div>
                                        <div className="text-gray-300">→</div>
                                        <div className="flex items-start gap-1.5">
                                            <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-widest">To</p>
                                                <p>{order.to}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <p className="text-[10px] text-gray-500 font-bold flex items-center justify-end gap-1"><Clock size={12} /> {order.timeSlot}</p>
                                    <select 
                                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none w-full"
                                        value={pendingAssignments[order.fullId] || ''}
                                        onChange={(e) => setPendingAssignments(prev => ({ ...prev, [order.fullId]: e.target.value }))}
                                    >
                                        <option value="">Select Partner</option>
                                        {deliveryData.filter(p => p.status === 'Online').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Online)</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => handleAssignTask(order.fullId, pendingAssignments[order.fullId])}
                                        disabled={isAssigning || !pendingAssignments[order.fullId]}
                                        className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-lg hover:bg-primary-dark transition-colors uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isAssigning ? 'Assigning...' : 'Assign Task'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Slide-out Partner Drawer */}
            <AnimatePresence>
                {selectedPartner && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedPartner(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-primary to-primary-dark text-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl relative">
                                        {selectedPartner.name.charAt(0)}
                                        <div className={`absolute -right-1 -top-1 w-4 h-4 rounded-full border-2 border-primary ${selectedPartner.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{selectedPartner.name}</h2>
                                        <p className="text-xs text-white/60 font-bold mt-1">ID: {selectedPartner.id}</p>
                                        <div className="mt-2 inline-block px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-white/10 text-white border border-white/20">
                                            {selectedPartner.vehicle}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPartner(null)}
                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fbfcfb]">

                                {/* Live Status */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-primary rounded-lg">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Status</p>
                                            <p className="text-sm font-black text-gray-900">{selectedPartner.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Tasks</p>
                                        <p className="text-xl font-black text-primary">{selectedPartner.activeTasks}</p>
                                    </div>
                                </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-orange-500"><Star size={20} className="fill-orange-500" /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedPartner.rating}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Rating</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-primary"><Package size={20} /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedPartner.totalDeliveries}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total Deliveries</p>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} /> Contact & Info
                                    </h3>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                            <Phone size={16} className="text-primary opacity-70" /> {selectedPartner.phone}
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                            <p className="text-xs font-bold text-gray-600">Joined Date</p>
                                            <span className="text-xs font-black text-gray-900">{selectedPartner.joined}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleUpdateUserStatus(selectedPartner.id, selectedPartner.status === 'Offline')}
                                    className={`px-4 py-3 border text-xs font-black rounded-xl transition-colors uppercase tracking-widest flex items-center justify-center gap-2 ${
                                        selectedPartner.status === 'Offline' 
                                        ? 'bg-indigo-50 text-primary border-indigo-100 hover:bg-indigo-100' 
                                        : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                    }`}
                                >
                                    {selectedPartner.status === 'Offline' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                                    {selectedPartner.status === 'Offline' ? 'Activate' : 'Suspend'}
                                </button>
                                <button 
                                    onClick={() => toast.info('Tracking feature available in next update')}
                                    className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-indigo-900/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    View Tracking
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Application Review Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedApp(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">Review Rider Application</h2>
                                    <button onClick={() => setSelectedApp(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                                            {selectedApp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">{selectedApp.name}</h3>
                                            <p className="text-sm font-bold text-primary uppercase tracking-widest">{selectedApp.vehicle} Driver</p>
                                            <div className="flex gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <Truck size={14} /> {selectedApp.vehicleNumber || 'No Number'}
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-gray-400 mt-2">{selectedApp.phone}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">KYC Documents</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                                selectedApp.documents.map((doc, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-primary/70"><FileText size={16} /></div>
                                                                <span className="text-sm font-bold text-gray-700">{doc.name}</span>
                                                            </div>
                                                            <div className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                                doc.status === 'verified' ? 'bg-green-100 text-green-600' : 
                                                                doc.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                                                                'bg-orange-100 text-orange-600'
                                                            }`}>
                                                                {doc.status}
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={doc.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] rounded-xl transition-all font-black text-[10px] text-primary uppercase tracking-widest"
                                                        >
                                                            View Document
                                                        </a>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No documents uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-4">
                                    <button onClick={() => handleReject(selectedApp.id)} className="py-3 bg-white border border-gray-200 text-red-600 text-xs font-black rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors uppercase tracking-widest">
                                        Reject Application
                                    </button>
                                    <button onClick={() => handleApprove(selectedApp.id)} className="py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-indigo-900/20 transition-all uppercase tracking-widest">
                                        Approve Rider
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDelivery;
