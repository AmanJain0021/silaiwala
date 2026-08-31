import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import useCheckoutStore from '../../../store/checkoutStore';
import useAddressStore from '../../../store/userStore';
import CartItem from '../components/cart/CartItem';
import CouponOfferSection from '../components/checkout/summary/CouponOfferSection';
import api from '../../../utils/api';

const CartPage = () => {
    const navigate = useNavigate();
    const { items, getTotalPrice, removeItem, updateQuantity, fetchCart } = useCartStore((state) => state);
    const { setCheckoutType, appliedCoupon, setAppliedCoupon, clearAppliedCoupon } = useCheckoutStore(
        (state) => state
    );
    const addresses = useAddressStore((state) => state.addresses);
    const selectedAddressId = useAddressStore((state) => state.selectedAddressId);
    const fetchAddresses = useAddressStore((state) => state.fetchAddresses);

    const selectedAddress =
        addresses.find((addr) => addr._id === selectedAddressId) || addresses[0] || null;

    const [pricing, setPricing] = useState({
        total: 0,
        base: 0,
        taxes: 0,
        delivery: 0,
        platformFee: 0,
        platformFeePercentage: 0,
        gstPercentage: 0,
        freeDeliveryMinOrder: 0,
        freeDeliveryApplied: false,
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
            setPricing((p) => ({ ...p, total: 0, base: 0 }));
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
                    isCartCheckout: true,
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
                    checkoutType: 'store',
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
                    discountValue: data.discountValue,
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
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">
                    Looks like you haven&apos;t added anything to your cart yet.
                </p>
                <Link
                    to="/user/store"
                    className="px-6 py-3 rounded-xl bg-[#843D9B] text-white font-bold text-sm shadow-lg hover:bg-[#6B2F7E] transition-all"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans relative">
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between pt-safe">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Your Cart</h1>
                        <p className="text-[10px] text-gray-500">{items.length} Items</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
                <div className="flex-1 space-y-4">
                    <div className="space-y-3">
                        {items.map((item) => (
                            <CartItem
                                key={item.cartId}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>

                    {showCoupon && !isLoadingPricing && (
                        <CouponOfferSection
                            orderAmount={baseTotal}
                            checkoutType="store"
                            appliedCoupon={appliedCoupon}
                            onApplied={setAppliedCoupon}
                            onRemoved={clearAppliedCoupon}
                            variant="compact"
                        />
                    )}
                </div>

                <div className="w-full lg:w-96 space-y-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-20">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Order Summary</h3>

                        {isLoadingPricing ? (
                            <div className="flex items-center justify-center py-8 text-gray-400 gap-2 text-xs font-bold">
                                <Loader2 size={18} className="animate-spin" />
                                Calculating totals…
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Product Charges</span>
                                    <span>₹{merchandiseSubtotal.toLocaleString('en-IN')}</span>
                                </div>

                                {pricing.platformFee > 0 && (
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Platform Fee ({pricing.platformFeePercentage}%)</span>
                                        <span>₹{Math.round(pricing.platformFee).toLocaleString('en-IN')}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>GST ({pricing.gstPercentage}%)</span>
                                    <span>₹{Math.round(pricing.taxes).toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span
                                        className={
                                            deliveryLabel === 'FREE'
                                                ? 'text-[#843D9B] font-bold'
                                                : 'text-gray-600'
                                        }
                                    >
                                        {deliveryLabel}
                                    </span>
                                </div>

                                {(pricing.freeDeliveryApplied || pricing.freeDeliveryMinOrder > 0) && (
                                    <div className="bg-green-50 text-green-700 p-2 rounded-lg text-[10px] font-medium border border-green-100">
                                        {pricing.freeDeliveryApplied
                                            ? `Free delivery unlocked (₹${Math.round(Number(pricing.freeDeliveryMinOrder) || 0).toLocaleString('en-IN')} & above)`
                                            : `Add ₹${Math.max(0, Math.ceil((pricing.freeDeliveryMinOrder || 0) - merchandiseSubtotal)).toLocaleString('en-IN')} more for free delivery`}
                                    </div>
                                )}

                                {discountAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Amount before coupon</span>
                                            <span>₹{baseTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-emerald-700 font-bold">
                                            <span>
                                                Coupon
                                                {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
                                            </span>
                                            <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-gray-100 my-2" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">Total Payable</span>
                                    <span className="text-sm font-black text-[#843D9B]">
                                        ₹{finalTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckoutLoading || isLoadingPricing}
                                    className="w-full py-4 rounded-xl bg-[#843D9B] text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-[#6B2F7E] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isCheckoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-6 text-[10px] text-gray-400 font-medium text-center">
                            <div className="bg-gray-50 rounded-lg p-2">100% Secure</div>
                            <div className="bg-gray-50 rounded-lg p-2">Trusted Delivery</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe z-40">
                <button
                    onClick={handleCheckout}
                    disabled={isCheckoutLoading || isLoadingPricing}
                    className="w-full py-3.5 rounded-xl bg-[#843D9B] text-white text-sm font-bold shadow-lg hover:bg-[#6B2F7E] active:scale-95 transition-all flex items-center justify-between px-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <div className="text-left">
                        <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider mb-0.5">
                            Estimated Total
                        </p>
                        <p className="text-sm font-black text-white">
                            {isLoadingPricing ? '…' : `₹${finalTotal.toLocaleString('en-IN')}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        {isCheckoutLoading ? 'Wait...' : 'Checkout'}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default CartPage;
