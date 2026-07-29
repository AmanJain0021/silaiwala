import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, MessageCircle, ExternalLink } from 'lucide-react';
import {
    getOfflineTrackUrl,
    getOfflineTrackQrUrl,
    normalizePhoneForWhatsApp,
    buildOfflineReceiptWhatsAppMessage,
} from '../utils/offlineReceipt';

const formatStatus = (status) =>
    (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const OfflineOrderReceiptModal = ({ order, onClose }) => {
    if (!order) return null;

    const balanceDue = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0));
    const trackUrl = getOfflineTrackUrl(order.trackingToken);
    const qrUrl = getOfflineTrackQrUrl(order.trackingToken, 200);

    const whatsAppHref = useMemo(() => {
        const phone = order.offlineCustomer?.phone;
        const normalized = normalizePhoneForWhatsApp(phone);
        if (!normalized) return null;
        const text = buildOfflineReceiptWhatsAppMessage(order, trackUrl);
        return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
    }, [order, trackUrl]);

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    .offline-receipt-print, .offline-receipt-print * { visibility: visible !important; }
                    .offline-receipt-print {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 24px !important;
                    }
                    .print-hide { display: none !important; }
                }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 print-hide">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 print-hide">
                        <h2 className="text-lg font-black text-gray-900">Order Receipt</h2>
                        <div className="flex items-center gap-2">
                            {whatsAppHref && (
                                <a
                                    href={whatsAppHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-green-700"
                                >
                                    <MessageCircle size={14} /> WhatsApp
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-primary-dark"
                            >
                                <Printer size={14} /> Print
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-gray-900"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="offline-receipt-print space-y-5 text-gray-900">
                            <div className="text-center border-b border-gray-200 pb-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                    Offline Shop Receipt
                                </p>
                                <h1 className="text-2xl font-black mt-1">{order.orderId}</h1>
                                <p className="text-xs text-gray-500 mt-1">
                                    {order.createdAt
                                        ? new Date(order.createdAt).toLocaleString()
                                        : new Date().toLocaleString()}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                                    <p className="font-bold">{order.offlineCustomer?.name || '—'}</p>
                                    <p className="text-xs text-gray-500">{order.offlineCustomer?.phone || ''}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Garment</p>
                                    <p className="font-bold">{order.garmentType}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {order.stitchingPackage || 'basic'} · {order.fabricSource || 'customer'} fabric
                                    </p>
                                </div>
                            </div>

                            {order.expectedCompletionDate && (
                                <div className="text-sm bg-primary/5 border border-primary/10 rounded-2xl p-3">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Expected Completion Date</p>
                                    <p className="font-bold text-gray-900 mt-0.5">
                                        {new Date(order.expectedCompletionDate).toLocaleDateString('en-IN', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}

                            <div className="text-sm bg-gray-50 rounded-2xl p-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Handoff</p>
                                <p className="font-bold mt-0.5">
                                    {order.fulfillmentMethod === 'home_delivery'
                                        ? 'Home delivery'
                                        : 'Customer pickup at shop'}
                                </p>
                                {order.fulfillmentMethod === 'home_delivery' && order.deliveryAddress && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        {typeof order.deliveryAddress === 'object'
                                            ? [order.deliveryAddress.street || order.deliveryAddress.addressLine1 || order.deliveryAddress.flat, order.deliveryAddress.landmark, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode || order.deliveryAddress.zipCode].filter(Boolean).join(', ') || 'Home delivery address'
                                            : String(order.deliveryAddress)}
                                    </p>
                                )}
                                {(order.deliveryFee || 0) > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Delivery fee: ₹{order.deliveryFee.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Stitching</span>
                                    <span className="font-bold">₹{(order.stitchingCharges || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Add-ons</span>
                                    <span className="font-bold">₹{(order.addOnsTotal || 0).toLocaleString()}</span>
                                </div>
                                {(order.discountAmount || 0) > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span>Discount</span>
                                        <span className="font-bold">-₹{order.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                                    <span className="font-black">Total</span>
                                    <span className="font-black text-primary">
                                        ₹{(order.totalAmount || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Advance received</span>
                                    <span className="font-bold">₹{(order.advancePaid || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Balance due</span>
                                    <span className="font-black text-amber-700">₹{balanceDue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                    <span className="text-gray-400 uppercase tracking-wider">Status</span>
                                    <span className="font-bold">{formatStatus(order.status)}</span>
                                </div>
                            </div>

                            {order.shopTailor?.name && (
                                <p className="text-xs text-gray-600">
                                    <span className="font-bold">Assigned tailor:</span> {order.shopTailor.name}
                                </p>
                            )}

                            {trackUrl && qrUrl && (
                                <div className="flex flex-col sm:flex-row items-center gap-4 border border-gray-100 rounded-2xl p-4">
                                    <img
                                        src={qrUrl}
                                        alt="Scan to track order"
                                        className="h-[200px] w-[200px] rounded-xl border border-gray-100"
                                    />
                                    <div className="text-center sm:text-left flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                            Scan to track
                                        </p>
                                        <p className="text-xs text-gray-600 mt-2 break-all">{trackUrl}</p>
                                        <a
                                            href={trackUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 mt-3 text-[10px] font-black text-primary uppercase tracking-wider print-hide"
                                        >
                                            Open track page <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {!order.trackingToken && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                    Tracking link is being generated — reopen this receipt from order details.
                                </p>
                            )}

                            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest pt-2">
                                Thank you for visiting our shop
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default OfflineOrderReceiptModal;
