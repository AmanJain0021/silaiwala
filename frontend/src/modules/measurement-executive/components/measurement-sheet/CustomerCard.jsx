import React from 'react';
import { Phone, MapPin, ChevronRight, Check } from 'lucide-react';

const DressIcon = ({ className = "w-4 h-4 text-[#6C2E9C]" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M8 2h8l2 5-3 2v13H9V9L6 7l2-5z" />
        <path d="M10 2v3a2 2 0 0 0 4 0V2" />
    </svg>
);

const PantsIcon = ({ className = "w-4 h-4 text-[#6C2E9C]" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M4 4h16l-1 17-5-1-2-9-2 9-5 1L4 4z" />
        <path d="M4 8h16" />
    </svg>
);

const CustomerCard = ({ customer, customerAddress, order, onCardClick }) => {
    const customerName = customer?.name || 'Sana';
    const customerPhone = customer?.phoneNumber || '+91 98765 43210';
    
    // Format address
    const locationText = (() => {
        if (customerAddress?.city && customerAddress?.state) {
            return `${customerAddress.city}, ${customerAddress.state}`;
        }
        if (customerAddress?.city) return customerAddress.city;
        if (customerAddress?.street) {
            const parts = customerAddress.street.split(',');
            return parts.slice(0, 2).join(',').trim();
        }
        return 'Budgam, Jammu & Kashmir';
    })();

    const orderId = order?.orderId ? `Order #${order.orderId}` : 'Order #SZ12568';
    const itemsCount = order?.items?.length || 1;
    
    // Dynamic item label and icon matching actual order
    const { itemsLabel, isBottom } = (() => {
        if (order?.items && order.items.length > 0) {
            if (order.items.length === 1) {
                const it = order.items[0];
                const rawName = it.service?.title || it.service?.name || it.product?.name || 'Garment';
                const bot = /pajama|pant|trouser|salwar|bottom|plazo|palazzo/i.test(rawName);
                return { itemsLabel: rawName, isBottom: bot };
            }
            // Multi-items
            const names = order.items.map(it => it.service?.title || it.service?.name || 'Item');
            return { itemsLabel: `${itemsCount} Items`, isBottom: false };
        }
        return { itemsLabel: '1 Suit', isBottom: false };
    })();

    return (
        <div 
            onClick={onCardClick}
            className="w-full bg-white rounded-[26px] p-4 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)] flex items-center justify-between gap-3 transition-all hover:shadow-[0_6px_28px_rgba(74,21,75,0.08)] cursor-pointer"
        >
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with fallback */}
                <div className="relative flex-shrink-0">
                    {customer?.profileImage ? (
                        <img
                            src={customer.profileImage}
                            alt={customerName}
                            className="w-14 h-14 rounded-full object-cover border border-purple-100 shadow-sm"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/images/sana_avatar.jpg';
                            }}
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-200/60 flex items-center justify-center text-[#581C87] font-bold text-lg shadow-sm">
                            {customerName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="flex flex-col min-w-0">
                    {/* Name + Verified Badge */}
                    <div className="flex items-center gap-1.5">
                        <h2 className="text-[17px] font-bold text-gray-900 truncate tracking-tight">
                            {customerName}
                        </h2>
                        {/* Purple Verified Badge */}
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#6C2E9C] text-white flex-shrink-0">
                            <Check size={10} strokeWidth={3.5} />
                        </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-1.5 text-gray-500 text-[11.5px] font-medium mt-1 truncate">
                        <Phone size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customerPhone}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-gray-500 text-[11.5px] font-medium mt-0.5 truncate">
                        <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{locationText}</span>
                    </div>
                </div>
            </div>

            {/* Right: Order Tag + Item Count */}
            <div className="flex flex-col items-end gap-2.5 flex-shrink-0 max-w-[130px]">
                {/* Order Badge */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#F3E8FF] text-[#6C2E9C] tracking-tight truncate max-w-full">
                    {orderId}
                </span>

                {/* Garment Count + Chevron */}
                <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold pr-1 truncate max-w-full">
                    {isBottom ? (
                        <PantsIcon className="w-4 h-4 text-gray-800 flex-shrink-0" />
                    ) : (
                        <DressIcon className="w-4 h-4 text-gray-800 flex-shrink-0" />
                    )}
                    <span className="truncate">{itemsLabel}</span>
                    <ChevronRight size={15} className="text-gray-400 ml-0.5 flex-shrink-0" />
                </div>
            </div>
        </div>
    );
};

export default CustomerCard;
