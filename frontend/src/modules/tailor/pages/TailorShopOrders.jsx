import React, { useCallback, useEffect, useState } from 'react';
import { Package, Loader2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import OfflineProductionPipeline from '../../admin/components/OfflineProductionPipeline';
import { getOfflineStatusLabel, offlineStatusStyle } from '../../admin/constants/offlineOrderStatus';

const TailorShopOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/tailors/offline-orders?status=active');
            if (res.data.success) {
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
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatus = async (orderId, status) => {
        setUpdatingId(orderId);
        try {
            const res = await api.patch(`/tailors/offline-orders/${orderId}/status`, { status });
            if (res.data.success) {
                window._lastStatusToastTime = Date.now();
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

    return (
        <div className="max-w-lg mx-auto space-y-4 pb-24">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Store size={22} />
                </div>
                <div>
                    <h1 className="text-lg font-black text-gray-900">Shop orders</h1>
                    <p className="text-xs text-gray-500">Walk-in customers assigned to you</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={28} />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <Package className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-sm font-bold text-gray-600">No active shop orders</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <button
                            key={order._id}
                            type="button"
                            onClick={() => setSelected(order)}
                            className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${
                                selected?._id === order._id ? 'border-primary shadow-md' : 'border-gray-100'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                                        {order.orderId}
                                    </p>
                                    <p className="text-sm font-black text-gray-900">{order.garmentType}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {order.offlineCustomer?.name} · {order.offlineCustomer?.phone}
                                    </p>
                                </div>
                                <span
                                    className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black border uppercase ${offlineStatusStyle(order.status)}`}
                                >
                                    {getOfflineStatusLabel(order.status)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-100 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto p-5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider">{selected.orderId}</p>
                    <h2 className="text-base font-black text-gray-900">{selected.garmentType}</h2>
                    <p className="text-xs text-gray-500 mb-4">{selected.offlineCustomer?.name}</p>
                    <OfflineProductionPipeline
                        currentStatus={selected.status}
                        onSelectStatus={(status) => handleStatus(selected._id, status)}
                        disabled={updatingId === selected._id}
                        compact
                    />
                    <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="w-full mt-4 py-2.5 text-xs font-black text-gray-500 uppercase tracking-wider"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default TailorShopOrders;
