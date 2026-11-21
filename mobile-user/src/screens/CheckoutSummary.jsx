// Port of modules/customer/pages/CheckoutSummary.jsx (converted with scripts/web2rn.js, then reviewed)
import Razorpay from '../lib/razorpay';
import { RAZORPAY_KEY_ID } from '../lib/config';
import { sessionStore } from '../lib/storage';
import { alert } from '../lib/alert';
import Screen from '../components/common/Screen';
import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, ArrowRight, CreditCard, Lock, ShieldCheck, MapPin, Package, Loader2, FileText, ShoppingBag, Ruler, Check } from "lucide-react-native";
import { useNavigate, useLocation } from '../lib/nav';
import toast from '../lib/toast';
import api from "../lib/api";
import useCheckoutStore from "../store/checkoutStore";
import useAddressStore from "../store/userStore";
import useCartStore from "../store/cartStore";
import BillDetails from "../components/customer/checkout/BillDetails";
import CouponOfferSection from "../components/customer/checkout/CouponOfferSection";
import ServiceReviewCard from "../components/customer/checkout/ServiceReviewCard";
import MeasurementSchedulePicker from "../components/customer/checkout/MeasurementSchedulePicker";
import { cn } from "../lib/cn";
import { formatCheckoutAddress, splitAdvanceRemaining } from "../utils/checkoutBilling";
import useOrderStore from "../store/orderStore";
import { Box, I, Txt, Btn, Img, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
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
    clearAppliedCoupon
  } = useCheckoutStore(state => state);
  const {
    items: cartItems,
    getTotalPrice,
    clearCart
  } = useCartStore(state => state);
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
  const currentCheckoutItems = React.useMemo(() => {
    if (isBuyNowMode && buyNowItem) return [buyNowItem];
    const valid = serviceItems.filter(item => !item.configuration?.pending);
    const seen = new Set();
    return valid.filter(item => {
      const sid = String(item.serviceDetails?._id || item.serviceDetails?.id || item.basketId || '');
      if (!sid || seen.has(sid)) return false;
      seen.add(sid);
      return true;
    });
  }, [isBuyNowMode, buyNowItem, serviceItems]);
  const isServiceCheckout = checkoutType === 'service' || !checkoutType && currentCheckoutItems.length > 0;
  const isCartCheckout = checkoutType === 'cart' || !checkoutType && cartItems.length > 0 && currentCheckoutItems.length === 0;
  const hasTailorAtHome = React.useMemo(() => {
    return currentCheckoutItems.some(item => item.configuration?.isTailorAtHome || item.configuration?.measurements?.option === 'visit' || item.configuration?.measurements?.type === 'home' || item.pricing?.tailorAtHome && item.pricing.tailorAtHome > 0);
  }, [currentCheckoutItems]);
  const existingScheduleItem = currentCheckoutItems.find(item => item.configuration?.scheduledDate || item.configuration?.scheduledTimeSlot || item.configuration?.measurementSchedule);
  const [measurementSchedule, setMeasurementSchedule] = useState(() => ({
    scheduledDate: existingScheduleItem?.configuration?.scheduledDate || existingScheduleItem?.configuration?.measurementSchedule?.scheduledDate || '',
    scheduledTimeSlot: existingScheduleItem?.configuration?.scheduledTimeSlot || existingScheduleItem?.configuration?.measurementSchedule?.scheduledTimeSlot || 'ASAP',
    scheduledTime: existingScheduleItem?.configuration?.scheduledTime || existingScheduleItem?.configuration?.measurementSchedule?.scheduledTime || null,
    isAsap: existingScheduleItem?.configuration?.isAsap ?? existingScheduleItem?.configuration?.measurementSchedule?.isAsap ?? true
  }));
  useEffect(() => {
    const itemWithSchedule = currentCheckoutItems.find(item => item.configuration?.scheduledDate || item.configuration?.scheduledTimeSlot || item.configuration?.measurementSchedule);
    if (itemWithSchedule?.configuration) {
      const cfg = itemWithSchedule.configuration;
      const sched = cfg.measurementSchedule || cfg;
      setMeasurementSchedule(prev => ({
        scheduledDate: prev.scheduledDate || sched.scheduledDate || '',
        scheduledTimeSlot: prev.scheduledTimeSlot && prev.scheduledTimeSlot !== 'ASAP' ? prev.scheduledTimeSlot : sched.scheduledTimeSlot || 'ASAP',
        scheduledTime: prev.scheduledTime || sched.scheduledTime || null,
        isAsap: sched.isAsap ?? prev.isAsap
      }));
    }
  }, [currentCheckoutItems]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const hasNavigated = useRef(false);
  const [bulkOrder, setBulkOrder] = useState(null);
  const location = useLocation();
  const bulkOrderId = location.state?.bulkOrderId;
  const [advancePercentage, setAdvancePercentage] = useState(30);
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
  const isAlterationCheckout = isCartAlteration || isServiceCheckout && currentCheckoutItems.some(item => item.serviceDetails?.category?.name?.toLowerCase().includes('alteration') || item.serviceDetails?.tags?.some(t => t.toLowerCase().includes('alteration')));
  const requireFullPayment = isCartCheckout && !isCartAlteration && !isCartCustomDesign || isServiceCheckout && isAlterationCheckout;
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
          checkoutType: couponCheckoutType
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
  }, [baseTotal, couponCheckoutType, isLoadingPricing]); // eslint-disable-line react-hooks/exhaustive-deps

  const discountAmount = appliedCoupon ? Math.round(Number(appliedCoupon.discount) || 0) : 0;
  const displayPricing = React.useMemo(() => {
    if (!appliedCoupon || discountAmount <= 0) {
      return {
        ...currentPricing,
        discountAmount: 0,
        couponCode: ''
      };
    }
    return {
      ...currentPricing,
      discountAmount,
      couponCode: appliedCoupon.code,
      preDiscountTotal: baseTotal,
      total: Math.max(0, baseTotal - discountAmount)
    };
  }, [currentPricing, appliedCoupon, discountAmount, baseTotal]);
  const finalTotal = Math.round(Number(displayPricing?.total) || 0);
  const effectiveAdvancePct = requireFullPayment ? 100 : advancePercentage || 30;
  const {
    advanceAmount
  } = splitAdvanceRemaining(finalTotal, effectiveAdvancePct);
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
              isAlteration: true,
              isNewOrder: true
            }
          });
          return;
        }

        // If it's a Custom Design from Cart
        if (isCartCustomDesign) {
          setLoadingText('Submitting custom design request...');
          const customDesignRes = await api.post('/custom-designs/request', {
            tailorId: cartItems[0].tailor || cartItems[0].tailorId,
            notes: cartItems[0].notes || '',
            designType: cartItems[0].designType || 'custom',
            fabricSource: cartItems[0].fabricSource || 'customer',
            referenceImages: cartItems[0].referenceImages || [],
            measurements: cartItems[0].measurements || {},
            deliveryAddress: {
              addressLine1: selectedAddress.addressLine1 || selectedAddress.address,
              city: selectedAddress.city,
              state: selectedAddress.state,
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
              isCustomDesign: true,
              isNewOrder: true
            }
          });
          return;
        }
        let payload;
        if (isServiceCheckout) {
          const firstItemTailor = currentCheckoutItems[0]?.serviceDetails?.tailorId || currentCheckoutItems[0]?.serviceDetails?.tailor;
          const resolvedTailorId = (typeof firstItemTailor === 'object' ? firstItemTailor?._id || firstItemTailor?.id : firstItemTailor) || null;
          payload = {
            tailorId: resolvedTailorId,
            isMeasurementHome: currentCheckoutItems.some(item => item.configuration?.isTailorAtHome || item.configuration?.measurements?.type === 'home' || item.configuration?.measurements?.option === 'visit'),
            items: currentCheckoutItems.map(item => {
              const rawId = item.serviceDetails?._id || item.serviceDetails?.id;
              const serviceId = rawId && typeof rawId === 'string' && rawId.length === 24 ? rawId : item.serviceDetails?.id || item.serviceDetails?._id;
              const rawFabric = item.configuration?.selectedFabric?._id || item.configuration?.selectedFabric?.id || item.configuration?.selectedFabric;
              const fabricId = rawFabric && typeof rawFabric === 'string' && rawFabric.length === 24 ? rawFabric : null;
              return {
                service: serviceId,
                fabricSource: item.configuration?.fabricSource || 'customer',
                deliveryType: item.configuration?.deliveryType || 'standard',
                selectedFabric: fabricId,
                quantity: 1,
                price: item.pricing?.base || 0,
                measurements: item.configuration?.isTailorAtHome ? {
                  type: 'home'
                } : item.configuration?.measurements || {},
                isTailorAtHome: !!item.configuration?.isTailorAtHome,
                selectedStyle: item.configuration?.selectedStyle || null,
                addons: item.configuration?.addons || item.configuration?.styleAddons || item.addons || item.styleAddons || [],
                customizations: item.configuration?.customizations || item.customizations || {}
              };
            }),
            totalAmount: finalTotal,
            promoCode: appliedCoupon?.code || undefined,
            deliveryFee: currentPricing.delivery || 0,
            platformFee: currentPricing.platformFee || 0,
            gstAmount: currentPricing.taxes || 0,
            scheduledDate: measurementSchedule.scheduledDate || new Date().toISOString().split('T')[0],
            scheduledTimeSlot: measurementSchedule.isAsap ? 'ASAP' : measurementSchedule.scheduledTimeSlot || 'ASAP',
            scheduledTime: measurementSchedule.isAsap ? null : measurementSchedule.scheduledTime,
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
          const resolvedTailorId = (typeof firstItemTailor === 'object' ? firstItemTailor?._id || firstItemTailor?.id : firstItemTailor) || null;
          payload = {
            tailorId: resolvedTailorId,
            items: cartItems.map(item => {
              const productId = item._id || item.id || item.productId;
              return {
                product: productId && typeof productId === 'string' && productId.length === 24 ? productId : productId,
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
          sessionStore.setItem('lastCreatedOrderId', targetOrderId);
          sessionStore.setItem('lastCreatedOrderNum', targetOrderNum);
        } catch (e) {}
      }
      if (!bulkOrderId) {
        if (requireFullPayment && finalTotal > 0) {
          setLoadingText('Connecting to Secure Payment...');
          const rzpOrderRes = await api.post('/orders/razorpay/create', {
            amount: finalTotal,
            orderObjectId: targetOrderId,
            paymentType: 'full'
          });
          if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
          const rzpOrder = rzpOrderRes.data.data;
          const options = {
            key: rzpOrder.key || RAZORPAY_KEY_ID,
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
                  if (isServiceCheckout) clearCheckout();else {
                    clearCart();
                    clearAppliedCoupon();
                  }
                  navigate('/user/checkout/success', {
                    replace: true,
                    state: {
                      orderId: targetOrderId,
                      orderNumber: targetOrderNum,
                      isFullyPaid: true,
                      isNewOrder: true
                    }
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
            theme: {
              color: "#843D9B"
            }
          };
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response) {
            setIsProcessing(false);
            setLoadingText('Initializing...');
            alert('Payment failed: ' + response.error.description);
          });
          rzp.open();
          return;
        }

        // NORMAL STITCHING ORDER: Send to tailor for acceptance and navigate to success screen
        if (isServiceCheckout) clearCheckout();else {
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
            isAlteration: isCartAlteration,
            isNewOrder: true
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
            state: {
              orderId: bulkOrderId,
              orderNumber: bulkOrder.orderId,
              isBulk: true,
              isNewOrder: true
            }
          });
        } else {
          toast.error('Failed to update bulk order');
          setIsProcessing(false);
        }
        return;
      }
      setLoadingText('Connecting to Secure Payment...');
      const rzpOrderRes = await api.post('/orders/razorpay/create', {
        amount: finalTotal
      });
      if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
      const rzpOrder = rzpOrderRes.data.data;
      const options = {
        key: rzpOrder.key || RAZORPAY_KEY_ID,
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
                state: {
                  orderId: bulkOrderId,
                  orderNumber: bulkOrder.orderId,
                  isBulk: true,
                  isNewOrder: true
                }
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
        theme: {
          color: "#843D9B"
        }
      };
      const rzp = new Razorpay(options);
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
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <I icon={ShoppingBag} size={48} className="text-gray-300 mb-3" />
                <Txt className="text-base font-bold text-gray-900 mb-1">Your cart is empty</Txt>
                <Txt className="text-xs text-gray-500 mb-4">Please select a service or product to continue.</Txt>
                <Btn onPress={() => navigate('/user/services')} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark cursor-pointer">
                    Explore Services
                </Btn>
            </Box></Screen>;
  }
  return <Screen className="bg-[#F8FAFC]" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-[#F8FAFC] font-sans text-gray-900">
            {/* Full Screen Processing Loader */}
            {isProcessing && <Box className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[1000] flex flex-col items-center justify-center text-white">
                    <Spin size={64} className="text-indigo-400" />
                    <Txt className="text-xl font-black uppercase tracking-widest">{loadingText}</Txt>
                    <Txt className="text-xs font-bold text-gray-300 mt-2 opacity-80">Please do not close this window</Txt>
                </Box>}
            {/* 1. Header */}
            <Box className="sticky top-0 z-50 bg-primary shadow-md px-4 sm:px-6 pt-5 pb-5 rounded-b-3xl flex items-center justify-between text-white">
                <Box className="flex items-center gap-3">
                    <Btn onPress={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0">
                        <I icon={ArrowLeft} size={18} />
                    </Btn>
                    <Box className="text-left">
                        <Txt className="text-base sm:text-lg font-extrabold text-white leading-tight">Order Summary</Txt>
                        {isServiceCheckout && currentCheckoutItems.length > 1 && <Txt className="text-[10px] font-bold text-white/80">
                                {currentCheckoutItems.length} garments · one tailor · one delivery
                            </Txt>}
                        <Txt className="text-xs text-white/80 font-medium">Final step - Confirm & place your order</Txt>
                    </Box>
                </Box>

                <Box className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-2xl text-white backdrop-blur-xs shrink-0">
                    <Box className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <I icon={ShieldCheck} size={13} className="text-white" />
                    </Box>
                    <Box className="text-left leading-tight">
                        <Txt className="font-extrabold text-[11px]">100% Secure</Txt>
                        <Txt className="text-[9px] text-white/80 font-medium">Safe & Encrypted</Txt>
                    </Box>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-32">

            <Box className="max-w-xl mx-auto p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-500">

                {/* Top Step Progress Tracker Wizard */}
                <Box className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-100/80">
                    <Box className="relative flex items-center justify-between px-2 sm:px-8">
                        {/* Dotted Connecting Line */}
                        <Box className="absolute top-5 left-10 right-10 border-t-2 border-dashed border-primary/20 z-0" />

                        {/* Step 1: Service */}
                        <Box className="relative z-10 flex flex-col items-center text-center">
                            <Box className="flex items-center gap-1">
                                <Box className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <I icon={ShoppingBag} size={16} />
                                </Box>
                                <Box className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <I icon={Check} size={10} strokeWidth={3} />
                                </Box>
                            </Box>
                            <Txt className="text-[11px] font-bold text-gray-700 mt-1.5">Service</Txt>
                        </Box>

                        {/* Step 2: Measurements */}
                        <Box className="relative z-10 flex flex-col items-center text-center">
                            <Box className="flex items-center gap-1">
                                <Box className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <I icon={Ruler} size={16} />
                                </Box>
                                <Box className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <I icon={Check} size={10} strokeWidth={3} />
                                </Box>
                            </Box>
                            <Txt className="text-[11px] font-bold text-gray-700 mt-1.5">Measurements</Txt>
                        </Box>

                        {/* Step 3: Address */}
                        <Box className="relative z-10 flex flex-col items-center text-center">
                            <Box className="flex items-center gap-1">
                                <Box className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                                    <I icon={MapPin} size={16} />
                                </Box>
                                <Box className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                                    <I icon={Check} size={10} strokeWidth={3} />
                                </Box>
                            </Box>
                            <Txt className="text-[11px] font-bold text-gray-700 mt-1.5">Address</Txt>
                        </Box>

                        {/* Step 4: Payment (Active) */}
                        <Box className="relative z-10 flex flex-col items-center text-center">
                            <Box className="flex items-center gap-1">
                                <Box className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-2xs">
                                    <I icon={CreditCard} size={16} />
                                </Box>
                                <Box className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                                    4
                                </Box>
                            </Box>
                            <Txt className="text-[11px] font-extrabold text-primary mt-1.5">Payment</Txt>
                        </Box>
                    </Box>
                </Box>

                {isCalculatingDistance && <Box className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 animate-pulse">
                        <Spin size={20} className="text-blue-500" />
                        <Txt className="text-sm font-bold">Calculating road distance for Tailor visit...</Txt>
                    </Box>}

                {/* 2. Review Section */}
                {bulkOrderId && bulkOrder ? <Box className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs mb-4 relative overflow-hidden">
                        <Box className="absolute top-0 right-0 p-3">
                            <Txt className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">Bulk Order Deposit</Txt>
                        </Box>
                        <Txt className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Inquiry Review</Txt>
                        <Box className="flex gap-5">
                            <Box className="w-20 h-24 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                <I icon={Package} size={24} className="text-gray-400" />
                            </Box>
                            <Box className="flex-1">
                                <Txt className="text-lg font-bold text-gray-900 leading-tight">{bulkOrder.serviceType}</Txt>
                                <Txt className="text-xs text-gray-500 font-semibold mt-1">{bulkOrder.organizationName || 'Bulk Inquiry'}</Txt>
                                <Box className="mt-4 flex items-center gap-6">
                                    <Box>
                                        <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Quantity</Txt>
                                        <Txt className="text-sm font-bold text-gray-900">{bulkOrder.estimatedQuantity} Units</Txt>
                                    </Box>
                                    <Box>
                                        <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Quote</Txt>
                                        <Txt className="text-sm font-bold text-gray-900">₹{bulkOrder.quote.totalAmount.toLocaleString()}</Txt>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box> : isServiceCheckout ? <Box className="space-y-4">
                        {currentCheckoutItems.map((item, idx) => <ServiceReviewCard key={item.basketId || idx} service={item.serviceDetails} config={item.configuration} pricing={item.pricing} onRemove={!isBuyNowMode ? () => removeServiceItem(idx) : undefined} />)}
                    </Box> : <Box className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs mb-4">
                        <Txt className="text-sm font-bold text-gray-900 mb-3">Cart Items ({cartItems.length})</Txt>
                        <Box className="space-y-4">
                            {cartItems.map(item => {
            const isItemAlteration = item.isAlteration;
            const imageSrc = isItemAlteration ? item.config?.alterationImages?.[0] : item.images?.[0] || item.image;
            const title = isItemAlteration ? 'Custom Alteration Request' : item.title;
            const description = isItemAlteration ? item.config?.alterationDescription : `Size: ${item.selectedSize} • ${item.selectedColor}`;
            const priceDisplay = isItemAlteration ? 'Awaiting Quote' : `₹${item.price}`;
            return <Box key={item.cartId} className="flex gap-4 items-center">
                                        <Box className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                            <Img src={imageSrc} alt={title} className="w-full h-full object-cover" />
                                        </Box>
                                        <Box className="flex-1">
                                            <Txt className="text-sm font-bold text-gray-900 line-clamp-1">{title}</Txt>
                                            <Txt className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">{description}</Txt>
                                            <Box className="flex justify-between items-center mt-2">
                                                <Txt className="text-sm font-bold text-primary">{priceDisplay}</Txt>
                                                {!isItemAlteration && <Txt className="text-xs font-bold text-gray-400">QTY: {item.quantity}</Txt>}
                                            </Box>
                                        </Box>
                                    </Box>;
          })}
                        </Box>
                    </Box>}

                {/* 3. Delivery Details Card */}
                <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                    <Box className="flex justify-between items-center mb-4">
                        <Txt className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <I icon={MapPin} size={18} className="text-primary" />
                            <Txt>Delivery Details</Txt>
                        </Txt>
                        <Btn onPress={() => navigate('/user/checkout/address')} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer">
                            CHANGE
                        </Btn>
                    </Box>

                    {selectedAddress ? <Box className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            
                            {/* Address Text Info (7 cols) */}
                            <Box className="md:col-span-7 space-y-1.5 text-xs text-gray-600 leading-relaxed text-left">
                                <Box className="flex items-center gap-2">
                                    <Txt className="font-extrabold text-gray-900 text-sm">{selectedAddress?.receiverName || 'Turab'}</Txt>
                                    <Txt className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wide">
                                        {selectedAddress?.type || 'HOME'}
                                    </Txt>
                                </Box>
                                <Txt className="text-gray-600 font-medium">
                                    {formatCheckoutAddress(selectedAddress)}
                                </Txt>
                                <Txt className="pt-1 text-slate-600 font-medium">
                                    Contact: <Txt className="font-bold text-slate-900">{selectedAddress?.phone || '9070000338'}</Txt>
                                </Txt>
                            </Box>

                            {/* Estimated Delivery & Visit Box (5 cols) */}
                            <Box className="md:col-span-5 bg-primary/5 border border-primary/10 rounded-2xl p-3.5 space-y-3 text-xs">
                                <Box className="flex items-center gap-3">
                                    <Box className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        📅
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-[10px] text-gray-500 font-semibold">Estimated Delivery</Txt>
                                        <Txt className="font-bold text-gray-900">Thu, Aug 13, 2026</Txt>
                                    </Box>
                                </Box>

                                <Box className="flex items-center gap-3">
                                    <Box className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        🛵
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-[10px] text-gray-500 font-semibold">Delivery Type</Txt>
                                        <Txt className="font-bold text-gray-900">Standard Delivery</Txt>
                                    </Box>
                                </Box>

                                {hasTailorAtHome && <Box className="flex items-center gap-3">
                                        <Box className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            👤
                                        </Box>
                                        <Box className="text-left">
                                            <Txt className="text-[10px] text-gray-500 font-semibold">Tailor Visit</Txt>
                                            <Txt className="font-bold text-gray-900">At Your Home</Txt>
                                        </Box>
                                    </Box>}
                            </Box>
                        </Box> : <Box className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-center space-y-3">
                            <I icon={MapPin} size={32} className="mx-auto text-amber-500 opacity-50" />
                            <Txt className="text-xs font-bold text-amber-900">No Address Selected</Txt>
                            <Btn onPress={() => navigate('/user/checkout/address')} className="px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer">
                                Select Address Now
                            </Btn>
                        </Box>}
                </Box>

                {/* 3.5. Measurement Visit Schedule Picker */}
                {hasTailorAtHome && <MeasurementSchedulePicker value={measurementSchedule} onChange={setMeasurementSchedule} />}

                {/* 4. Coupon / Offers + Bill Details */}
                {!isCartAlteration && !isLoadingPricing && <CouponOfferSection orderAmount={baseTotal} checkoutType={couponCheckoutType} appliedCoupon={appliedCoupon} onApplied={setAppliedCoupon} onRemoved={clearAppliedCoupon} />}

                {isCartAlteration ? <Box className="bg-primary/5 border border-primary/10 rounded-3xl p-5 text-center">
                        <Txt className="text-sm font-bold text-primary mb-1">Awaiting Quote</Txt>
                        <Txt className="text-xs text-primary/80">The tailor will review your request and send you a custom price quote. You do not need to pay anything right now.</Txt>
                    </Box> : isLoadingPricing ? <Box className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs animate-pulse space-y-3">
                        <Box className="h-4 bg-gray-200 rounded w-1/3 mb-4"></Box>
                        <Box className="h-3 bg-gray-200 rounded w-full"></Box>
                        <Box className="h-3 bg-gray-200 rounded w-full"></Box>
                    </Box> : <BillDetails pricing={displayPricing} advancePercentage={effectiveAdvancePct} baseLabel={isCartCheckout ? "Product Charges" : "Stitching Charges"} />}

                {/* 5. Special Instructions (Optional) */}
                <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                    <Txt className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <I icon={FileText} size={18} className="text-primary" />
                        <Txt>Special Instructions (Optional)</Txt>
                    </Txt>
                    <Box className="relative">
                        <Input rows={3} maxLength={150} placeholder="Add any special instructions for the tailor..." className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all resize-none" multiline />
                        <Txt className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-semibold">0/150</Txt>
                    </Box>
                </Box>



            </Box>

                        </Scroll>
{/* Sticky Bottom Bar */}
            <Box className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 sm:px-6 shadow-xl z-50">
                <Box className="max-w-xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Left: Total & Advance Amounts */}
                    <Box className="text-left">
                        <Box className="flex items-baseline gap-2">
                            <Txt className="text-xs text-gray-500 font-semibold">Total Amount</Txt>
                            <Txt className="text-lg sm:text-xl font-black text-gray-900">
                                ₹{finalTotal.toLocaleString('en-IN')}
                            </Txt>
                        </Box>
                        {discountAmount > 0 && <Txt className="text-[10px] text-emerald-600 font-bold">
                                Coupon saved ₹{discountAmount.toLocaleString('en-IN')}
                            </Txt>}
                        <Box className="flex items-baseline gap-1.5">
                            <Txt className="text-xs text-primary font-bold">
                                {effectiveAdvancePct >= 100 ? 'Payable now' : `Advance (${effectiveAdvancePct}%)`}
                            </Txt>
                            <Txt className="text-sm font-extrabold text-primary">
                                ₹{advanceAmount.toLocaleString('en-IN')}
                            </Txt>
                        </Box>
                    </Box>

                    {/* Middle: Secure Payment Badge (Desktop) */}
                    <Box className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <I icon={ShieldCheck} size={16} />
                        <Txt>Secure Payment • 100% Safe & Secure</Txt>
                    </Box>

                    {/* Right: Solid Purple Place Order Button */}
                    <Btn onPress={handlePayment} disabled={isProcessing || !selectedAddress} className="py-3.5 px-6 sm:px-8 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-extrabold rounded-2xl text-base shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer">
                        {isProcessing ? <><Spin size={18} color="#fff" /><Txt>Submitting...</Txt></> : <>
                                <Txt>Place Order</Txt>
                                <I icon={ArrowRight} size={18} />
                            </>}
                    </Btn>
                </Box>
            </Box>
        </Box></Screen>;
};
export default CheckoutSummary;
