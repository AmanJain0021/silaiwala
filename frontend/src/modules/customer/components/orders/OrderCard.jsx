import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Package, MapPin } from 'lucide-react';
import { getImageUrl } from '../../../../utils/imageUrl';

const OrderCard = ({ order }) => {
    const serviceTitle = order.items?.[0]?.service?.title || order.items?.[0]?.product?.name || "Custom Stitching";
    const deliveryType = order.items?.[0]?.deliveryType || "Standard";
    const displayId = order.orderId || "ORD-0000";
    const status = order.status?.replace(/-/g, ' ').toUpperCase();

    // Status color logic
    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s?.includes('delivered')) return 'bg-green-50 text-green-600 border-green-100';
        if (s?.includes('cancelled')) return 'bg-indigo-50 text-red-600 border-indigo-100';
        if (s?.includes('pending')) return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-indigo-50 text-primary border-indigo-100';
    };

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : "Date Unknown";

    return (
        <Link to={`/user/orders/${order._id}/track`} className="block bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="flex gap-3 sm:gap-4">
                {/* 1. Image */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                    <img
                        src={getImageUrl(order.items?.[0]?.service?.image || order.items?.[0]?.product?.image) || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200"}
                        alt={serviceTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* 2. Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {status}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[60px]">
                            #{displayId}
                        </span>
                    </div>

                    <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-1 group-hover:text-[#2D2F6E] transition-colors uppercase tracking-tight">
                            {serviceTitle}
                        </h3>
                        <span className="text-xs sm:text-sm font-black text-[#2D2F6E] shrink-0">₹{order.totalAmount || 0}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] sm:text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                            <Calendar size={10} className="text-gray-400" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Package size={10} className="text-gray-400" />
                            <span>{deliveryType}</span>
                        </div>
                    </div>

                    {/* Additional Order Info Summary */}
                    {order.items && order.items.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-1.5 text-[9px] sm:text-[10px] bg-gray-50/80 p-2 sm:p-2.5 rounded-xl border border-gray-100/50">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="flex -space-x-1 shrink-0">
                                            <img 
                                                src={getImageUrl(item.service?.image || item.product?.image) || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200"} 
                                                alt="" 
                                                className="w-5 h-5 rounded-md object-cover border border-white relative z-10"
                                            />
                                            {item.selectedFabric?.images?.[0] && (
                                                <img 
                                                    src={getImageUrl(item.selectedFabric.images[0])} 
                                                    alt="Fabric" 
                                                    className="w-5 h-5 rounded-md object-cover border border-white relative z-0"
                                                />
                                            )}
                                        </div>
                                        <span className="text-gray-600 font-bold truncate line-clamp-1 leading-tight">
                                            {item.service?.title || item.product?.name} 
                                            {item.selectedFabric && <span className="font-normal text-[8px] ml-1">w/ Fabric</span>}
                                            <span className="text-gray-400 ml-1">x{item.quantity}</span>
                                        </span>
                                    </div>
                                    {item.measurements?.type && (
                                        <span className="shrink-0 text-[8px] font-black text-primary uppercase bg-white border border-indigo-50 px-1.5 py-0.5 rounded-md shadow-sm">
                                            {item.measurements.type === 'home' ? 'Tailor at Home' :
                                             item.measurements.type === 'sample' ? 'Sample Garment' :
                                             item.measurements.type === 'slip' ? 'Slip Uploaded' :
                                             item.measurements.type === 'saved' ? 'Saved Profile' : 'Self Measured'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Arrow */}
                <div className="self-center text-gray-300 group-hover:text-[#2D2F6E] transition-colors shrink-0">
                    <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </div>
            </div>
        </Link>
    );
};

export default OrderCard;
