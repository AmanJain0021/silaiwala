import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Lock, ShieldCheck, MapPin, Package, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';
import useCheckoutStore from '../../../store/checkoutStore';
import useAddressStore from '../../../store/userStore';
import useCartStore from '../../../store/cartStore';
import BillDetails from '../components/checkout/summary/BillDetails';
import ServiceReviewCard from '../components/checkout/summary/ServiceReviewCard';
import { cn } from '../../../utils/cn';
import { calculateDistance } from '../../../utils/distance';

import useOrderStore from '../../../store/orderStore';

const CheckoutSummary = () => {
    const navigate = useNavigate();
    const {
        serviceItems,
        buyNowItem,
        isBuyNowMode,
        clearCheckout,
        removeServiceItem
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

    const currentCheckoutItems = isBuyNowMode && buyNowItem ? [buyNowItem] : serviceItems;
    const isServiceCheckout = currentCheckoutItems.length > 0;
    const isCartCheckout = cartItems.length > 0;

    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingText, setLoadingText] = useState('Initializing...');
    const [bulkOrder, setBulkOrder] = useState(null);
    const location = useLocation();
    const bulkOrderId = location.state?.bulkOrderId;

    const [roadDistances, setRoadDistances] = useState({});
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
    const [advancePercentage, setAdvancePercentage] = useState(50);
    const [platformFeePercentage, setPlatformFeePercentage] = useState(5);
    const [deliveryRates, setDeliveryRates] = useState({ baseFee: 20, perKmRate: 10 });
    const [gstPercentage, setGstPercentage] = useState(5);

    const [visitSettings, setVisitSettings] = useState({ baseFee: 150, perKmFee: 20, freeKm: 3 });

    // Fetch Admin Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/cms/settings');
                if (res.data.success) {
                    if (res.data.data?.walletConfig?.advancePercentage) {
                        setAdvancePercentage(res.data.data.walletConfig.advancePercentage);
                    }
                    if (res.data.data?.walletConfig?.platformFeePercentage) {
                        setPlatformFeePercentage(res.data.data.walletConfig.platformFeePercentage);
                    }
                    if (res.data.data?.deliveryRates) {
                        setDeliveryRates(res.data.data.deliveryRates);
                    }
                    if (res.data.data?.visitFee) {
                        setVisitSettings(res.data.data.visitFee);
                    }
                    if (res.data.data?.pricing?.gstPercentage !== undefined) {
                        setGstPercentage(res.data.data.pricing.gstPercentage);
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

    // Redirect if cart becomes empty
    useEffect(() => {
        if (!bulkOrderId && currentCheckoutItems.length === 0 && cartItems.length === 0) {
            navigate('/user/services');
        }
    }, [currentCheckoutItems.length, cartItems.length, bulkOrderId, navigate]);

    // Fetch Road Distance dynamically if needed
    useEffect(() => {
        if (!selectedAddress?.location?.coordinates || (!isServiceCheckout && !isCartCheckout)) return;

        const fetchDistances = async () => {
            const newDistances = { ...roadDistances };
            let needsUpdate = false;
            let fetching = false;

            const itemsToCheck = isServiceCheckout ? currentCheckoutItems : cartItems;

            for (const item of itemsToCheck) {
                let tCoords = null;
                let idForCache = null;

                if (isServiceCheckout && item.serviceDetails?.tailorCoordinates) {
                    tCoords = item.serviceDetails.tailorCoordinates;
                    idForCache = item.basketId;
                } else if (isCartCheckout && item.tailor?.location?.coordinates) {
                    tCoords = item.tailor.location.coordinates;
                    idForCache = item.cartId;
                }

                if (tCoords) {
                    const [uLng, uLat] = selectedAddress.location.coordinates;
                    const cacheKey = `${idForCache}_${uLat}_${uLng}`;

                    if (roadDistances[idForCache]?.key !== cacheKey) {
                        fetching = true;
                        setIsCalculatingDistance(true);
                        try {
                            const [tLng, tLat] = tCoords;
                            console.log(`🛣️ [CheckoutSummary] Calculating distance for ${idForCache}`, { origin: [tLat, tLng], destination: [uLat, uLng] });
                            
                            const res = await api.post('/distance/calculate', {
                                origin: [tLat, tLng],
                                destination: [uLat, uLng]
                            });

                            if (res.data.success) {
                                console.log(`📏 [CheckoutSummary] Distance API Response for ${idForCache}:`, res.data.data);
                                const distanceKm = res.data.data.distance;
                                
                                newDistances[idForCache] = { key: cacheKey, distanceKm };
                                needsUpdate = true;
                            }
                        } catch (err) {
                            console.error("Failed to fetch road distance:", err);
                        }
                    }
                }
            }

            if (needsUpdate) {
                setRoadDistances(newDistances);
            }
            if (fetching) {
                setIsCalculatingDistance(false);
            }
        };

        fetchDistances();
    }, [selectedAddress, currentCheckoutItems, cartItems, isServiceCheckout, isCartCheckout, visitSettings]);

    const getServicePricing = () => {
        if (currentCheckoutItems.length === 0) return { total: 0, base: 0, taxes: 0, delivery: 0, addons: 0, tailorAtHome: 0 };
        
        let orderDeliveryFee = 0;

        const pricing = currentCheckoutItems.reduce((acc, item, index) => {
            const itemBase = item.pricing.base || 0;
            let dynamicTailorAtHome = item.pricing.tailorAtHome || 0;

            if (selectedAddress?.location?.coordinates && item.serviceDetails?.tailorCoordinates) {
                const [uLng, uLat] = selectedAddress.location.coordinates;
                const cacheKey = `${item.basketId}_${uLat}_${uLng}`;
                let distanceKm = 0;
                
                if (roadDistances[item.basketId] && roadDistances[item.basketId].key === cacheKey) {
                    distanceKm = roadDistances[item.basketId].distanceKm;
                    if (item.configuration.isTailorAtHome) {
                        if (distanceKm <= visitSettings.freeKm) {
                            dynamicTailorAtHome = visitSettings.baseFee;
                        } else {
                            dynamicTailorAtHome = Math.round(visitSettings.baseFee + (distanceKm - visitSettings.freeKm) * visitSettings.perKmFee);
                        }
                    }
                } else {
                    try {
                        const [tLng, tLat] = item.serviceDetails.tailorCoordinates;
                        distanceKm = calculateDistance(uLat, uLng, tLat, tLng);
                        if (item.configuration.isTailorAtHome) {
                            if (distanceKm <= visitSettings.freeKm) {
                                dynamicTailorAtHome = visitSettings.baseFee;
                            } else {
                                dynamicTailorAtHome = Math.round(visitSettings.baseFee + (distanceKm - visitSettings.freeKm) * visitSettings.perKmFee);
                            }
                        }
                    } catch (err) {
                        console.error("Distance recalculation failed:", err);
                    }
                }

                if (index === 0 && distanceKm > 0) {
                    orderDeliveryFee = Math.round(deliveryRates.baseFee + (distanceKm * deliveryRates.perKmRate));
                }
            }

            // We won't use itemTaxes here, we'll calculate total GST at the end
            const itemAddons = item.pricing.addons || 0;
            const itemFabric = item.pricing.fabric || 0;
            const newTotal = itemBase + itemAddons + itemFabric + dynamicTailorAtHome; // without tax

            return {
                total: acc.total + newTotal,
                base: acc.base + itemBase,
                taxes: 0,
                delivery: 0,
                addons: acc.addons + itemAddons,
                fabric: (acc.fabric || 0) + itemFabric,
                tailorAtHome: acc.tailorAtHome + dynamicTailorAtHome
            };
        }, { total: 0, base: 0, taxes: 0, delivery: 0, addons: 0, fabric: 0, tailorAtHome: 0 });
        
        const platformFeeAmount = Math.round((pricing.base + pricing.addons) * (platformFeePercentage / 100));
        pricing.platformFee = platformFeeAmount;
        pricing.platformFeePercentage = platformFeePercentage;
        pricing.delivery = orderDeliveryFee;
        
        // Dynamic GST Calculation (excluding delivery fee to match backend logic)
        const taxableAmount = pricing.base + pricing.addons + pricing.fabric + pricing.tailorAtHome + platformFeeAmount;
        const totalTaxes = Math.round(taxableAmount * (gstPercentage / 100));
        
        pricing.taxes = totalTaxes;
        pricing.gstPercentage = gstPercentage;
        pricing.total += orderDeliveryFee + platformFeeAmount + totalTaxes;
        
        return pricing;
    };

    let cartBase = 0;
    let cartDelivery = 0;
    let cartPlatformFee = 0;
    let cartTaxes = 0;
    
    if (isCartCheckout) {
        cartBase = getTotalPrice();
        // Use admin delivery base fee + perKm calculation if coordinates exist
        let orderDeliveryFee = deliveryRates.baseFee || 49;
        
        if (cartBase <= 999 && cartItems.length > 0) {
            const firstItem = cartItems[0];
            const itemId = firstItem.cartId;
            if (firstItem.tailor?.location?.coordinates && selectedAddress?.location?.coordinates) {
                const [uLng, uLat] = selectedAddress.location.coordinates;
                const cacheKey = `${itemId}_${uLat}_${uLng}`;
                let distanceKm = 0;

                if (roadDistances[itemId] && roadDistances[itemId].key === cacheKey) {
                    distanceKm = roadDistances[itemId].distanceKm;
                } else {
                    try {
                        const [tLng, tLat] = firstItem.tailor.location.coordinates;
                        distanceKm = calculateDistance(uLat, uLng, tLat, tLng);
                    } catch (err) {
                        console.error("Cart Distance recalculation failed:", err);
                    }
                }

                if (distanceKm > 0) {
                    orderDeliveryFee = Math.round(deliveryRates.baseFee + (distanceKm * deliveryRates.perKmRate));
                    console.log(`[Cart] orderDeliveryFee calculated: ${orderDeliveryFee} using distance: ${distanceKm}`);
                }
            }
        }
        
        cartDelivery = cartBase > 999 ? 0 : orderDeliveryFee;
        cartPlatformFee = Math.round(cartBase * (platformFeePercentage / 100));
        // Calculate GST excluding delivery fee to match backend logic
        cartTaxes = Math.round((cartBase + cartPlatformFee) * (gstPercentage / 100));
    }

    const isCartAlteration = isCartCheckout && cartItems.length > 0 && cartItems[0].isAlteration;
    const isCartCustomDesign = isCartCheckout && cartItems.length > 0 && cartItems[0].isCustomDesign;
    const isAlterationCheckout = isCartAlteration || (isServiceCheckout && currentCheckoutItems.some(item => 
        item.serviceDetails?.category?.name?.toLowerCase().includes('alteration') || 
        item.serviceDetails?.tags?.some(t => t.toLowerCase().includes('alteration'))
    ));
    const requireFullPayment = (isCartCheckout && !isCartAlteration && !isCartCustomDesign) || (isServiceCheckout && isAlterationCheckout);

    const currentPricing = bulkOrder
        ? {
            total: bulkOrder.quote.depositRequired,
            base: bulkOrder.quote.depositRequired,
            taxes: 0,
            delivery: 0,
            platformFee: 0,
            platformFeePercentage: 0,
            gstPercentage: 0
        }
        : isServiceCheckout ? getServicePricing() : {
            total: cartBase + cartDelivery + cartPlatformFee + cartTaxes,
            base: cartBase,
            taxes: cartTaxes,
            delivery: cartDelivery,
            platformFee: cartPlatformFee,
            platformFeePercentage: platformFeePercentage,
            gstPercentage: gstPercentage
        };

    const finalTotal = currentPricing.total;

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
                // If it's a Custom Alteration from Cart, skip Order flow entirely
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
                    
                    clearCart();
                    navigate('/user/orders', { state: { message: "Alteration request submitted successfully! Awaiting quote." } });
                    return;
                }

                // If it's a Custom Design from Cart, skip Order flow entirely
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
                    
                    clearCart();
                    navigate('/user/orders', { state: { message: "Custom design request submitted successfully! Awaiting quote." } });
                    return;
                }

                let payload;
                if (isServiceCheckout) {
                    const firstItemTailor = currentCheckoutItems[0]?.serviceDetails?.tailorId || currentCheckoutItems[0]?.serviceDetails?.tailor;
                    payload = {
                        tailorId: firstItemTailor,
                        items: currentCheckoutItems.map(item => ({
                            service: item.serviceDetails.id || item.serviceDetails._id,
                            fabricSource: item.configuration.fabricSource,
                            deliveryType: item.configuration.deliveryType,
                            selectedFabric: item.configuration.selectedFabric?._id || item.configuration.selectedFabric?.id,
                            quantity: 1,
                            price: item.pricing.base,
                            measurements: item.configuration.isTailorAtHome ? { type: 'home' } : item.configuration.measurements,
                            isTailorAtHome: item.configuration.isTailorAtHome,
                            addons: item.configuration.addons
                        })),
                        totalAmount: finalTotal,
                        deliveryFee: currentPricing.delivery,
                        platformFee: currentPricing.platformFee,
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
                    payload = {
                        tailorId: firstItemTailor,
                        items: cartItems.map(item => ({
                            product: item._id,
                            quantity: item.quantity,
                            price: item.price
                        })),
                        totalAmount: finalTotal,
                        deliveryFee: currentPricing.delivery,
                        platformFee: currentPricing.platformFee,
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
                const endpoint = isCartAlteration ? '/alterations/request' : '/orders';
                const orderRes = await api.post(endpoint, payload);
                if (!orderRes.data.success) throw new Error(isCartAlteration ? 'Alteration request failed' : 'Order creation failed');
                order = orderRes.data.data;
            }

            if (!bulkOrderId) {
                if (requireFullPayment) {
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
                                    orderObjectId: order._id,
                                    paymentType: 'full'
                                });

                                if (verifyRes.data.success) {
                                    if (isServiceCheckout) clearCheckout();
                                    else clearCart();

                                    navigate('/user/checkout/success', {
                                        state: { orderId: order._id, orderNumber: order.orderId, isFullyPaid: true }
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

                // NORMAL STITCHING ORDER: Skip payment, send to tailor for acceptance
                if (isServiceCheckout) clearCheckout();
                else clearCart();

                navigate('/user/checkout/success', {
                    state: { 
                        orderId: order._id, 
                        orderNumber: order.orderId || order.alterationId, 
                        pendingAcceptance: true,
                        isAlteration: isCartAlteration
                    }
                });
                return;
            }

            // ONLY BULK ORDERS DO DEPOSIT PAYMENT HERE NOW
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

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900">
            {/* Full Screen Processing Loader */}
            {isProcessing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <h2 className="text-xl font-black uppercase tracking-widest">{loadingText}</h2>
                    <p className="text-xs font-bold text-slate-300 mt-2 opacity-80">Please do not close this window</p>
                </div>
            )}
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-[#843D9B] shadow-md border-b border-[#843D9B] px-4 py-3 flex items-center gap-3 pt-safe">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm font-bold text-white">Order Summary</h1>
                    <p className="text-[10px] text-gray-300">Final Step</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                <div className="flex-1 space-y-6">
                
                {isCalculatingDistance && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 text-blue-700 animate-pulse">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold">Calculating precise road distance for Tailor visit...</span>
                    </div>
                )}

                    {/* 2. Review Section */}
                    {bulkOrderId && bulkOrder ? (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="px-3 py-1 bg-indigo-50 text-[#843D9B] rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Bulk Order Deposit</span>
                            </div>
                            <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest italic">Inquiry Review</h3>
                            <div className="flex gap-5">
                                <div className="w-20 h-24 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                    <Package size={24} className="text-gray-300" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-gray-900 leading-tight">{bulkOrder.serviceType}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{bulkOrder.organizationName || 'Bulk Inquiry'}</p>
                                    <div className="mt-4 flex items-center gap-6">
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Quantity</p>
                                            <p className="text-xs font-black text-gray-900">{bulkOrder.estimatedQuantity} Units</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Total Quote</p>
                                            <p className="text-xs font-black text-gray-900">₹{bulkOrder.quote.totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isServiceCheckout ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{isBuyNowMode ? 'Book Now Item' : `Service Bundle (${currentCheckoutItems.length} items)`}</h3>
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
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Cart Items ({cartItems.length})</h3>
                            <div className="space-y-4">
                                {cartItems.map((item) => {
                                    const isItemAlteration = item.isAlteration;
                                    const imageSrc = isItemAlteration ? item.config?.alterationImages?.[0] : (item.images?.[0] || item.image);
                                    const title = isItemAlteration ? 'Custom Alteration Request' : item.title;
                                    const description = isItemAlteration ? item.config?.alterationDescription : `Size: ${item.selectedSize} • ${item.selectedColor}`;
                                    const priceDisplay = isItemAlteration ? 'Awaiting Quote' : `₹${item.price}`;

                                    return (
                                        <div key={item.cartId} className="flex gap-4">
                                            <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                                <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{title}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1 line-clamp-1">{description}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm font-bold text-[#843D9B]">{priceDisplay}</span>
                                                    {!isItemAlteration && <span className="text-[10px] font-black text-gray-400">QTY: {item.quantity}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Address Preview */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <MapPin size={16} className="text-[#843D9B]" />
                                Delivery Details
                            </h3>
                            <button
                                onClick={() => navigate('/user/checkout/address')}
                                className="text-[10px] font-bold text-[#843D9B] uppercase tracking-wider hover:underline"
                            >
                                Change
                            </button>
                        </div>
                        {selectedAddress ? (
                            <div className="bg-[#843D9B]/[0.02] p-4 rounded-xl border border-[#843D9B]/10 text-xs text-gray-600 leading-relaxed animate-in fade-in duration-300">
                                <p className="font-bold text-gray-900 mb-2">{selectedAddress?.receiverName} <span className="ml-2 px-2 py-0.5 bg-[#843D9B]/10 text-[#843D9B] rounded-full text-[9px] uppercase tracking-widest">{selectedAddress?.type}</span></p>
                                <p className="text-gray-600">{selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.zipCode}</p>
                                <p className="mt-2 font-bold text-[#843D9B]">Contact: {selectedAddress?.phone}</p>
                            </div>
                        ) : (
                            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 text-center space-y-3">
                                <MapPin size={32} className="mx-auto text-amber-500 opacity-50" />
                                <p className="text-xs font-bold text-amber-900">No Address Selected</p>
                                <button
                                    onClick={() => navigate('/user/checkout/address')}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                    Select Now

                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-96 space-y-4">
                    {isCartAlteration ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center mb-4">
                        <h3 className="text-sm font-bold text-[#843D9B] mb-1">Awaiting Quote</h3>
                        <p className="text-xs text-indigo-700/70">The tailor will review your request and send you a custom price quote. You do not need to pay anything right now.</p>
                    </div>
                ) : (
                    <BillDetails 
                        pricing={currentPricing} 
                        advancePercentage={requireFullPayment ? 100 : advancePercentage} 
                        baseLabel={isCartCheckout ? "Product Charges" : "Stitching Charges"}
                    />
                )}

                    {/* 5. Payment Method / Submit Action */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        {!isCartAlteration && (
                            <>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard size={15} className="text-[#843D9B]" />
                                    Payment Method
                                </h3>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <span className="font-bold text-[10px] text-gray-900">UPI</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-900">Razorpay Secure</p>
                                        <p className="text-[10px] text-gray-500">Fast & Encrypted</p>
                                    </div>
                                    <Lock size={14} className="text-[#843D9B]" />
                                </div>
                            </>
                        )}

                        <div className={`${!isCartAlteration ? 'pt-4 border-t border-gray-100 mt-4' : ''} hidden lg:flex gap-3`}>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">To Pay</p>
                                <p className="font-bold text-gray-900 mt-1">₹{finalTotal.toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6c3080] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <><Loader2 size={18} className="animate-spin" /> {loadingText}</>
                                ) : (
                                    <>
                                        {(bulkOrderId || isCartAlteration || isCartCustomDesign || (!requireFullPayment && !isCartCheckout)) 
                                            ? 'Place Order' 
                                            : requireFullPayment 
                                                ? 'Proceed to Secure Payment' 
                                                : `Pay Advance ₹${Math.round(finalTotal * (advancePercentage/100))}`
                                        }
                                    </>
                                )}
                            </button>
                        </div>

                        {!isCartAlteration && (
                            <div className="mt-4 text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} className="text-green-500" />
                                Secure Payment Powered by Razorpay
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Mobile Footer Action (Only shown on small screens if not sticky above) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe z-40">
                <button
                    onClick={handlePayment}
                    disabled={isProcessing || !selectedAddress}
                    className="w-full py-3.5 rounded-xl bg-[#843D9B] text-white text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-[#1E1F4D] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale"
                >
                    {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-white" /> Wait...</>
                    ) : !selectedAddress ? (
                        'Select Address'
                    ) : (
                        (isCartAlteration || isCartCustomDesign) ? <>{'Submit Request'} <ArrowRight size={16} /></> : <>{bulkOrderId ? `Pay Deposit ₹${finalTotal}` : (requireFullPayment ? `Pay ₹${finalTotal}` : `Place Order`)} <ArrowRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CheckoutSummary;
