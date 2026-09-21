import React from 'react';
import { X, Phone, MapPin, Navigation, Package, ExternalLink } from 'lucide-react';

const CustomerDetailsModal = ({ isOpen, onClose, request }) => {
    if (!isOpen || !request) return null;

    const customer = request.customer;
    const customerAddress = request.customerAddress;
    const order = request.order;

    const mapsUrl = request.customerLocation?.coordinates 
        ? `https://www.google.com/maps/dir/?api=1&destination=${request.customerLocation.coordinates[1]},${request.customerLocation.coordinates[0]}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#581C87] flex items-center justify-center font-bold text-sm">
                            {customer?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">{customer?.name || 'Customer Details'}</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Order #{order?.orderId || 'SZ12568'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Phone */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#581C87]">
                                <Phone size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                                <p className="text-sm font-semibold text-gray-800">{customer?.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>
                        {customer?.phoneNumber && (
                            <a
                                href={`tel:${customer.phoneNumber}`}
                                className="px-3 py-1.5 bg-purple-100 text-[#581C87] hover:bg-[#581C87] hover:text-white rounded-xl text-xs font-bold transition-all"
                            >
                                Call
                            </a>
                        )}
                    </div>

                    {/* Address */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                            <MapPin size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer Address</p>
                            <p className="text-xs font-medium text-gray-800 leading-relaxed mt-0.5">
                                {customerAddress?.street ? `${customerAddress.street}, ` : ''}
                                {customerAddress?.city || ''} {customerAddress?.state || ''} {customerAddress?.zipCode || ''}
                            </p>
                            {mapsUrl && (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-[#581C87] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#4A154B] transition-colors"
                                >
                                    <Navigation size={13} />
                                    <span>Open in Google Maps</span>
                                    <ExternalLink size={11} className="opacity-70" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Order Details */}
                    {order?.items?.length > 0 && (
                        <div className="p-3.5 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={15} className="text-[#581C87]" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Items Ordered</p>
                            </div>
                            <div className="space-y-1.5">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-gray-100">
                                        <span className="font-semibold text-gray-800">
                                            {item.service?.title || item.service?.name || `Item ${idx + 1}`}
                                        </span>
                                        <span className="text-gray-500 font-medium">
                                            Qty: {item.quantity || 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
