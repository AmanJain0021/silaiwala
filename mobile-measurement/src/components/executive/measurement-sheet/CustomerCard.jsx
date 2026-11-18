// Port of modules/measurement-executive/components/measurement-sheet/CustomerCard.jsx (converted with scripts/web2rn.js, then reviewed)
import { Path, default as Svg } from 'react-native-svg';
import React from "react";
import { Phone, MapPin, ChevronRight, Check } from "lucide-react-native";
import { Btn, Box, Img, Txt, I, Scroll } from '../../ui/primitives';
const DressIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8 2h8l2 5-3 2v13H9V9L6 7l2-5z" />
        <Path d="M10 2v3a2 2 0 0 0 4 0V2" />
    </Svg>;
const PantsIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 4h16l-1 17-5-1-2-9-2 9-5 1L4 4z" />
        <Path d="M4 8h16" />
    </Svg>;
const CustomerCard = ({
  customer,
  customerAddress,
  order,
  onCardClick
}) => {
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
  const {
    itemsLabel,
    isBottom
  } = (() => {
    if (order?.items && order.items.length > 0) {
      if (order.items.length === 1) {
        const it = order.items[0];
        const rawName = it.service?.title || it.service?.name || it.product?.name || 'Garment';
        const bot = /pajama|pant|trouser|salwar|bottom|plazo|palazzo/i.test(rawName);
        return {
          itemsLabel: rawName,
          isBottom: bot
        };
      }
      // Multi-items
      const names = order.items.map(it => it.service?.title || it.service?.name || 'Item');
      return {
        itemsLabel: `${itemsCount} Items`,
        isBottom: false
      };
    }
    return {
      itemsLabel: '1 Suit',
      isBottom: false
    };
  })();
  return <Btn onPress={onCardClick} className="block w-full bg-white rounded-[26px] p-4 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)] flex items-center justify-between gap-3 transition-all hover:shadow-[0_6px_28px_rgba(74,21,75,0.08)] cursor-pointer">
            {/* Left: Avatar + Info */}
            <Box className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with fallback */}
                <Box className="relative flex-shrink-0">
                    {customer?.profileImage ? <Img src={customer.profileImage} alt={customerName} className="w-14 h-14 rounded-full object-cover border border-purple-100 shadow-sm" fallback="/assets/images/sana_avatar.jpg" /> : <Box className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-200/60 flex items-center justify-center text-[#581C87] font-bold text-lg shadow-sm">
                            {customerName.charAt(0).toUpperCase()}
                        </Box>}
                </Box>

                {/* Info Text */}
                <Box className="flex flex-col min-w-0">
                    {/* Name + Verified Badge */}
                    <Box className="flex items-center gap-1.5">
                        <Txt className="text-[17px] font-bold text-gray-900 truncate tracking-tight">
                            {customerName}
                        </Txt>
                        {/* Purple Verified Badge */}
                        <Box className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#6C2E9C] text-white flex-shrink-0">
                            <I icon={Check} size={10} strokeWidth={3.5} />
                        </Box>
                    </Box>

                    {/* Phone */}
                    <Box className="flex items-center gap-1.5 text-gray-500 text-[11.5px] font-medium mt-1 truncate">
                        <I icon={Phone} size={11} className="text-gray-400 flex-shrink-0" />
                        <Txt className="truncate">{customerPhone}</Txt>
                    </Box>

                    {/* Location */}
                    <Box className="flex items-center gap-1.5 text-gray-500 text-[11.5px] font-medium mt-0.5 truncate">
                        <I icon={MapPin} size={11} className="text-gray-400 flex-shrink-0" />
                        <Txt className="truncate">{locationText}</Txt>
                    </Box>
                </Box>
            </Box>

            {/* Right: Order Tag + Item Count */}
            <Box className="flex flex-col items-end gap-2.5 flex-shrink-0 max-w-[130px]">
                {/* Order Badge */}
                <Box className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#F3E8FF] text-[#6C2E9C] tracking-tight truncate max-w-full">
                    {orderId}
                </Box>

                {/* Garment Count + Chevron */}
                <Box className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold pr-1 truncate max-w-full">
                    {isBottom ? <I icon={PantsIcon} className="w-4 h-4 text-gray-800 flex-shrink-0" /> : <I icon={DressIcon} className="w-4 h-4 text-gray-800 flex-shrink-0" />}
                    <Txt className="truncate">{itemsLabel}</Txt>
                    <I icon={ChevronRight} size={15} className="text-gray-400 ml-0.5 flex-shrink-0" />
                </Box>
            </Box>
        </Btn>;
};
export default CustomerCard;
