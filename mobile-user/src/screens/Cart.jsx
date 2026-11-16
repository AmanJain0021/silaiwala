// Port of modules/customer/pages/Cart.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react-native";
import {  useNavigate } from '../lib/nav';
import useCartStore from "../store/cartStore";
import useCheckoutStore from "../store/checkoutStore";
import useAddressStore from "../store/userStore";
import CartItem from "../components/customer/cart/CartItem";
import CouponOfferSection from "../components/customer/checkout/CouponOfferSection";
import api from "../lib/api";
import { Box, I, Txt, Btn, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const CartPage = () => {
  const navigate = useNavigate();
  const {
    items,
    getTotalPrice,
    removeItem,
    updateQuantity,
    fetchCart
  } = useCartStore(state => state);
  const {
    setCheckoutType,
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon
  } = useCheckoutStore(state => state);
  const addresses = useAddressStore(state => state.addresses);
  const selectedAddressId = useAddressStore(state => state.selectedAddressId);
  const fetchAddresses = useAddressStore(state => state.fetchAddresses);
  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId) || addresses[0] || null;
  const [pricing, setPricing] = useState({
    total: 0,
    base: 0,
    taxes: 0,
    delivery: 0,
    platformFee: 0,
    platformFeePercentage: 0,
    gstPercentage: 0,
    freeDeliveryMinOrder: 0,
    freeDeliveryApplied: false
  });
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const isAlterationCart = items.length > 0 && items[0].isAlteration;
  const isCustomDesignCart = items.length > 0 && items[0].isCustomDesign;
  const showCoupon = !isAlterationCart && !isCustomDesignCart;
  useEffect(() => {
    fetchCart();
    if (addresses.length === 0) fetchAddresses();
  }, [fetchCart, fetchAddresses, addresses.length]);
  useEffect(() => {
    if (items.length === 0) {
      setPricing(p => ({
        ...p,
        total: 0,
        base: 0
      }));
      setIsLoadingPricing(false);
      clearAppliedCoupon();
      return;
    }
    const loadPricing = async () => {
      setIsLoadingPricing(true);
      try {
        const res = await api.post('/orders/price-summary', {
          items,
          deliveryAddress: selectedAddress,
          isCartCheckout: true
        });
        if (res.data?.success) {
          setPricing(res.data.data);
        }
      } catch (err) {
        if (err?.name !== 'CanceledError') {
          console.error('Cart pricing failed:', err);
        }
      } finally {
        setIsLoadingPricing(false);
      }
    };
    loadPricing();
  }, [items, selectedAddress, clearAppliedCoupon]);
  const baseTotal = Math.round(Number(pricing?.total) || 0);
  const merchandiseSubtotal = Math.round(Number(pricing?.base) || getTotalPrice());

  // Re-validate coupon when cart total changes
  useEffect(() => {
    if (!showCoupon || !appliedCoupon?.code || baseTotal <= 0 || isLoadingPricing) return;
    let cancelled = false;
    const revalidate = async () => {
      try {
        const res = await api.post('/customers/apply-promo', {
          code: appliedCoupon.code,
          orderAmount: baseTotal,
          checkoutType: 'store'
        });
        if (cancelled) return;
        if (!res.data?.success) {
          clearAppliedCoupon();
          return;
        }
        const data = res.data.data;
        setAppliedCoupon({
          code: data.code,
          discount: Math.round(Number(data.discount) || 0),
          description: data.description || '',
          discountType: data.discountType,
          discountValue: data.discountValue
        });
      } catch {
        if (!cancelled) clearAppliedCoupon();
      }
    };
    revalidate();
    return () => {
      cancelled = true;
    };
  }, [baseTotal, isLoadingPricing, showCoupon]); // eslint-disable-line react-hooks/exhaustive-deps

  const discountAmount = appliedCoupon ? Math.round(Number(appliedCoupon.discount) || 0) : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);
  const deliveryLabel = useMemo(() => {
    if (pricing.freeDeliveryApplied || pricing.delivery === 0) return 'FREE';
    if (!selectedAddress) return 'At checkout';
    return `₹${Math.round(pricing.delivery).toLocaleString('en-IN')}`;
  }, [pricing.delivery, pricing.freeDeliveryApplied, selectedAddress]);
  const handleCheckout = () => {
    setIsCheckoutLoading(true);
    setCheckoutType('cart');
    navigate('/user/checkout/address');
  };
  if (items.length === 0) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Box className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <I icon={ShoppingBag} size={32} className="text-gray-400" />
                </Box>
                <Txt className="text-lg font-bold text-gray-900 mb-2">Your Cart is Empty</Txt>
                <Txt className="text-sm text-gray-500 mb-6 max-w-xs">
                    Looks like you haven&apos;t added anything to your cart yet.
                </Txt>
                <Btn onPress={() => navigate("/user/store")} className="px-6 py-3 rounded-xl bg-[#843D9B] text-white font-bold text-sm shadow-lg hover:bg-[#6B2F7E] transition-all">
                    Start Shopping
                </Btn>
            </Box></Screen>;
  }
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 font-sans relative">
            <Box className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between pt-safe">
                <Box className="flex items-center gap-3">
                    <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                        <I icon={ArrowLeft} size={20} />
                    </Btn>
                    <Box>
                        <Txt className="text-sm font-bold text-gray-900">Your Cart</Txt>
                        <Txt className="text-[10px] text-gray-500">{items.length} Items</Txt>
                    </Box>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-32">

            <Box className="max-w-4xl mx-auto p-4 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
                <Box className="flex-1 space-y-4">
                    <Box className="space-y-3">
                        {items.map(item => <CartItem key={item.cartId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} />)}
                    </Box>

                    {showCoupon && !isLoadingPricing && <CouponOfferSection orderAmount={baseTotal} checkoutType="store" appliedCoupon={appliedCoupon} onApplied={setAppliedCoupon} onRemoved={clearAppliedCoupon} variant="compact" />}
                </Box>

                <Box className="w-full lg:w-96 space-y-4">
                    <Box className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-20">
                        <Txt className="text-sm font-bold text-gray-900 mb-4">Order Summary</Txt>

                        {isLoadingPricing ? <Box className="flex items-center justify-center py-8 text-gray-400 gap-2 text-xs font-bold">
                                <Spin size={18} className="animate-spin" />
                                Calculating totals…
                            </Box> : <Box className="space-y-3">
                                <Box className="flex justify-between text-xs text-gray-600">
                                    <Txt>Product Charges</Txt>
                                    <Txt>₹{merchandiseSubtotal.toLocaleString('en-IN')}</Txt>
                                </Box>

                                {pricing.platformFee > 0 && <Box className="flex justify-between text-xs text-gray-600">
                                        <Txt>Platform Fee ({pricing.platformFeePercentage}%)</Txt>
                                        <Txt>₹{Math.round(pricing.platformFee).toLocaleString('en-IN')}</Txt>
                                    </Box>}

                                <Box className="flex justify-between text-xs text-gray-600">
                                    <Txt>GST ({pricing.gstPercentage}%)</Txt>
                                    <Txt>₹{Math.round(pricing.taxes).toLocaleString('en-IN')}</Txt>
                                </Box>

                                <Box className="flex justify-between text-xs text-gray-600">
                                    <Txt>Delivery Fee</Txt>
                                    <Txt className={deliveryLabel === 'FREE' ? 'text-[#843D9B] font-bold' : 'text-gray-600'}>
                                        {deliveryLabel}
                                    </Txt>
                                </Box>

                                {(pricing.freeDeliveryApplied || pricing.freeDeliveryMinOrder > 0) && <Box className="bg-green-50 text-green-700 p-2 rounded-lg text-[10px] font-medium border border-green-100">
                                        {pricing.freeDeliveryApplied ? `Free delivery unlocked (₹${Math.round(Number(pricing.freeDeliveryMinOrder) || 0).toLocaleString('en-IN')} & above)` : `Add ₹${Math.max(0, Math.ceil((pricing.freeDeliveryMinOrder || 0) - merchandiseSubtotal)).toLocaleString('en-IN')} more for free delivery`}
                                    </Box>}

                                {discountAmount > 0 && <>
                                        <Box className="flex justify-between text-xs text-gray-500">
                                            <Txt>Amount before coupon</Txt>
                                            <Txt>₹{baseTotal.toLocaleString('en-IN')}</Txt>
                                        </Box>
                                        <Box className="flex justify-between text-xs text-emerald-700 font-bold">
                                            <Txt>
                                                Coupon
                                                {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
                                            </Txt>
                                            <Txt>-₹{discountAmount.toLocaleString('en-IN')}</Txt>
                                        </Box>
                                    </>}

                                <Box className="h-px bg-gray-100 my-2" />

                                <Box className="flex justify-between items-center">
                                    <Txt className="text-sm font-bold text-gray-900">Total Payable</Txt>
                                    <Txt className="text-sm font-black text-[#843D9B]">
                                        ₹{finalTotal.toLocaleString('en-IN')}
                                    </Txt>
                                </Box>

                                <Btn onPress={handleCheckout} disabled={isCheckoutLoading || isLoadingPricing} className="w-full py-4 rounded-xl bg-[#843D9B] text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-[#6B2F7E] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isCheckoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                                </Btn>
                            </Box>}

                        <Box className="grid grid-cols-2 gap-2 mt-6 text-[10px] text-gray-400 font-medium text-center">
                            <Box className="bg-gray-50 rounded-lg p-2">100% Secure</Box>
                            <Box className="bg-gray-50 rounded-lg p-2">Trusted Delivery</Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

                        </Scroll>
<Box className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe z-40">
                <Btn onPress={handleCheckout} disabled={isCheckoutLoading || isLoadingPricing} className="w-full py-3.5 rounded-xl bg-[#843D9B] text-white text-sm font-bold shadow-lg hover:bg-[#6B2F7E] active:scale-95 transition-all flex items-center justify-between px-6 disabled:opacity-70 disabled:cursor-not-allowed">
                    <Box className="text-left">
                        <Txt className="text-[10px] text-white/70 uppercase font-bold tracking-wider mb-0.5">
                            Estimated Total
                        </Txt>
                        <Txt className="text-sm font-black text-white">
                            {isLoadingPricing ? '…' : `₹${finalTotal.toLocaleString('en-IN')}`}
                        </Txt>
                    </Box>
                    <Box className="flex items-center gap-2 text-white">
                        {isCheckoutLoading ? 'Wait...' : 'Checkout'}
                    </Box>
                </Btn>
            </Box>
        </Box></Screen>;
};
export default CartPage;