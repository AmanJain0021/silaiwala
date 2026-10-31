import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Truck, Home, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../../../utils/imageUrl';
import ReviewModal from './ReviewModal';
import {
    formatOrderItemsTitle,
    getItemImage,
    getItemLabel,
    getOrderItemCount,
    orderHasTailorAtHome,
} from '../../../../utils/orderItems';

const DEFAULT_GARMENT_IMAGE = 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1790608227/tailor_platform/z9cukm3gosnibmiv3ysk.jpg';

const OrderCard = ({ order }) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    const items = order.items || [];
    const serviceTitle = formatOrderItemsTitle(items, { fallback: 'Custom Stitching Order' });
    const deliveryType = items[0]?.deliveryType || 'Standard Delivery';
    const displayId = order.orderId || "ORD-0000";
    const status = (order.status || 'Pending').replace(/-/g, ' ').toUpperCase();
    const itemCount = getOrderItemCount(items);

    const getStatusBadgeStyle = (statusStr) => {
        const s = statusStr?.toLowerCase() || '';
        if (['accepted', 'delivered', 'completed', 'product-delivered', 'order-completed'].includes(s)) {
            return 'bg-green-50 text-green-600 border border-green-100';
        }
        if (['pending', 'in-progress', 'in progress', 'fabric-ready-for-pickup'].includes(s)) {
            return 'bg-orange-50 text-orange-500 border border-orange-100';
        }
        if (['cancelled'].includes(s)) {
            return 'bg-red-50 text-red-500 border border-red-100';
        }
        return 'bg-primary/5 text-primary border border-primary/10';
    };

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : "Date Unknown";

    const itemRawImg = getItemImage(items[0]);
    const mainImage = (itemRawImg && getImageUrl(itemRawImg)) ? getImageUrl(itemRawImg) : DEFAULT_GARMENT_IMAGE;
    
    const isTailorAtHome = orderHasTailorAtHome(items);

    return (
        <div className="bg-white rounded-[1.25rem] p-3 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all group block">
            <Link to={`/user/orders/${order._id || order.orderId}/track`} className="flex gap-3 h-full">
                {/* Left: Large Image */}
                <div className="w-[85px] shrink-0">
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <img
                            src={mainImage}
                            alt={serviceTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { 
                                e.target.onerror = null; 
                                e.target.src = DEFAULT_GARMENT_IMAGE; 
                            }}
                        />
                        {items.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                {items.length} items
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Content Stack */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Row 1: Status, Order ID, Price */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${getStatusBadgeStyle(order.status)}`}>
                                {status}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                #{displayId}
                            </span>
                            {order.createdByAdmin && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                    <Sparkles size={8} /> Admin Assisted
                                </span>
                            )}
                        </div>
                        <span className="text-[13px] font-black text-primary shrink-0 ml-1">₹{order.totalAmount || 0}</span>
                    </div>

                    {/* Row 2: Title & Arrow */}
                    <div className="flex justify-between items-center mb-1.5 mt-0.5">
                        <h3 className="text-[13px] sm:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 pr-2">
                            {serviceTitle}
                        </h3>
                        <ChevronRight size={14} className="text-gray-300 shrink-0 group-hover:text-primary transition-colors" />
                    </div>

                    {/* Row 3: Date and Delivery Type */}
                    <div className="flex items-center gap-3.5 text-[9px] sm:text-[10px] font-semibold text-gray-500 mb-2">
                        <div className="flex items-center gap-1 shrink-0">
                            <Calendar size={11} className="text-gray-400" />
                            {formattedDate}
                        </div>
                        <div className="flex items-center gap-1 truncate">
                            <Truck size={11} className="text-gray-400 shrink-0" />
                            <span className="truncate">{deliveryType}</span>
                        </div>
                    </div>

                    {/* Row 4: Items Summary and Action Button */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50/50">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="flex -space-x-1.5 shrink-0">
                                {items.slice(0, 3).map((item, idx) => {
                                    const subImg = getItemImage(item);
                                    return (
                                        <div
                                            key={item._id || idx}
                                            className="w-5 h-5 rounded-md overflow-hidden border border-white bg-gray-100"
                                        >
                                            <img 
                                                src={getImageUrl(subImg) || DEFAULT_GARMENT_IMAGE} 
                                                alt={getItemLabel(item)} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_GARMENT_IMAGE; }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 truncate capitalize">
                                {items.length > 1
                                    ? `${items.length} garments · qty ${itemCount}`
                                    : (
                                        <>
                                            <span className="truncate">{getItemLabel(items[0])}</span>
                                            <span className="text-gray-400 ml-1 font-semibold">x{items[0]?.quantity || 1}</span>
                                        </>
                                    )}
                            </span>
                        </div>

                        {/* Right: Badge for Visit vs Standard */}
                        {isTailorAtHome ? (
                            <span className="text-[8px] sm:text-[9px] font-extrabold text-[#843D9B] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase tracking-tight shrink-0 flex items-center gap-1">
                                <Home size={9} /> Doorstep Visit
                            </span>
                        ) : (
                            <span className="text-[8px] sm:text-[9px] font-extrabold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200/50 uppercase tracking-tight shrink-0">
                                {items[0]?.measurements?.type === 'sample' ? 'Sample Pickup' : 'Measurement Profile'}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Leave Review Action Button (Only when delivered) */}
            {['delivered', 'product-delivered', 'order-completed'].includes((order.status || '').toLowerCase()) && !order.isReviewed && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setIsReviewModalOpen(true);
                        }}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg transition-all"
                    >
                        Rate Order & Tailor
                    </button>
                </div>
            )}

            {/* Review Modal */}
            <ReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                orderId={order._id || order.orderId}
                tailorId={order.tailor?._id || order.tailor}
                deliveryPartnerId={order.deliveryPartner?._id || order.deliveryPartner}
                onSuccess={() => {
                    setIsReviewModalOpen(false);
                }}
            />
        </div>
    );
};

export default OrderCard;
