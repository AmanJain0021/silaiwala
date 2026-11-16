// Port of modules/customer/components/orders/OrderCard.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../../lib/nav';
import React, { useState } from "react";
import { ChevronRight, Calendar, Truck, Home, Sparkles } from "lucide-react-native";
import { getImageUrl } from "../../../utils/imageUrl";
import ReviewModal from "./ReviewModal";
import { formatOrderItemsTitle, getItemImage, getItemLabel, getOrderItemCount, orderHasTailorAtHome } from "../../../utils/orderItems";
import { Box, Btn, Img, Txt, I, Scroll } from '../../ui/primitives';
const DEFAULT_GARMENT_IMAGE = 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1790608227/tailor_platform/z9cukm3gosnibmiv3ysk.jpg';
const OrderCard = ({
  order
}) => {
  const navigate = useNavigate();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const items = order.items || [];
  const serviceTitle = formatOrderItemsTitle(items, {
    fallback: 'Custom Stitching Order'
  });
  const deliveryType = items[0]?.deliveryType || 'Standard Delivery';
  const displayId = order.orderId || "ORD-0000";
  const status = (order.status || 'Pending').replace(/-/g, ' ').toUpperCase();
  const itemCount = getOrderItemCount(items);
  const getStatusBadgeStyle = statusStr => {
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
  const mainImage = itemRawImg && getImageUrl(itemRawImg) ? getImageUrl(itemRawImg) : DEFAULT_GARMENT_IMAGE;
  const isTailorAtHome = orderHasTailorAtHome(items);
  return <Box className="bg-white rounded-[1.25rem] p-3 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all group block">
            <Btn onPress={() => navigate(`/user/orders/${order._id || order.orderId}/track`)} className="flex gap-3 h-full">
                {/* Left: Large Image */}
                <Box className="w-[85px] shrink-0">
                    <Box className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <Img src={mainImage} alt={serviceTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {items.length > 1 && <Txt className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                {items.length} items
                            </Txt>}
                    </Box>
                </Box>

                {/* Right: Content Stack */}
                <Box className="flex-1 min-w-0 flex flex-col">
                    {/* Row 1: Status, Order ID, Price */}
                    <Box className="flex items-start justify-between gap-1 mb-1">
                        <Box className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                            <Txt className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${getStatusBadgeStyle(order.status)}`}>
                                {status}
                            </Txt>
                            <Txt className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                #{displayId}
                            </Txt>
                            {order.createdByAdmin && <Txt className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                    <I icon={Sparkles} size={8} /> Admin Assisted
                                </Txt>}
                        </Box>
                        <Txt className="text-[13px] font-black text-primary shrink-0 ml-1">₹{order.totalAmount || 0}</Txt>
                    </Box>

                    {/* Row 2: Title & Arrow */}
                    <Box className="flex justify-between items-center mb-1.5 mt-0.5">
                        <Txt className="text-[13px] sm:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 pr-2">
                            {serviceTitle}
                        </Txt>
                        <I icon={ChevronRight} size={14} className="text-gray-300 shrink-0 group-hover:text-primary transition-colors" />
                    </Box>

                    {/* Row 3: Date and Delivery Type */}
                    <Box className="flex items-center gap-3.5 text-[9px] sm:text-[10px] font-semibold text-gray-500 mb-2">
                        <Box className="flex items-center gap-1 shrink-0">
                            <I icon={Calendar} size={11} className="text-gray-400" />
                            {formattedDate}
                        </Box>
                        <Box className="flex items-center gap-1 truncate">
                            <I icon={Truck} size={11} className="text-gray-400 shrink-0" />
                            <Txt className="truncate">{deliveryType}</Txt>
                        </Box>
                    </Box>

                    {/* Row 4: Items Summary and Action Button */}
                    <Box className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50/50">
                        <Box className="flex items-center gap-1.5 min-w-0">
                            <Box className="flex -space-x-1.5 shrink-0">
                                {items.slice(0, 3).map((item, idx) => {
                const subImg = getItemImage(item);
                return <Box key={item._id || idx} className="w-5 h-5 rounded-md overflow-hidden border border-white bg-gray-100">
                                            <Img src={getImageUrl(subImg) || DEFAULT_GARMENT_IMAGE} alt={getItemLabel(item)} className="w-full h-full object-cover" />
                                        </Box>;
              })}
                            </Box>
                            <Txt className="text-[9px] sm:text-[10px] font-bold text-gray-700 truncate capitalize">
                                {items.length > 1 ? `${items.length} garments · qty ${itemCount}` : <>
                                            <Txt className="truncate">{getItemLabel(items[0])}</Txt>
                                            <Txt className="text-gray-400 ml-1 font-semibold">x{items[0]?.quantity || 1}</Txt>
                                        </>}
                            </Txt>
                        </Box>

                        {/* Right: Badge for Visit vs Standard */}
                        {isTailorAtHome ? <Txt className="text-[8px] sm:text-[9px] font-extrabold text-[#843D9B] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase tracking-tight shrink-0 flex items-center gap-1">
                                <I icon={Home} size={9} /> Doorstep Visit
                            </Txt> : <Txt className="text-[8px] sm:text-[9px] font-extrabold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200/50 uppercase tracking-tight shrink-0">
                                {items[0]?.measurements?.type === 'sample' ? 'Sample Pickup' : 'Measurement Profile'}
                            </Txt>}
                    </Box>
                </Box>
            </Btn>

            {/* Leave Review Action Button (Only when delivered) */}
            {['delivered', 'product-delivered', 'order-completed'].includes((order.status || '').toLowerCase()) && !order.isReviewed && <Box className="mt-2.5 pt-2.5 border-t border-gray-100 flex justify-end">
                    <Btn onPress={e => {
        setIsReviewModalOpen(true);
      }} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg transition-all">
                        Rate Order & Tailor
                    </Btn>
                </Box>}

            {/* Review Modal */}
            <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} orderId={order._id || order.orderId} tailorId={order.tailor?._id || order.tailor} deliveryPartnerId={order.deliveryPartner?._id || order.deliveryPartner} onSuccess={() => {
      setIsReviewModalOpen(false);
    }} />
        </Box>;
};
export default OrderCard;
