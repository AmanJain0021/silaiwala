import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Lock, ShieldCheck, MapPin, Package, Loader2, FileText, ShoppingBag, Ruler, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';
import useCheckoutStore from '../../../store/checkoutStore';
import useAddressStore from '../../../store/userStore';
import useCartStore from '../../../store/cartStore';
import BillDetails from '../components/checkout/summary/BillDetails';
import CouponOfferSection from '../components/checkout/summary/CouponOfferSection';
import ServiceReviewCard from '../components/checkout/summary/ServiceReviewCard';
import { cn } from '../../../utils/cn';
import { formatCheckoutAddress, splitAdvanceRemaining } from '../../../utils/checkoutBilling';

import useOrderStore from '../../../store/orderStore';

const CheckoutSummary = () => {
    const navigate = useNavigate();
    const {
        serviceItems,
        buyNowItem,
        isBuyNowMode,
        clearCheckout,
        removeServiceItem,
        setBuyNowMode,
        addServiceItem,
        checkoutType,
        appliedCoupon,
        setAppliedCoupon,
        clearAppliedCoupon,
    } = useCheckoutStore(state => state);
    const { items: cartItems, getTotalPrice, clearCart } = useCartStore(state => state);
    const addOrder = useOrderStore(state => state.addOrder);
    
    // Properly select state to ensure reactivity
    const addresses = useAddressStore(state => state.addresses);
    const selectedAddressId = useAddressStore(state => state.selectedAddressId);
    const fetchAddresses = useAddressStore(state => state.fetchAddresses);
    
    // Derive selected address
    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId) || addresses[0];

    // Fetch addresses if they are empty (e.g., on page refresh)
    useEffect(() => {
        if (addresses.length === 0) {
            fetchAddresses();
        }
    }, [addresses.length, fetchAddresses]);

    // Normalize: if buy-now was started while a basket already existed, fold into basket once.
    useEffect(() => {
        if (isBuyNowMode && buyNowItem && serviceItems.length > 0) {
            addServiceItem(buyNowItem);
            setBuyNowMode(false, null);
        }
    }, [isBuyNowMode, buyNowItem, serviceItems.length, addServiceItem, setBuyNowMode]);

    const currentCheckoutItems = React.useMemo(() => {
        if (isBuyNowMode && buyNowItem) return [buyNowItem];
        return serviceItems;
    }, [isBuyNowMode, buyNowItem, serviceItems]);
    const isServiceCheckout = checkoutType === 'service' || (!checkoutType && currentCheckoutItems.length > 0);
    const isCartCheckout = checkoutType === 'cart' || (!checkoutType && cartItems.length > 0 && currentCheckoutItems.length === 0);

    const hasTailorAtHome = React.useMemo(() => {
        return currentCheckoutItems.some(item => 
            item.configuration?.isTailorAtHome || 
            item.configuration?.measurements?.option === 'visit' || 
            (item.pricing?.tailorAtHome && item.pricing.tailorAtHome > 0)
        );
    }, [currentCheckoutItems]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingText, setLoadingText] = useState('Initializing...');
    const hasNavigated = useRef(false);
    const [bulkOrder, setBulkOrder] = useState(null);
    const location = useLocation();
    const bulkOrderId = location.state?.bulkOrderId;

    const [advancePercentage, setAdvancePercentage] = useState(50);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false); // Kept for backwards compatibility in JSX if needed
    
    // Fetch Admin Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/cms/settings');
                if (res.data.success) {
                    if (res.data.data?.walletConfig?.advancePercentage) {
                        setAdvancePercentage(res.data.data.walletConfig.advancePercentage);
                    }
                }
            } catch (err) {
                if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
                    console.error("Failed to fetch settings:", err);
                }
            }
        };
        fetchSettings();
    }, []);

    const [currentPricing, setCurrentPricing] = useState({
        total: 0,
        base: 0,
        taxes: 0,
        delivery: 0,
        platformFee: 0,
        platformFeePercentage: 0,
        gstPercentage: 0
    });
    const [isLoadingPricing, setIsLoadingPricing] = useState(true);

    // Fetch Bulk Order Details
    useEffect(() => {
        if (!bulkOrderId) return;
        
        const fetchBulkOrder = async () => {
            try {
                const res = await api.get(`/bulk-orders/${bulkOrderId}`);
                if (res.data.success) {
                    setBulkOrder(res.data.data);
                }
            } catch (err) {
                if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
                    console.error("Failed to fetch bulk order:", err);
                    toast.error("Failed to load bulk order details");
                }
            }
        };
        fetchBulkOrder();
    }, [bulkOrderId]);

    // Note: Auto-redirect on empty cart removed to prevent hijacking navigation during/after order creation.

    // Fetch Price Summary from Backend API
    useEffect(() => {
        const fetchPricing = async () => {
            if (bulkOrder) {
                setCurrentPricing({
                    total: bulkOrder.quote.depositRequired,
                    base: bulkOrder.quote.depositRequired,
                    taxes: 0,
                    delivery: 0,
                    platformFee: 0,
                    platformFeePercentage: 0,
                    gstPercentage: 0
                });
                setIsLoadingPricing(false);
                return;
            }

            if (!isCartCheckout && currentCheckoutItems.length === 0) {
                setIsLoadingPricing(false);
                return;
            }

            setIsLoadingPricing(true);
            try {
                const items = isCartCheckout ? cartItems : currentCheckoutItems;
                const res = await api.post('/orders/price-summary', {
                    items,
                    deliveryAddress: selectedAddress,
                    isCartCheckout
                });
                if (res.data.success) {
                    setCurrentPricing(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch price summary:", err);
                toast.error("Failed to load price summary");
            } finally {
                setIsLoadingPricing(false);
            }
        };
        fetchPricing();
    }, [bulkOrder, cartItems, currentCheckoutItems, isCartCheckout, selectedAddress]);

    const isCartAlteration = isCartCheckout && cartItems.length > 0 && cartItems[0].isAlteration;
    const isCartCustomDesign = isCartCheckout && cartItems.length > 0 && cartItems[0].isCustomDesign;
    const isAlterationCheckout = isCartAlteration || (isServiceCheckout && currentCheckoutItems.some(item => 
        item.serviceDetails?.category?.name?.toLowerCase().includes('alteration') || 
        item.serviceDetails?.tags?.some(t => t.toLowerCase().includes('alteration'))
    ));
    const requireFullPayment = (isCartCheckout && !isCartAlteration && !isCartCustomDesign) || (isServiceCheckout && isAlterationCheckout);

    const baseTotal = Math.round(Number(currentPricing?.total) || 0);
    const couponCheckoutType = isCartCheckout ? 'store' : 'service';

    // Re-validate applied coupon when order total changes (address, cart qty, etc.)
    useEffect(() => {
        if (!appliedCoupon?.code || baseTotal <= 0 || isLoadingPricing) return;

        let cancelled = false;
        const revalidate = async () => {
            try {
                const res = await api.post('/customers/apply-promo', {
                    code: appliedCoupon.code,
                    orderAmount: baseTotal,
                    checkoutType: couponCheckoutType,
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
        return () => { cancelled = true; };
    }, [baseTotal, couponCheckoutType, isLoadingPricing]); // eslint-disable-line react-hooks/exhaustive-deps

    const discountAmount = appliedCoupon ? Math.round(Number(appliedCoupon.discount) || 0) : 0;
    const displayPricing = React.useMemo(() => {
        if (!appliedCoupon || discountAmount <= 0) {
            return { ...currentPricing, discountAmount: 0, couponCode: '' };
        }
        return {
            ...currentPricing,
            discountAmount,
            couponCode: appliedCoupon.code,
            preDiscountTotal: baseTotal,
            total: Math.max(0, baseTotal - discountAmount),
        };
    }, [currentPricing, appliedCoupon, discountAmount, baseTotal]);

    const finalTotal = Math.round(Number(displayPricing?.total) || 0);
    const effectiveAdvancePct = requireFullPayment ? 100 : (advancePercentage || 25);
    const { advanceAmount } = splitAdvanceRemaining(finalTotal, effectiveAdvancePct);

    const handlePayment = async () => {
        if (!selectedAddress) {
            toast.error('Please select a delivery address first');
            navigate('/user/checkout/address');
            return;
        }

        setIsProcessing(true);
        try {
            let order;

            if (!bulkOrderId) {
                // If it's a Custom Alteration from Cart
                if (isCartAlteration) {
                    setLoadingText('Submitting alteration request...');
                    const altRes = await api.post('/alterations/request', {
                        deliveryAddress: {
                            street: selectedAddress.street,
                            city: selectedAddress.city,
                            state: selectedAddress.state || '',
                            zipCode: selectedAddress.zipCode,
                            location: selectedAddress.location
                        }
                    });
                    if (!altRes.data.success) throw new Error('Alteration request failed');
                    
                    const createdAlt = altRes.data.data;
                    clearCart();
                    hasNavigated.current = true;
                    navigate('/user/checkout/success', {
                        replace: true,
                        state: {
                            orderId: createdAlt?._id,
                            orderNumber: createdAlt?.alterationId || 'ALT-REQ',
                            pendingAcceptance: true,
                            isAlteration: true
                        }
                    });
                    return;
                }

                // If it's a Custom Design from Cart
                if (isCartCustomDesign) {
                    setLoadingText('Submitting custom design request...');
                    const customDesignRes = await api.post('/custom-designs/request', {
                        tailorId: cartItems[0].tailor || cartItems[0].tailorId,
                        description: cartItems[0].config?.customDesignDescription || '',
                        images: cartItems[0].config?.customDesignImages || [],
                        deliveryAddress: {
                            street: selectedAddress.street,
                            city: selectedAddress.city,
                            state: selectedAddress.state || '',
                            zipCode: selectedAddress.zipCode,
                            location: selectedAddress.location
                        }
                    });
                    if (!customDesignRes.data.success) throw new Error('Custom design request failed');
                    
                    const createdDesign = customDesignRes.data.data;
                    clearCart();
                    hasNavigated.current = true;
                    navigate('/user/checkout/success', {
                        replace: true,
                        state: {
                            orderId: createdDesign?._id,
                            orderNumber: createdDesign?.designId || 'DES-REQ',
                            pendingAcceptance: true,
                            isCustomDesign: true
                        }
                    });
                    return;
                }

                let payload;
                if (isServiceCheckout) {
                    const firstItemTailor = currentCheckoutItems[0]?.serviceDetails?.tailorId || currentCheckoutItems[0]?.serviceDetails?.tailor;
                    const resolvedTailorId =
                        (typeof firstItemTailor === 'object' ? (firstItemTailor?._id || firstItemTailor?.id) : firstItemTailor) ||
                        null;

                    payload = {
                        tailorId: resolvedTailorId,
                        isMeasurementHome: currentCheckoutItems.some(item => item.configuration?.isTailorAtHome || item.configuration?.measurements?.type === 'home'),
                        items: currentCheckoutItems.map(item => {
                            const rawId = item.serviceDetails?._id || item.serviceDetails?.id;
                            const serviceId = (rawId && typeof rawId === 'string' && rawId.length === 24) ? rawId : (item.serviceDetails?.id || item.serviceDetails?._id);
                            const rawFabric = item.configuration?.selectedFabric?._id || item.configuration?.selectedFabric?.id || item.configuration?.selectedFabric;
                            const fabricId = (rawFabric && typeof rawFabric === 'string' && rawFabric.length === 24) ? rawFabric : null;

                            return {
                                service: serviceId,
                                fabricSource: item.configuration?.fabricSource || 'customer',
                                deliveryType: item.configuration?.deliveryType || 'standard',
                                selectedFabric: fabricId,
                                quantity: 1,
                                price: item.pricing?.base || 0,
                                measurements: item.configuration?.isTailorAtHome ? { type: 'home' } : item.configuration?.measurements || {},
                                isTailorAtHome: !!item.configuration?.isTailorAtHome,
                                selectedStyle: item.configuration?.selectedStyle || null,
                                addons: item.configuration?.addons || []
                            };
                        }),
                        totalAmount: finalTotal,
                        promoCode: appliedCoupon?.code || undefined,
                        deliveryFee: currentPricing.delivery || 0,
                        platformFee: currentPricing.platformFee || 0,
                        gstAmount: currentPricing.taxes || 0,
                        deliveryAddress: {
                            street: selectedAddress.street,
                            city: selectedAddress.city,
                            state: selectedAddress.state || '',
                            zipCode: selectedAddress.zipCode,
                            location: selectedAddress.location
                        }
                    };
                } else {
                    const firstItemTailor = cartItems[0]?.tailor;
                    const resolvedTailorId =
                        (typeof firstItemTailor === 'object' ? (firstItemTailor?._id || firstItemTailor?.id) : firstItemTailor) ||
                        null;

                    payload = {
                        tailorId: resolvedTailorId,
                        items: cartItems.map(item => {
                            const productId = item._id || item.id || item.productId;
                            return {
                                product: (productId && typeof productId === 'string' && productId.length === 24) ? productId : productId,
                                quantity: item.quantity || 1,
                                price: item.price || 0
                            };
                        }),
                        totalAmount: finalTotal,
                        promoCode: appliedCoupon?.code || undefined,
                        deliveryFee: currentPricing.delivery || 0,
                        platformFee: currentPricing.platformFee || 0,
                        gstAmount: currentPricing.taxes || 0,
                        deliveryAddress: {
                            street: selectedAddress.street,
                            city: selectedAddress.city,
                            state: selectedAddress.state || '',
                            zipCode: selectedAddress.zipCode,
                            location: selectedAddress.location
                        }
                    };
                }

                setLoadingText('Submitting order...');
                setLoadingText('Submitting order...');
                const endpoint = isCartAlteration ? '/alterations/request' : '/orders';
                const orderRes = await api.post(endpoint, payload);
                if (!orderRes.data.success) throw new Error(isCartAlteration ? 'Alteration request failed' : 'Order creation failed');
                order = orderRes.data.data;
            }

            const targetOrderId = order?._id || order?.id || order?.orderId;
            const targetOrderNum = order?.orderId || order?.alterationId || targetOrderId;
            if (targetOrderId) {
                try {
                    sessionStorage.setItem('lastCreatedOrderId', targetOrderId);
                    sessionStorage.setItem('lastCreatedOrderNum', targetOrderNum);
                } catch (e) {}
            }

            if (!bulkOrderId) {
                if (requireFullPayment && finalTotal > 0) {
                    setLoadingText('Connecting to Secure Payment...');
                    const rzpOrderRes = await api.post('/orders/razorpay/create', { amount: finalTotal });
                    if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
                    const rzpOrder = rzpOrderRes.data.data;

                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                        amount: rzpOrder.amount,
                        currency: rzpOrder.currency,
                        name: "SilaiWala",
                        description: "Full Order Payment",
                        order_id: rzpOrder.id,
                        handler: async function (response) {
                            try {
                                const verifyRes = await api.post(`/orders/razorpay/verify`, {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderObjectId: targetOrderId,
                                    paymentType: 'full'
                                });

                                if (verifyRes.data.success) {
                                    if (isServiceCheckout) clearCheckout();
                                    else {
                                        clearCart();
                                        clearAppliedCoupon();
                                    }

                                    navigate('/user/checkout/success', {
                                        replace: true,
                                        state: { orderId: targetOrderId, orderNumber: targetOrderNum, isFullyPaid: true }
                                    });
                                }
                            } catch (err) {
                                console.error('Verification failed:', err);
                                alert('Payment verification failed. Please contact support.');
                            } finally {
                                setIsProcessing(false);
                                setLoadingText('Initializing...');
                            }
                        },
                        prefill: {
                            name: selectedAddress?.receiverName || "",
                            contact: selectedAddress?.phone || ""
                        },
                        theme: { color: "#843D9B" }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        setIsProcessing(false);
                        setLoadingText('Initializing...');
                        alert('Payment failed: ' + response.error.description);
                    });
                    rzp.open();
                    return;
                }

                // NORMAL STITCHING ORDER: Send to tailor for acceptance and navigate to success screen
                if (isServiceCheckout) clearCheckout();
                else {
                    clearCart();
                    clearAppliedCoupon();
                }
                hasNavigated.current = true;
                navigate('/user/checkout/success', {
                    replace: true,
                    state: { 
                        orderId: targetOrderId, 
                        orderNumber: targetOrderNum, 
                        pendingAcceptance: true,
                        isAlteration: isCartAlteration
                    }
                });
                return;
            }

            // ONLY BULK ORDERS DO DEPOSIT PAYMENT HERE NOW
            if (finalTotal <= 0) {
                const verifyRes = await api.put(`/bulk-orders/${bulkOrderId}`, {
                    paymentStatus: 'deposit-paid',
                    status: 'accepted',
                    message: "No security deposit required. Order accepted."
                });

                if (verifyRes.data.success) {
                    navigate('/user/checkout/success', {
                        state: { orderId: bulkOrderId, orderNumber: bulkOrder.orderId, isBulk: true }
                    });
                } else {
                    toast.error('Failed to update bulk order');
                    setIsProcessing(false);
                }
                return;
            }

            setLoadingText('Connecting to Secure Payment...');
            const rzpOrderRes = await api.post('/orders/razorpay/create', { amount: finalTotal });
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "SilaiWala",
                description: "Bulk Order Deposit",
                order_id: rzpOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.put(`/bulk-orders/${bulkOrderId}`, {
                            paymentStatus: 'deposit-paid',
                            status: 'accepted',
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            message: "Security deposit paid via Razorpay. Order accepted."
                        });

                        if (verifyRes.data.success) {
                            navigate('/user/checkout/success', {
                                state: { orderId: bulkOrderId, orderNumber: bulkOrder.orderId, isBulk: true }
                            });
                        }
                    } catch (err) {
                        console.error('Verification failed:', err);
                        alert('Payment verification failed. Please contact support.');
                    } finally {
                        setIsProcessing(false);
                        setLoadingText('Initializing...');
                    }
                },
                prefill: {
                    name: selectedAddress?.receiverName || "",
                    contact: selectedAddress?.phone || ""
                },
                theme: { color: "#843D9B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setIsProcessing(false);
                setLoadingText('Initializing...');
                alert('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment process failed:', error);
            alert(error.response?.data?.message || 'Payment initialization failed. Please try again.');
            setIsProcessing(false);
            setLoadingText('Initializing...');
        }
    };

    if (!bulkOrderId && currentCheckoutItems.length === 0 && cartItems.length === 0 && !isProcessing && !hasNavigated.current) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag size={48} className="text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-gray-500 mb-4">Please select a service or product to continue.</p>
                <button
                    onClick={() => navigate('/user/services')}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark cursor-pointer"
                >
                    Explore Services
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-gray-900">
            {/* Full Screen Processing Loader */}
            {isProcessing && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[1000] flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <h2 className="text-xl font-black uppercase tracking-widest">{loadingText}</h2>
                    <p className="text-xs font-bold text-gray-300 mt-2 opacity-80">Please do not close this window</p>
                </div>
            )}
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-primary shadow-md px-4 sm:px-6 pt-5 pb-5 rounded-b-3xl flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="text-left">
                        <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">Order Summary</h1>
                        {isServiceCheckout && currentCheckoutItems.length > 1 && (
                            <p className="text-[10px] font-bold text-white/80">
                                {currentCheckoutItems.length} garments · one tailor · one delivery
                            </p>
                        )}
                        <p className="text-xs text-white/80 font-medium">Final step - Confirm & place your order</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-2xl text-white backdrop-blur-xs shrink-0">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <ShieldCheck size={13} className="text-white" />
                    </div>
                    <div className="text-left leading-tight">
                        <p className="font-extrabold text-[11px]">100% Secure</p>
                        <p className="text-[9px] text-white/80 font-medium">Safe & Encrypted</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-500">

                {/* Top Step Progress Tracker Wizard */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-100/80">
                    <div className="relative flex items-center justify-between px-2 sm:px-8">
                        {/* Dotted Connecting Line */}
                        <div className="absolute top-5 left-10 right-10 border-t-2 border-dashed border-primary/20 z-0" />

                        {/* Step 1: Service */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <ShoppingBag size={16} />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check size={10} strokeWidth={3} />
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 mt-1.5">Service</span>
                        </div>

                        {/* Step 2: Measurements */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <Ruler size={16} />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check size={10} strokeWidth={3} />
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 mt-1.5">Measurements</span>
                        </div>

                        {/* Step 3: Address */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <MapPin size={16} />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check size={10} strokeWidth={3} />
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 mt-1.5">Address</span>
                        </div>

                        {/* Step 4: Payment (Active) */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-2xs">
                                    <CreditCard size={16} />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                                    4
                                </div>
                            </div>
                            <span className="text-[11px] font-extrabold text-primary mt-1.5">Payment</span>
                        </div>
                    </div>
                </div>

                {isCalculatingDistance && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 animate-pulse">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold">Calculating road distance for Tailor visit...</span>
                    </div>
                )}

                {/* 2. Review Section */}
                {bulkOrderId && bulkOrder ? (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs mb-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">Bulk Order Deposit</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Inquiry Review</h3>
                        <div className="flex gap-5">
                            <div className="w-20 h-24 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                <Package size={24} className="text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 leading-tight">{bulkOrder.serviceType}</h4>
                                <p className="text-xs text-gray-500 font-semibold mt-1">{bulkOrder.organizationName || 'Bulk Inquiry'}</p>
                                <div className="mt-4 flex items-center gap-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Quantity</p>
                                        <p className="text-sm font-bold text-gray-900">{bulkOrder.estimatedQuantity} Units</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Quote</p>
                                        <p className="text-sm font-bold text-gray-900">₹{bulkOrder.quote.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isServiceCheckout ? (
                    <div className="space-y-4">
                        {currentCheckoutItems.map((item, idx) => (
                            <ServiceReviewCard
                                key={item.basketId || idx}
                                service={item.serviceDetails}
                                config={item.configuration}
                                pricing={item.pricing}
                                onRemove={!isBuyNowMode ? () => removeServiceItem(idx) : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs mb-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Cart Items ({cartItems.length})</h3>
                        <div className="space-y-4">
                            {cartItems.map((item) => {
                                const isItemAlteration = item.isAlteration;
                                const imageSrc = isItemAlteration ? item.config?.alterationImages?.[0] : (item.images?.[0] || item.image);
                                const title = isItemAlteration ? 'Custom Alteration Request' : item.title;
                                const description = isItemAlteration ? item.config?.alterationDescription : `Size: ${item.selectedSize} • ${item.selectedColor}`;
                                const priceDisplay = isItemAlteration ? 'Awaiting Quote' : `₹${item.price}`;

                                return (
                                    <div key={item.cartId} className="flex gap-4 items-center">
                                        <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                            <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{title}</h4>
                                            <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">{description}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-sm font-bold text-primary">{priceDisplay}</span>
                                                {!isItemAlteration && <span className="text-xs font-bold text-gray-400">QTY: {item.quantity}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Delivery Details Card */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <MapPin size={18} className="text-primary" />
                            <span>Delivery Details</span>
                        </h3>
                        <button
                            onClick={() => navigate('/user/checkout/address')}
                            className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
                        >
                            CHANGE
                        </button>
                    </div>

                    {selectedAddress ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            
                            {/* Address Text Info (7 cols) */}
                            <div className="md:col-span-7 space-y-1.5 text-xs text-gray-600 leading-relaxed text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-gray-900 text-sm">{selectedAddress?.receiverName || 'Turab'}</span>
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wide">
                                        {selectedAddress?.type || 'HOME'}
                                    </span>
                                </div>
                                <p className="text-gray-600 font-medium">
                                    {formatCheckoutAddress(selectedAddress)}
                                </p>
                                <p className="pt-1 text-slate-600 font-medium">
                                    Contact: <span className="font-bold text-slate-900">{selectedAddress?.phone || '9070000338'}</span>
                                </p>
                            </div>

                            {/* Estimated Delivery & Visit Box (5 cols) */}
                            <div className="md:col-span-5 bg-primary/5 border border-primary/10 rounded-2xl p-3.5 space-y-3 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        📅
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-500 font-semibold">Estimated Delivery</p>
                                        <p className="font-bold text-gray-900">Thu, Aug 13, 2026</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        🛵
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-500 font-semibold">Delivery Type</p>
                                        <p className="font-bold text-gray-900">Standard Delivery</p>
                                    </div>
                                </div>

                                {hasTailorAtHome && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            👤
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-500 font-semibold">Tailor Visit</p>
                                            <p className="font-bold text-gray-900">At Your Home</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-center space-y-3">
                            <MapPin size={32} className="mx-auto text-amber-500 opacity-50" />
                            <p className="text-xs font-bold text-amber-900">No Address Selected</p>
                            <button
                                onClick={() => navigate('/user/checkout/address')}
                                className="px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                                Select Address Now
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Coupon / Offers + Bill Details */}
                {!isCartAlteration && !isLoadingPricing && (
                    <CouponOfferSection
                        orderAmount={baseTotal}
                        checkoutType={couponCheckoutType}
                        appliedCoupon={appliedCoupon}
                        onApplied={setAppliedCoupon}
                        onRemoved={clearAppliedCoupon}
                    />
                )}

                {isCartAlteration ? (
                    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 text-center">
                        <h3 className="text-sm font-bold text-primary mb-1">Awaiting Quote</h3>
                        <p className="text-xs text-primary/80">The tailor will review your request and send you a custom price quote. You do not need to pay anything right now.</p>
                    </div>
                ) : isLoadingPricing ? (
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                ) : (
                    <BillDetails 
                        pricing={displayPricing} 
                        advancePercentage={effectiveAdvancePct} 
                        baseLabel={isCartCheckout ? "Product Charges" : "Stitching Charges"}
                    />
                )}

                {/* 5. Special Instructions (Optional) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-primary" />
                        <span>Special Instructions (Optional)</span>
                    </h3>
                    <div className="relative">
                        <textarea
                            rows={3}
                            maxLength={150}
                            placeholder="Add any special instructions for the tailor..."
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all resize-none"
                        />
                        <span className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-semibold">0/150</span>
                    </div>
                </div>



            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 sm:px-6 shadow-xl z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Left: Total & Advance Amounts */}
                    <div className="text-left">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500 font-semibold">Total Amount</span>
                            <span className="text-lg sm:text-xl font-black text-gray-900">
                                ₹{finalTotal.toLocaleString('en-IN')}
                            </span>
                        </div>
                        {discountAmount > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">
                                Coupon saved ₹{discountAmount.toLocaleString('en-IN')}
                            </p>
                        )}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-primary font-bold">
                                {effectiveAdvancePct >= 100 ? 'Payable now' : `Advance (${effectiveAdvancePct}%)`}
                            </span>
                            <span className="text-sm font-extrabold text-primary">
                                ₹{advanceAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Secure Payment Badge (Desktop) */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <ShieldCheck size={16} />
                        <span>Secure Payment • 100% Safe & Secure</span>
                    </div>

                    {/* Right: Solid Purple Place Order Button */}
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || !selectedAddress}
                        className="py-3.5 px-6 sm:px-8 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-extrabold rounded-2xl text-base shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isProcessing ? (
                            <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                        ) : (
                            <>
                                <span>Place Order</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSummary;

