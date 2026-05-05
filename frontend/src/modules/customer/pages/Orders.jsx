import React, { useEffect } from 'react';
import { Package, Search, ListFilter } from 'lucide-react';
import useOrderStore from '../../../store/orderStore';
import OrderCard from '../components/orders/OrderCard';
import BottomNav from '../components/BottomNav';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import useAuthStore from '../../../store/authStore';

const OrdersPage = () => {
    const { orders, fetchOrders, isLoading } = useOrderStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchOrders();

        const socket = io(SOCKET_URL);

        if (user?.id || user?._id) {
            const userId = user.id || user._id;
            socket.emit('join', `user_${userId}`);
        }

        socket.on('new_notification', (data) => {
            console.log('Order status update received:', data);
            fetchOrders();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchOrders, user?.id, user?._id]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* 1. Header */}
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-[#2D2F6E] shadow-md px-4 py-4 pt-safe">
                <h1 className="text-xl font-bold text-white mb-1">My Orders</h1>
                <p className="text-xs text-gray-300">Track and manage your requests</p>
            </div>

            {/* 2. Filters & Search (Mock) */}
            <div className="max-w-7xl mx-auto px-4 py-3 bg-white border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                <div className="bg-gray-100 rounded-full px-3 py-1.5 flex items-center gap-2 min-w-[200px] flex-1">
                    <Search size={14} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="bg-transparent text-xs w-full focus:outline-none"
                    />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium whitespace-nowrap text-gray-600 active:bg-gray-50">
                    <ListFilter size={14} />
                    All Status
                </button>
            </div>

            {/* 3. Orders List */}
            <div className="max-w-7xl mx-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-10 h-10 border-4 border-[#2D2F6E] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs text-gray-500">Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <Package size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-sm font-bold text-gray-900">No Orders Yet</h3>
                        <p className="text-xs text-gray-500 max-w-[200px] mt-1">
                            Your order history will appear here once you place an order.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orders.map((order, index) => (
                            <OrderCard key={order._id || index} order={order} />
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default OrdersPage;
