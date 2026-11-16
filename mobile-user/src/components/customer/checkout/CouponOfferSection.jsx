// Port of modules/customer/components/checkout/summary/CouponOfferSection.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import React, { useEffect, useState } from "react";
import { Tag, X, Loader2, Check, Percent } from "lucide-react-native";
import toast from '../../../lib/toast';
import api from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { Box, I, Txt, Btn, Input, Scroll } from '../../ui/primitives';

/**
 * Checkout coupon / offer card — apply admin PromoCodes and browse available offers.
 */
const CouponOfferSection = ({
  orderAmount = 0,
  checkoutType = 'all',
  appliedCoupon,
  onApplied,
  onRemoved,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  useEffect(() => {
    if (appliedCoupon?.code) {
      setCode(appliedCoupon.code);
    }
  }, [appliedCoupon?.code]);
  const applyCode = async rawCode => {
    const trimmed = String(rawCode || code || '').trim().toUpperCase();
    if (!trimmed) {
      toast.error('Enter a coupon code');
      return;
    }
    if (!orderAmount || orderAmount <= 0) {
      toast.error('Order total not ready yet');
      return;
    }
    setApplying(true);
    try {
      const res = await api.post('/customers/apply-promo', {
        code: trimmed,
        orderAmount,
        checkoutType
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid coupon');
      }
      const data = res.data.data;
      onApplied?.({
        code: data.code,
        discount: Math.round(Number(data.discount) || 0),
        description: data.description || '',
        discountType: data.discountType,
        discountValue: data.discountValue
      });
      setCode(data.code);
      setShowOffers(false);
      toast.success(`Coupon ${data.code} applied · saved ₹${Math.round(data.discount)}`);
    } catch (err) {
      if (err?.name === 'CanceledError') return;
      toast.error(err.response?.data?.message || err.message || 'Could not apply coupon');
    } finally {
      setApplying(false);
    }
  };
  const removeCoupon = () => {
    setCode('');
    onRemoved?.();
    toast.success('Coupon removed');
  };
  const loadOffers = async () => {
    setShowOffers(true);
    setLoadingOffers(true);
    try {
      const res = await api.get('/customers/promo-codes', {
        params: {
          checkoutType
        }
      });
      setOffers(res.data?.data || []);
    } catch (err) {
      if (err?.name === 'CanceledError') return;
      toast.error('Failed to load offers');
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };
  const formatOfferLabel = offer => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    }
    return `₹${offer.discountValue} OFF`;
  };
  return <Box className={cn('bg-white border shadow-xs overflow-hidden', isCompact ? 'rounded-xl border-dashed border-gray-200 mb-0' : 'rounded-3xl border-slate-100 mb-4')}>
            <Box className={cn('p-4 sm:p-5 items-stretch', isCompact ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-[1.2fr_auto_1fr] gap-4 sm:gap-5')}>
                {/* Apply coupon */}
                <Box className="min-w-0">
                    <Box className="flex items-center gap-2 mb-3">
                        <I icon={Tag} size={16} className="text-[#843D9B]" />
                        <Txt className="text-sm font-bold text-[#843D9B]">
                            {isCompact ? 'Apply Coupon' : 'Apply Coupon / Offer'}
                        </Txt>
                    </Box>

                    {appliedCoupon?.code ? <Box className="flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2.5">
                            <I icon={Check} size={16} className="text-emerald-600 shrink-0" />
                            <Box className="flex-1 min-w-0">
                                <Txt className="text-xs font-black text-emerald-800 tracking-wide">{appliedCoupon.code}</Txt>
                                <Txt className="text-[10px] text-emerald-700 font-medium">
                                    You save ₹{Math.round(appliedCoupon.discount || 0).toLocaleString('en-IN')}
                                </Txt>
                            </Box>
                            <Btn onPress={removeCoupon} className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 hover:underline cursor-pointer">
                                Remove
                            </Btn>
                        </Box> : <Box className="flex gap-2">
                            <Input value={code} onChangeText={e => setCode(e.toUpperCase())} autoCapitalize="characters" returnKeyType="done" onSubmitEditing={() => applyCode(code)} placeholder="Enter coupon code" className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#843D9B] focus:bg-white uppercase tracking-wide" />
                            <Btn disabled={applying} onPress={() => applyCode(code)} className="shrink-0 px-4 py-2.5 rounded-xl bg-[#F3E8FF] text-[#843D9B] text-[11px] font-black uppercase tracking-wider hover:bg-[#E9D5FF] disabled:opacity-60 cursor-pointer">
                                {applying ? <Spin size={14} className="animate-spin" /> : 'Apply'}
                            </Btn>
                        </Box>}
                </Box>

                {!isCompact && <>
                        {/* Divider */}
                        <Box className="hidden sm:block w-px bg-slate-200 self-stretch" />
                        <Box className="sm:hidden h-px bg-slate-100" />
                    </>}

                {/* Available offers */}
                <Box className={cn('min-w-0 flex flex-col', isCompact && 'pt-1')}>
                    {!isCompact && <Txt className="text-[11px] italic text-slate-500 font-medium mb-3">Available Offers</Txt>}
                    <Btn onPress={() => showOffers ? setShowOffers(false) : loadOffers()} className={cn('inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer', isCompact ? 'w-full' : 'w-full sm:w-auto self-start', showOffers ? 'border-[#843D9B] bg-[#Faf5ff] text-[#843D9B]' : 'border-[#C4B5FD] text-[#843D9B] hover:bg-[#Faf5ff]')}>
                        <I icon={Tag} size={14} />
                        {showOffers ? 'Hide Offers' : isCompact ? 'View Available Offers' : 'View Offers'}
                    </Btn>
                </Box>
            </Box>

            {showOffers && <Box className="border-t border-slate-100 bg-slate-50/50 px-4 sm:px-5 py-4">
                    {loadingOffers ? <Box className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs font-bold">
                            <Spin size={16} className="animate-spin" /> Loading offers…
                        </Box> : offers.length === 0 ? <Txt className="text-center text-xs text-slate-400 font-medium py-4">
                            No offers available right now. Check back later.
                        </Txt> : <Scroll contentClassName="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar" nestedScrollEnabled>
                            {offers.map(offer => {
          const isApplied = appliedCoupon?.code === offer.code;
          const belowMin = orderAmount < (offer.minOrderAmount || 0);
          return <Box key={offer.code} className="bg-white border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
                                        <Box className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                                            <I icon={Percent} size={16} />
                                        </Box>
                                        <Box className="flex-1 min-w-0">
                                            <Box className="flex items-center gap-2 flex-wrap">
                                                <Txt className="text-xs font-black text-slate-900 tracking-wide">
                                                    {offer.code}
                                                </Txt>
                                                <Txt className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    {formatOfferLabel(offer)}
                                                </Txt>
                                            </Box>
                                            <Txt className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                                {offer.description || (offer.minOrderAmount ? `Min order ₹${offer.minOrderAmount}` : 'Valid on this order')}
                                            </Txt>
                                            {belowMin && <Txt className="text-[10px] text-amber-600 font-bold mt-0.5">
                                                    Add ₹{Math.ceil((offer.minOrderAmount || 0) - orderAmount)} more to use
                                                </Txt>}
                                        </Box>
                                        <Btn disabled={isApplied || applying || belowMin} onPress={() => applyCode(offer.code)} className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', isApplied ? 'bg-emerald-50 text-emerald-700' : 'bg-[#843D9B] text-white hover:bg-[#843D9B]')}>
                                            {isApplied ? 'Applied' : 'Apply'}
                                        </Btn>
                                    </Box>;
        })}
                        </Scroll>}
                    <Btn onPress={() => setShowOffers(false)} className="mt-3 mx-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                        <I icon={X} size={12} /> Close
                    </Btn>
                </Box>}
        </Box>;
};
export default CouponOfferSection;
