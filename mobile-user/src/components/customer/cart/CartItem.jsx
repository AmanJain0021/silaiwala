// Port of modules/customer/components/cart/CartItem.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { Box, Img, Txt, Btn, I, Scroll } from '../../ui/primitives';
const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove
}) => {
  return <Box className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            {/* Image */}
            <Box className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <Img src={item.images && item.images.length > 0 ? item.images[0] : item.image} alt={item.title} className="w-full h-full object-cover" />
            </Box>

            {/* Details */}
            <Box className="flex-1 flex flex-col justify-between">
                <Box>
                    <Box className="flex justify-between items-start gap-2">
                        <Txt className="text-sm font-bold text-gray-900 line-clamp-2">{item.title}</Txt>
                        <Btn onPress={() => onRemove(item.cartId)} className="text-gray-400 hover:text-error transition-colors p-1 -mr-2 -mt-2">
                            <I icon={Trash2} size={16} />
                        </Btn>
                    </Box>
                    {item.isAlteration ? <Txt className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic">
                            {item.config?.alterationDescription}
                        </Txt> : <Box className="flex items-center gap-2 mt-1">
                            <Txt className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase">
                                Size: {item.selectedSize}
                            </Txt>
                            <Box className="flex items-center gap-1">
                                <Box className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{
              backgroundColor: item.selectedColor === 'Teal Green' ? '#1e3932' : item.selectedColor === 'Ruby Red' ? '#e11d48' : item.selectedColor === 'Mustard' ? '#facc15' : item.selectedColor
            }} />
                                <Txt className="text-[10px] text-gray-500">{item.selectedColor}</Txt>
                            </Box>
                        </Box>}
                </Box>

                <Box className="flex justify-between items-end mt-2">
                    <Box className={`font-bold ${item.isAlteration ? "text-amber-500 text-xs" : "text-[#843D9B]"}`}>
                        {item.isAlteration ? "Pending Quote" : `₹${item.price}`}
                    </Box>

                    {/* Quantity Control */}
                    {!item.isAlteration ? <Box className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <Btn onPress={() => onUpdateQuantity(item.cartId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-[#843D9B] active:scale-90 transition-all">
                                <I icon={Minus} size={12} />
                            </Btn>
                            <Txt className="text-xs font-bold w-4 text-center">{item.quantity}</Txt>
                            <Btn onPress={() => onUpdateQuantity(item.cartId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-[#843D9B] rounded shadow-sm text-white hover:bg-[#6B2F7E] active:scale-90 transition-all">
                                <I icon={Plus} size={12} />
                            </Btn>
                        </Box> : <Box className="text-[10px] font-bold text-[#843D9B] bg-indigo-50 px-2 py-1 rounded">
                            Qty: 1
                        </Box>}
                </Box>
            </Box>
        </Box>;
};
export default CartItem;