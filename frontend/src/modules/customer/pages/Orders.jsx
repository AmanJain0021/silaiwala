import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Search, ListFilter, Ruler } from 'lucide-react';
import useOrderStore from '../../../store/orderStore';
import OrderCard from '../components/orders/OrderCard';
import AlterationCard from '../components/orders/AlterationCard';
import CustomDesignCard from '../components/orders/CustomDesignCard';
import BottomNav from '../components/BottomNav';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import useAuthStore from '../../../store/authStore';
import { getToken } from '../../../utils/auth';
import api from '../../../utils/api';

const OrdersPage = () => {
    const location = useLocation();
    const { orders, fetchOrders, isLoading } = useOrderStore();
    const { user } = useAuthStore();
    const [alterations, setAlterations] = useState([]);
    const [customDesigns, setCustomDesigns] = useState([]);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'orders'); // 'orders', 'alterations', 'custom-designs'
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchOrders();
        fetchAlterations();
        fetchCustomDesigns();

        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });

        if (user?.id || user?._id) {
            const userId = user.id || user._id;
            const joinOwnRoom = () => socket.emit('join_user_room', String(userId));
            socket.on('connect', joinOwnRoom);
            joinOwnRoom();
        }

        socket.on('new_notification', (data) => {
            console.log('Notification received:', data);
            fetchOrders();
        });

        socket.on('order_status_updated', (data) => {
            console.log('Order status update received:', data);
            fetchOrders();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchOrders, user?.id, user?._id]);

    const fetchAlterations = async () => {
        try {
            const res = await api.get('/alterations');
            if (res.data.success) {
                setAlterations(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch alterations:', error);
        }
    };

    const fetchCustomDesigns = async () => {
        try {
            const res = await api.get('/custom-designs');
            if (res.data.success) {
                setCustomDesigns(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch custom designs:', error);
        }
    };

    const matchSearch = (item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const idMatch = (item.orderId || item._id || '').toLowerCase().includes(q);
        
        let detailsMatch = false;
        if (item.items) {
            detailsMatch = item.items.some(i => (i.service?.name || '').toLowerCase().includes(q) || (i.fabric?.name || '').toLowerCase().includes(q));
        } else if (item.garmentType) {
            detailsMatch = item.garmentType.toLowerCase().includes(q);
        } else if (item.designType || item.referenceStyle) {
            detailsMatch = ((item.designType || '') + ' ' + (item.referenceStyle || '')).toLowerCase().includes(q);
        }
        return idMatch || detailsMatch;
    };

    const filteredOrders = (orders || []).filter(o => (filterStatus === 'All' || (o.status || '').toLowerCase() === filterStatus.toLowerCase()) && matchSearch(o));
    const filteredAlterations = (alterations || []).filter(a => (filterStatus === 'All' || (a.status || '').toLowerCase() === filterStatus.toLowerCase()) && matchSearch(a));
    const filteredCustomDesigns = (customDesigns || []).filter(d => (filterStatus === 'All' || (d.status || '').toLowerCase() === filterStatus.toLowerCase()) && matchSearch(d));

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans">
            {/* 1. Header */}
            <div className="sticky top-0 md:top-20 z-50 bg-[#843D9B] shadow-md px-4 md:px-6 lg:px-8 pt-safe pb-4 md:rounded-b-2xl">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1 pt-2">My Orders</h1>
                <p className="text-xs text-gray-300 pt-1">Track and manage your requests</p>
            </div>

            {/* 2. Filters & Search (Static) */}
            <div className="px-4 md:px-6 lg:px-8 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2">
                <div className="bg-gray-100 rounded-full px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by ID or details..."
                        className="bg-transparent text-[11px] w-full focus:outline-none"
                    />
                </div>
                <div className="relative flex items-center">
                    <ListFilter size={14} className="absolute left-3 text-gray-600 pointer-events-none" />
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-full text-[11px] font-black whitespace-nowrap text-gray-600 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="All">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-6 lg:px-8 py-2 flex gap-4 border-b border-gray-100 bg-white overflow-x-auto custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 text-sm font-bold whitespace-nowrap ${activeTab === 'orders' ? 'text-[#843D9B] border-b-2 border-[#843D9B]' : 'text-gray-400'}`}
                >
                    Orders
                </button>
                <button 
                    onClick={() => setActiveTab('alterations')}
                    className={`pb-2 text-sm font-bold whitespace-nowrap ${activeTab === 'alterations' ? 'text-[#843D9B] border-b-2 border-[#843D9B]' : 'text-gray-400'}`}
                >
                    Alterations
                </button>
                <button 
                    onClick={() => setActiveTab('custom-designs')}
                    className={`pb-2 text-sm font-bold whitespace-nowrap ${activeTab === 'custom-designs' ? 'text-[#843D9B] border-b-2 border-[#843D9B]' : 'text-gray-400'}`}
                >
                    Custom Designs
                </button>
            </div>

            {/* 3. Orders List */}
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-10 h-10 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs text-gray-500">Loading your {activeTab}...</p>
                    </div>
                ) : activeTab === 'orders' ? (
                    filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <Package size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-sm font-bold text-gray-900">No Orders Yet</h3>
                            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
                                Your order history will appear here once you place an order.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredOrders.map((order, index) => (
                                <OrderCard key={order._id || index} order={order} />
                            ))}
                        </div>
                    )
                ) : activeTab === 'alterations' ? (
                    filteredAlterations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <Ruler size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-sm font-bold text-gray-900">No Alterations</h3>
                            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
                                Your alteration requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredAlterations.map((alt, index) => (
                                <AlterationCard key={alt._id || index} alteration={alt} onPaymentSuccess={() => { fetchAlterations(); fetchOrders(); }} />
                            ))}
                        </div>
                    )
                ) : (
                    filteredCustomDesigns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <Ruler size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-sm font-bold text-gray-900">No Custom Designs</h3>
                            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
                                Your custom design requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredCustomDesigns.map((design, index) => (
                                <CustomDesignCard key={design._id || index} design={design} onPaymentSuccess={() => { fetchCustomDesigns(); fetchOrders(); }} />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* 4. Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default OrdersPage;
