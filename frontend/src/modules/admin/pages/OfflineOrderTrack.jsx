import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Package, RefreshCw, CheckCircle2, Clock, Check } from 'lucide-react';
import { API_URL, SOCKET_URL } from '../../../config/constants';
import { getOfflineStatusLabel, offlineStatusStyle } from '../constants/offlineOrderStatus';

const OfflineOrderTrackPage = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [liveConnected, setLiveConnected] = useState(false);

    const fetchStatus = useCallback(async () => {
        if (!token) return;
        try {
            const base = API_URL.replace(/\/$/, '');
            const res = await fetch(`${base}/public/offline-orders/track/${token}`);
            const json = await res.json();
            if (!res.ok || !json.success) {
                setError(json.message || 'Order not found');
                setData(null);
            } else {
                setError(null);
                setData(json.data);
                setLastUpdated(new Date());
            }
        } catch {
            setError('Unable to load order status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    useEffect(() => {
        if (!token) return undefined;

        const socket = io(`${SOCKET_URL}/offline-track`, {
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            socket.emit('join_offline_track', token);
            setLiveConnected(true);
        });
        socket.on('disconnect', () => setLiveConnected(false));
        socket.on('offline_order_status', () => {
            fetchStatus();
        });

        return () => {
            socket.disconnect();
        };
    }, [token, fetchStatus]);

    const pipeline = data?.pipeline || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-soft/30 to-gray-50 px-4 py-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-3">
                        <Package size={28} />
                    </div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Order Status</h1>
                    <p className="text-xs text-gray-500 mt-1">Walk-in shop order — no login required</p>
                </div>

                {isLoading && !data && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-widest">Loading...</p>
                    </div>
                )}

                {error && !data && (
                    <div className="bg-white rounded-3xl border border-red-100 p-8 text-center shadow-sm">
                        <p className="text-sm font-bold text-red-600">{error}</p>
                        <button
                            onClick={() => {
                                setIsLoading(true);
                                fetchStatus();
                            }}
                            className="mt-4 text-xs font-black text-primary uppercase tracking-wider"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                {data.orderId}
                            </p>
                            <h2 className="text-lg font-black text-gray-900 mt-1">{data.garmentType}</h2>
                            <p className="text-xs text-gray-500 mt-1">Hello, {data.customerName}</p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${offlineStatusStyle(data.status)}`}
                                >
                                    {data.statusLabel || getOfflineStatusLabel(data.status)}
                                </span>
                                <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-gray-50 text-gray-600 border-gray-100">
                                    {data.paymentStatus}
                                </span>
                                <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-100">
                                    {data.fulfillmentMethod === 'home_delivery'
                                        ? data.fulfillmentStatus === 'out_for_delivery'
                                            ? 'Out for delivery'
                                            : 'Home delivery'
                                        : data.fulfillmentStatus === 'awaiting_pickup'
                                          ? 'Ready for pickup'
                                          : 'Shop pickup'}
                                </span>
                            </div>

                            {data.fulfillmentMethod === 'home_delivery' && data.deliveryAddress && (
                                <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl p-3">
                                    <span className="font-bold text-gray-800">Deliver to: </span>
                                    {typeof data.deliveryAddress === 'object'
                                        ? [data.deliveryAddress.street || data.deliveryAddress.addressLine1 || data.deliveryAddress.flat, data.deliveryAddress.landmark, data.deliveryAddress.city, data.deliveryAddress.state, data.deliveryAddress.pincode || data.deliveryAddress.zipCode].filter(Boolean).join(', ') || 'Home delivery address'
                                        : String(data.deliveryAddress)}
                                </p>
                            )}
                            {data.fulfillmentMethod !== 'home_delivery' && data.status === 'ready' && (
                                <p className="mt-3 text-xs text-primary font-bold bg-primary/5 rounded-xl p-3">
                                    Your order is ready — please collect it from the shop.
                                </p>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                                    <p className="text-lg font-black text-gray-900">
                                        ₹{(data.totalAmount || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Balance</p>
                                    <p className="text-lg font-black text-amber-700">
                                        ₹{(data.balanceDue || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {pipeline.length > 0 && data.status !== 'cancelled' && (
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                    Production progress
                                </h3>
                                <div className="space-y-0">
                                    {pipeline.map((step, idx) => (
                                        <div key={step.value} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${
                                                        step.state === 'done'
                                                            ? 'bg-primary border-primary text-white'
                                                            : step.state === 'current'
                                                              ? 'border-primary text-primary bg-white'
                                                              : 'border-gray-200 text-gray-300'
                                                    }`}
                                                >
                                                    {step.state === 'done' ? (
                                                        <Check size={12} strokeWidth={3} />
                                                    ) : (
                                                        <span className="text-[9px] font-black">{idx + 1}</span>
                                                    )}
                                                </div>
                                                {idx < pipeline.length - 1 && (
                                                    <div
                                                        className={`w-0.5 min-h-[10px] my-0.5 ${
                                                            step.state === 'done' ? 'bg-primary' : 'bg-gray-200'
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                            <p
                                                className={`text-xs font-bold pb-3 ${
                                                    step.state === 'current' ? 'text-primary' : 'text-gray-600'
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Clock size={12} /> Updates
                                </h3>
                                <button
                                    type="button"
                                    onClick={fetchStatus}
                                    className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1"
                                >
                                    <RefreshCw size={12} /> Refresh
                                </button>
                            </div>
                            {(data.history || []).length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No updates yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {[...(data.history || [])].reverse().map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 border-l-2 border-primary/30 pl-3 py-1"
                                        >
                                            <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    {h.label || getOfflineStatusLabel(h.status)}
                                                </p>
                                                {h.message && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5">{h.message}</p>
                                                )}
                                                {h.timestamp && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(h.timestamp).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {lastUpdated && (
                            <p className="text-[10px] text-center text-gray-400">
                                {liveConnected ? 'Live updates on' : 'Polling'} · Last updated{' '}
                                {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                )}

                <p className="text-center mt-8 text-[10px] text-gray-400">
                    <Link to="/" className="text-primary font-bold hover:underline">
                        Sewzella / Silaiwala
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default OfflineOrderTrackPage;
