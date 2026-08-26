import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Truck, Home } from 'lucide-react';
import { getImageUrl } from '../../../../utils/imageUrl';
import ReviewModal from './ReviewModal';

const OrderCard = ({ order }) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    const serviceTitle = order.items?.[0]?.service?.title || order.items?.[0]?.service?.name || order.items?.[0]?.product?.name || "Custom Stitching";
    const deliveryType = order.items?.[0]?.deliveryType || "Standard Delivery";
    const displayId = order.orderId || "ORD-0000";
    const status = (order.status || 'Pending').replace(/-/g, ' ').toUpperCase();

    const getStatusBadgeStyle = (statusStr) => {
        const s = statusStr?.toLowerCase() || '';
        if (['accepted', 'delivered', 'completed', 'product-delivered', 'order-completed'].includes(s)) {
            return 'bg-green-50 text-green-600 border border-green-100';
        }
        if (['pending', 'in-progress', 'in progress'].includes(s)) {
            return 'bg-orange-50 text-orange-500 border border-orange-100';
        }
        if (['cancelled'].includes(s)) {
            return 'bg-red-50 text-red-500 border border-red-100';
        }
        return 'bg-[#F8F5FF] text-[#843D9B] border border-[#843D9B]/10';
    };

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : "Date Unknown";

    const mainImage = getImageUrl(order.items?.[0]?.service?.image || order.items?.[0]?.product?.image) || "https://placehold.co/400x500/e6e8f0/843d9b?text=Order";
    
    // Tailor at Home logic: if measurement type is home
    const isTailorAtHome = order.items?.some(item => item.measurements?.type === 'home');
    const firstItemQty = order.items?.[0]?.quantity || 1;

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
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x500/e6e8f0/843d9b?text=Order'; }}
                        />
                    </div>
                </div>

                {/* Right: Content Stack */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Row 1: Status, Order ID, Price */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${getStatusBadgeStyle(order.status)}`}>
                                {status}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                #{displayId}
                            </span>
                        </div>
                        <span className="text-[13px] font-black text-[#843D9B] shrink-0 ml-1">₹{order.totalAmount || 0}</span>
                    </div>

                    {/* Row 2: Title & Arrow */}
                    <div className="flex justify-between items-center mb-1.5 mt-0.5">
                        <h3 className="text-[13px] sm:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 pr-2">
                            {serviceTitle}
                        </h3>
                        <ChevronRight size={14} className="text-gray-300 shrink-0 group-hover:text-[#843D9B] transition-colors" />
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
                            <div className="w-5 h-5 rounded-md overflow-hidden border border-gray-200 shrink-0">
                                <img 
                                    src={mainImage} 
                                    alt="thumbnail" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e6e8f0/843d9b?text=Item'; }}
                                />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 truncate capitalize flex items-center">
                                <span className="truncate">{serviceTitle.toLowerCase()}</span>
                                <span className="text-gray-400 ml-1 font-semibold">x{firstItemQty}</span>
                            </span>
                        </div>
                        
                        {isTailorAtHome ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-[#843D9B]/30 text-[#843D9B] text-[8px] font-black uppercase tracking-wider bg-white shrink-0 shadow-sm">
                                <Home size={10} /> TAILOR AT HOME
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-gray-500 text-[8px] font-black uppercase tracking-wider bg-gray-50 shrink-0">
                                {order.items?.[0]?.measurements?.type === 'sample' ? 'Sample Garment' :
                                 order.items?.[0]?.measurements?.type === 'slip' ? 'Slip Uploaded' :
                                 order.items?.[0]?.measurements?.type === 'saved' ? 'Saved Profile' : 'Self Measured'}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Review Button & Logic */}
            {['delivered', 'product-delivered', 'order-completed'].includes((order.status || '').toLowerCase()) && !order.isReviewed && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsReviewModalOpen(true);
                        }}
                        className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-amber-50 border border-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors shadow-sm"
                    >
                        Rate Experience
                    </button>
                </div>
            )}

            <ReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                orderId={order._id || order.orderId}
                tailorId={order.tailor?._id || order.tailor}
                deliveryPartnerId={order.deliveryPartner?._id || order.deliveryPartner}
                onSuccess={() => {
                    setIsReviewModalOpen(false);
                    if (window.location.pathname.includes('/user/orders')) {
                        window.location.reload();
                    }
                }}
            />
        </div>
    );
};

export default OrderCard;
