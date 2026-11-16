// Port of modules/customer/pages/Coupons.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useEffect, useState } from "react";
import { Tag, ArrowLeft, Percent, Loader2 } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const Coupons = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/customers/promo-codes');
        setOffers(res.data?.data || []);
      } catch (err) {
        if (err?.name !== 'CanceledError') setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50">
            <Box className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
                <Btn onPress={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer">
                    <I icon={ArrowLeft} size={18} className="text-gray-700" />
                </Btn>
                <Txt className="text-sm md:text-xl font-black text-gray-900">My Coupons & Offers</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            <Box className="max-w-lg mx-auto px-4 py-6">
                {loading ? <Box className="flex justify-center py-16 text-gray-400 gap-2 text-xs font-bold">
                        <Spin size={18} className="animate-spin" /> Loading…
                    </Box> : offers.length === 0 ? <Box className="text-center py-16 px-6">
                        <Box className="w-16 h-16 bg-purple-50 text-[#843D9B] rounded-full flex items-center justify-center mx-auto mb-4">
                            <I icon={Tag} size={28} />
                        </Box>
                        <Txt className="text-xl font-black text-gray-900 mb-3">No Coupons Available</Txt>
                        <Txt className="text-sm text-gray-500 font-medium">
                            You don't have any active coupons right now. Check back later for exciting offers and
                            discounts!
                        </Txt>
                    </Box> : <Box className="space-y-3">
                        {offers.map(offer => <Box key={offer.code} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                                <Box className="w-11 h-11 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                                    <I icon={Percent} size={18} />
                                </Box>
                                <Box className="flex-1 min-w-0">
                                    <Box className="flex items-center gap-2 flex-wrap">
                                        <Txt className="text-sm font-black text-gray-900 tracking-wide">
                                            {offer.code}
                                        </Txt>
                                        <Txt className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                        </Txt>
                                    </Box>
                                    <Txt className="text-xs text-gray-500 mt-1">
                                        {offer.description || (offer.minOrderAmount ? `Min order ₹${offer.minOrderAmount}` : 'Valid at checkout')}
                                    </Txt>
                                </Box>
                            </Box>)}
                        <Txt className="text-[11px] text-center text-gray-400 font-medium pt-2">
                            Apply these codes on the checkout summary page
                        </Txt>
                    </Box>}
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default Coupons;