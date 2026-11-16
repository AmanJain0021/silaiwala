// Port of modules/customer/components/store/StoreHeader.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../../lib/nav';
import React from "react";
import { Search, ShoppingBag, Heart, SlidersHorizontal, Camera, Mic } from "lucide-react-native";
import useCartStore from "../../../store/cartStore";
import useWishlistStore from "../../../store/wishlistStore";
import useBrandingStore from "../../../store/brandingStore";
import { getImageUrl } from "../../../utils/imageUrl";
import { Box, Btn, Img, Txt, I, Input, Scroll } from '../../ui/primitives';
const StoreHeader = ({
  searchQuery,
  setSearchQuery,
  onOpenFilter
}) => {
  const navigate = useNavigate();
  const cartCount = useCartStore(state => state.getTotalItems());
  const wishlistCount = useWishlistStore(state => state.items.length);
  const {
    appName,
    logos
  } = useBrandingStore();
  const logoSrc = getImageUrl(logos?.customer) || logos?.customer || '/sewzella_logo.jpeg';
  const displayName = appName || 'SewZella';
  return <Box className="bg-white border-b border-slate-100 transition-all duration-300 shadow-2xs">
            <Box className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-3">
                {/* Branding Row */}
                <Box className="flex justify-between items-center mb-3 gap-3">
                    <Btn onPress={() => navigate("/user")} className="flex items-center gap-2.5 min-w-0 group active:scale-[0.98] transition-transform" aria-label={displayName}>
                        <Box className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-primary/10 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-black/[0.03]">
                            <Img src={logoSrc} alt={displayName} className="w-[88%] h-[88%] object-contain" fallback="/sewzella_logo-removebg-preview.png" />
                        </Box>
                        <Box className="min-w-0">
                            <Txt className="text-[1.35rem] sm:text-2xl font-black text-primary leading-none tracking-tight truncate">
                                {displayName}
                            </Txt>
                            <Txt className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mt-1 tracking-tight truncate">
                                The Future of Tailoring
                            </Txt>
                        </Box>
                    </Btn>

                    <Box className="flex items-center gap-2 shrink-0">
                        <Btn onPress={() => navigate("/user/wishlist")} className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all relative active:scale-90 shadow-2xs">
                            <I icon={Heart} size={18} className={wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                            {wishlistCount > 0 && <Txt className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {wishlistCount}
                                </Txt>}
                        </Btn>

                        <Btn onPress={() => navigate("/user/cart")} className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all relative active:scale-90 shadow-2xs">
                            <I icon={ShoppingBag} size={18} />
                            {cartCount > 0 && <Txt className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {cartCount}
                                </Txt>}
                        </Btn>

                        <Btn onPress={onOpenFilter} className="w-10 h-10 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 transition-all shadow-2xs cursor-pointer">
                            <I icon={SlidersHorizontal} size={18} />
                        </Btn>
                    </Box>
                </Box>

                <Box className="relative group">
                    <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <I icon={Search} className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </Box>
                    <Input placeholder="Search fabrics, suits, designs..." value={searchQuery} onChangeText={e => setSearchQuery(e)} className="w-full bg-slate-50/80 border border-slate-200/80 rounded-full py-2.5 pl-10 pr-20 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-inner" />
                    <Box className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2.5">
                        <Btn className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                            <I icon={Camera} size={18} />
                        </Btn>
                        <Btn className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                            <I icon={Mic} size={18} />
                        </Btn>
                    </Box>
                </Box>
            </Box>
        </Box>;
};
export default StoreHeader;
