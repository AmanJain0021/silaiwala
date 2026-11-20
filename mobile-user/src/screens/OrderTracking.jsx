// Port of modules/customer/pages/OrderTracking.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import Razorpay from '../lib/razorpay';
import { alert } from '../lib/alert';
import { prompt } from '../lib/prompt';
import Screen from '../components/common/Screen';
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from '../lib/nav';
import { ArrowLeft, MapPin, Phone, MessageSquare, AlertCircle, Package, Truck, Calendar, ChevronRight, ShieldCheck, Loader2, CheckCircle2, Star, User, Scissors, Store, MoreVertical, Headphones, Radio, Gift, Layers, Shirt, Box as BoxIcon, ShoppingBag, Check, CreditCard, FileText, Ruler, Sparkles, Plus } from "lucide-react-native";
import api from "../lib/api";
import TrackingTimeline from "../components/customer/orders/TrackingTimeline";
import { io } from "socket.io-client";
import { SOCKET_URL, RAZORPAY_KEY_ID } from "../lib/config";
import { getToken } from "../lib/auth";
import ReviewModal from "../components/customer/orders/ReviewModal";
import LiveDeliveryTracker from "../components/shared/LiveDeliveryTracker";
import LiveMeasurementTracker from "../components/shared/LiveMeasurementTracker";
import ExchangeRequestModal from "../components/customer/orders/ExchangeRequestModal";
import OrderHelpModal from "../components/customer/orders/OrderHelpModal";
import useBrandingStore from "../store/brandingStore";
import { formatOrderItemsTitle, getItemImage, getItemLabel, orderHasTailorAtHome } from "../utils/orderItems";
import { getImageUrl } from "../utils/imageUrl";
import { Box, I, Txt, Btn, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const CUSTOMIZATION_SLOT_LABELS = {
  neck: 'Neck Design',
  sleeve: 'Sleeve Style',
  bottom: 'Bottom Style',
  embroidery: 'Embroidery Work',
  lacePiping: 'Lace / Piping',
  lining: 'Inner Lining',
  other: 'Customization'
};
const getNormalizedCustomizations = item => {
  const custs = item?.customizations || item?.configuration?.customizations || {};
  if (!custs || typeof custs !== 'object') return [];
  const entries = [];
  for (const [key, val] of Object.entries(custs)) {
    if (!val) continue;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed) {
        entries.push({
          key,
          label: CUSTOMIZATION_SLOT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          name: trimmed,
          price: 0,
          refImage: '',
          description: '',
          notes: '',
          isCustom: true
        });
      }
    } else if (typeof val === 'object') {
      if (val.enabled === false) continue;
      const name = val.name || val.title || '';
      const refImage = val.refImage || val.image || '';
      const price = Number(val.price) || 0;
      const description = val.description || '';
      const notes = val.notes || '';
      if (name || refImage || price > 0 || description || notes) {
        entries.push({
          key,
          label: CUSTOMIZATION_SLOT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          name: name || (notes ? 'Custom Instruction' : 'Custom Selection'),
          price,
          refImage,
          description,
          notes,
          isCustom: !!val.isCustom
        });
      }
    }
  }
  return entries;
};
const getNormalizedAddons = item => {
  const rawAddons = item?.styleAddons || item?.addons || item?.configuration?.addons || item?.configuration?.styleAddons || [];
  if (!Array.isArray(rawAddons)) return [];
  return rawAddons.filter(a => a && (a.name || a.title || Number(a.price) > 0 || a.image || a.refImage)).map((a, idx) => ({
    _id: a._id || a.id || idx,
    name: a.name || a.title || 'Add-on Option',
    price: Number(a.price) || 0,
    image: a.image || a.refImage || '',
    description: a.description || '',
    category: a.category || ''
  }));
};
const OrderTracking = () => {
  const scrollRef = React.useRef(null);
  const sectionY = React.useRef({});
  const scrollToSection = (name) => { const y = sectionY.current[name]; if (scrollRef.current && y != null) scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true }); };
  const onSectionLayout = (name) => (e) => { sectionY.current[name] = e.nativeEvent.layout.y; };
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [measurementReport, setMeasurementReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isBulk, setIsBulk] = useState(location.state?.isBulk || false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [measurementOtp, setMeasurementOtp] = useState(null);
  const [settings, setSettings] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const appName = useBrandingStore(state => state.appName);
  const [showOrderDetailsSection, setShowOrderDetailsSection] = useState(true);
  const [socketInstance, setSocketInstance] = useState(null);
  const fetchOrderDetails = useCallback(async () => {
    try {
      let response;
      try {
        response = await api.get(`/orders/${id}`);
      } catch (err) {
        if (err.response?.status === 404) {
          response = await api.get(`/bulk-orders/${id}`);
          setIsBulk(true);
        } else {
          throw err;
        }
      }
      if (response?.data?.success) {
        const fetchedOrder = response.data.data;
        setOrder(fetchedOrder);
        if (fetchedOrder.measurementOtp) {
          setMeasurementOtp(fetchedOrder.measurementOtp);
        }
        setError(null);
        try {
          const unreadRes = await api.get('/orders/chats/unread');
          if (unreadRes.data?.success) {
            setUnreadChatCount(unreadRes.data.data[id] || 0);
          }
        } catch (uErr) {
          console.error('Failed to fetch unread chats:', uErr);
        }
        if (fetchedOrder.isMeasurementHome) {
          try {
            const mRes = await api.get(`/orders/${id}/measurements`);
            if (mRes.data.success) {
              setMeasurementReport(mRes.data.data);
            }
          } catch (mErr) {
            console.error('Failed to fetch measurement report:', mErr);
          }
        }
        setIsLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching order tracking:', err);
        setError(err.response?.data?.message || 'Failed to load tracking details.');
        setIsLoading(false);
      }
    }
  }, [id]);
  const handleMeasurementAction = async action => {
    try {
      if (action === 'approve') {
        const res = await api.post(`/orders/${id}/measurements/approve`);
        if (res.data.success) {
          alert('Measurements approved successfully!');
          fetchOrderDetails();
        }
      } else if (action === 'reject') {
        const notes = await prompt("Please detail the changes required in the measurements:");
        if (!notes) return;
        const res = await api.post(`/orders/${id}/measurements/request-revision`, {
          notes
        });
        if (res.data.success) {
          alert('Revision request sent to executive.');
          fetchOrderDetails();
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to process measurement action');
    }
  };
  useEffect(() => {
    if (id) {
      fetchOrderDetails();
      const socket = io(SOCKET_URL, {
        auth: {
          token: getToken()
        }
      });
      setSocketInstance(socket);
      const joinRooms = () => {
        socket.emit('join_order_room', id);
      };
      socket.on('connect', joinRooms);
      joinRooms();
      const refreshOrder = () => {
        fetchOrderDetails();
      };
      socket.on('order_status_updated', refreshOrder);
      socket.on('order_notification', refreshOrder);
      socket.on('new_chat_message', msg => {
        if (msg.order === id && msg.senderModel !== 'Customer') {
          setUnreadChatCount(prev => prev + 1);
        }
      });
      socket.on('measurement_otp_sent', data => {
        if (data.otp) setMeasurementOtp(data.otp);
        fetchOrderDetails();
      });
      socket.on('new_notification', data => {
        if (data.data?.orderId === id) fetchOrderDetails();
      });
      const fetchSettings = async () => {
        try {
          const res = await api.get('/cms/settings');
          if (res.data?.data) {
            setSettings(res.data.data);
          }
        } catch (err) {
          if (err?.name !== 'CanceledError' && err?.message !== 'canceled' && !err?.message?.includes('Cancelled')) {
            console.error("Failed to fetch settings:", err);
          }
        }
      };
      fetchSettings();
      return () => {
        socket.off('connect', joinRooms);
        socket.off('order_status_updated', refreshOrder);
        socket.off('order_notification', refreshOrder);
        socket.off('new_chat_message');
        socket.off('measurement_otp_sent');
        socket.off('new_notification');
        socket.disconnect();
        setSocketInstance(null);
      };
    }
  }, [id, fetchOrderDetails]);
  if (isLoading) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 font-sans text-gray-900">
                <Box className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 pb-4 pt-safe pt-8 flex items-center gap-3">
                    <Box className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0"></Box>
                    <Box className="flex-1 space-y-2">
                        <Box className="h-4 bg-gray-200 rounded animate-pulse w-32"></Box>
                        <Box className="h-2.5 bg-gray-200 rounded animate-pulse w-24"></Box>
                    </Box>
                </Box>

                <Box className="max-w-xl mx-auto p-4 space-y-4">
                    <Box className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <Box className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse shrink-0"></Box>
                        <Box className="flex-1 space-y-3">
                            <Box className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></Box>
                            <Box className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></Box>
                        </Box>
                    </Box>
                </Box>
            </Box></Screen>;
  }
  if (error || !order) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <I icon={AlertCircle} size={48} className="text-red-400 mb-4" />
                <Txt className="text-lg font-bold text-gray-900">{error || 'Order Not Found'}</Txt>
                <Btn onPress={() => navigate('/user/orders')} className="mt-6 px-8 py-3 bg-[#843D9B] text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all">
                    Back to My Orders
                </Btn>
            </Box></Screen>;
  }
  const handlePayment = async paymentType => {
    setIsProcessingPayment(true);
    try {
      const advanceAmt = order?.advancePaymentAmount && order.advancePaymentAmount > 0 ? order.advancePaymentAmount : Math.max(50, Math.round((order?.totalAmount || 0) * 0.3));
      const remainingAmt = order?.remainingPaymentAmount && order.remainingPaymentAmount > 0 ? order.remainingPaymentAmount : Math.max(50, (order?.totalAmount || 0) - advanceAmt);
      const amountToPay = paymentType === 'advance' ? advanceAmt : remainingAmt;
      const rzpOrderRes = await api.post('/orders/razorpay/create', {
        amount: amountToPay
      });
      if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
      const rzpOrder = rzpOrderRes.data.data;
      const options = {
        key: rzpOrder.key || RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "SilaiWala",
        description: paymentType === 'advance' ? "Advance Payment" : "Remaining Payment",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/orders/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderObjectId: order._id,
              paymentType: paymentType
            });
            if (verifyRes.data.success) {
              alert('Payment successful!');
              fetchOrderDetails();
            }
          } catch (err) {
            console.error('Verification failed:', err);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: order.customer?.name || "",
          contact: order.customer?.phoneNumber || ""
        },
        theme: {
          color: "#843D9B"
        }
      };
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setIsProcessingPayment(false);
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment process failed:', error);
      alert('Payment initialization failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };
  const handleDeliveryPreference = async preference => {
    setIsUpdatingPreference(true);
    try {
      const res = await api.post(`/orders/${id}/delivery-preference`, {
        preference
      });
      if (res.data.success) {
        alert('Delivery preference updated!');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Failed to update delivery preference:', error);
      alert(error.response?.data?.message || 'Failed to update preference. Please try again.');
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  // Data Extraction based on Order Type
  const orderItems = order.items || [];
  const serviceTitle = isBulk ? `${order.organizationName} - ${order.serviceType}` : formatOrderItemsTitle(orderItems, {
    fallback: 'Custom Garment Order'
  });
  const imageUrl = isBulk ? order.referenceImages?.[0] || '/logo.png' : getImageUrl(getItemImage(orderItems[0])) || '/logo.png';

  // Arrival Date Calculation
  const getArrivalDate = () => {
    if (isBulk && order.expectedDeliveryDate) {
      return new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    const baseDate = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
    const firstItem = orderItems[0];
    const deliveryType = firstItem?.deliveryType || 'standard';
    const deliveryDays = deliveryType === 'express' ? 10 : deliveryType === 'premium' ? 7 : 15;
    baseDate.setDate(baseDate.getDate() + deliveryDays);
    return baseDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const dateString = getArrivalDate();
  const createdDateString = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const createdTimeString = new Date(order.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const isReadyMade = order?.items?.some(item => item.product);
  const isAlteration = order?.items?.some(item => item.isAlteration) || order?.isAlteration;

  // Timeline Stages Definition
  const stages = isBulk ? [{
    key: 'pending',
    label: 'Order Received',
    desc: "We've received your order",
    icon: Package
  }, {
    key: 'accepted',
    label: 'Payment Confirmed',
    desc: "Security deposit paid",
    icon: ShieldCheck
  }, {
    key: 'accepted-by-tailor',
    label: 'Assigned',
    desc: "Assigned to master artisan",
    icon: User
  }, {
    key: 'in-production',
    label: 'Production',
    desc: "Bulk manufacturing in progress",
    icon: Scissors
  }, {
    key: 'shipped',
    label: 'Out for Delivery',
    desc: "Bulk order in transit",
    icon: Truck
  }, {
    key: 'delivered',
    label: 'Delivered',
    desc: "Order delivered successfully",
    icon: CheckCircle2
  }] : isAlteration ? [{
    key: 'pending',
    label: 'Order Received',
    desc: "We've received your order",
    icon: Package
  }, ...(order.fabricDeliveryPreference === 'self' ? [{
    key: 'waiting-for-customer-dropoff',
    label: 'Waiting For Drop-off',
    desc: 'Awaiting drop-off at shop',
    icon: Store
  }] : []), {
    key: 'fabric-received',
    label: 'Garment Received',
    desc: 'Garment received and quality checked',
    icon: Layers
  }, {
    key: 'in-progress',
    label: 'Alteration Started',
    desc: 'Artisan altering your garment',
    icon: Scissors
  }, {
    key: 'quality-check',
    label: 'Completed',
    desc: 'Alteration completed & inspected',
    icon: Box
  }, {
    key: 'ready-for-delivery',
    label: 'Ready for Delivery',
    desc: 'Order is ready to be delivered',
    icon: ShoppingBag
  }, {
    key: 'out-for-delivery',
    label: 'Out for Delivery',
    desc: 'Your order is out for delivery',
    icon: Truck
  }, {
    key: 'delivered',
    label: 'Delivered',
    desc: 'Your order has been delivered',
    icon: CheckCircle2
  }] : isReadyMade ? [{
    key: 'pending',
    label: 'Order Received',
    desc: "We've received your order",
    icon: Package
  }, {
    key: 'in-progress',
    label: 'Processing & Packing',
    desc: 'Item being packed',
    icon: Box
  }, {
    key: 'ready-for-delivery',
    label: 'Ready for Delivery',
    desc: 'Packed & ready for dispatch',
    icon: ShoppingBag
  }, {
    key: 'out-for-delivery',
    label: 'Out for Delivery',
    desc: 'Your order is out for delivery',
    icon: Truck
  }, {
    key: 'delivered',
    label: 'Delivered',
    desc: 'Your order has been delivered',
    icon: CheckCircle2
  }] : [{
    key: 'pending',
    label: 'Order Received',
    desc: "We've received your order",
    icon: Package
  }, ...(order.fabricDeliveryPreference === 'self' ? [{
    key: 'waiting-for-customer-dropoff',
    label: 'Waiting For Drop-off',
    desc: 'Awaiting drop-off at shop',
    icon: Store
  }] : []), {
    key: 'fabric-received',
    label: 'Fabric Received',
    desc: 'Fabric received and quality checked',
    icon: Layers
  }, {
    key: 'cutting',
    label: 'Cutting',
    desc: 'Your fabric is being cut',
    icon: Scissors
  }, {
    key: 'stitching',
    label: 'Stitching',
    desc: 'Stitching in progress',
    icon: Shirt
  }, {
    key: 'quality-check',
    label: 'Completed',
    desc: 'Stitching completed',
    icon: Box
  }, {
    key: 'ready-for-delivery',
    label: 'Ready for Delivery',
    desc: 'Order is ready to be delivered',
    icon: ShoppingBag
  }, {
    key: 'out-for-delivery',
    label: 'Out for Delivery',
    desc: 'Your order is out for delivery',
    icon: Truck
  }, {
    key: 'delivered',
    label: 'Delivered',
    desc: 'Your order has been delivered',
    icon: CheckCircle2
  }];
  const getStageStatus = stageKey => {
    const history = isBulk ? order.history || [] : order.trackingHistory || [];
    const status = (order.status || '').toLowerCase();
    if (stageKey === 'pending') return {
      completed: true,
      time: createdTimeString
    };
    if (isBulk) {
      const entry = history.find(h => h.status === stageKey);
      const statusOrder = ['pending', 'reviewing', 'quoted', 'accepted', 'accepted-by-tailor', 'in-production', 'shipped', 'delivered', 'completed'];
      const currentIndex = statusOrder.indexOf(status);
      const stageIndex = statusOrder.indexOf(stageKey);
      const isCompleted = !!entry || currentIndex >= stageIndex && stageIndex !== -1;
      return {
        completed: isCompleted,
        time: entry ? new Date(entry.timestamp || entry.updatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }) : null
      };
    }
    const statusOrder = ['pending', 'accepted', 'pickup-assigned', 'fabric-ready-for-pickup', 'fabric-picked-up', 'fabric-delivered', 'order-received', 'waiting-for-customer-dropoff', 'fabric-received', 'fabric-selected', 'measurement-verification', 'pattern-making', 'in-progress', 'cutting', 'stitching', 'finishing', 'quality-check', 'ready-for-pickup', 'ready-for-delivery', 'delivery-assigned', 'out-for-delivery', 'delivered', 'product-delivered', 'order-completed'];
    let equivalentStageKey = stageKey;
    if (stageKey === 'shipped') equivalentStageKey = 'out-for-delivery';
    const currentIndex = statusOrder.indexOf(status);
    const stageIndex = statusOrder.indexOf(equivalentStageKey);
    const isCompleted = currentIndex >= stageIndex && stageIndex !== -1;
    let historyEntry = history.find(h => {
      if (stageKey === 'fabric-received') return ['fabric-delivered', 'fabric-received', 'delivery-fabric-delivered'].includes(h.status);
      if (stageKey === 'ready-for-delivery') return ['ready-for-pickup', 'ready-for-delivery'].includes(h.status);
      if (stageKey === 'out-for-delivery') return ['out-for-delivery', 'shipped'].includes(h.status);
      if (stageKey === 'quality-check') return ['finishing', 'quality-check'].includes(h.status);
      return h.status === stageKey;
    });
    const timeStr = historyEntry ? new Date(historyEntry.timestamp || historyEntry.updatedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) : isCompleted ? new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) : null;
    return {
      completed: isCompleted,
      time: timeStr
    };
  };
  const getStageSubEvents = stageKey => {
    const history = isBulk ? order.history || [] : order.trackingHistory || [];
    if (history.length === 0) return [];
    let validStatuses = [];
    let timeConstraint = null;
    if (stageKey === 'fabric-received') {
      validStatuses = ['pickup-assigned', 'fabric-ready-for-pickup', 'delivery-accepted', 'delivery-reached-pickup', 'delivery-fabric-picked-up', 'reached-pickup', 'fabric-picked-up', 'fabric-delivered', 'delivery-fabric-delivered'];
      timeConstraint = 'before-cutting';
    } else if (stageKey === 'out-for-delivery') {
      validStatuses = ['delivery-accepted', 'delivery-reached-pickup', 'delivery-picked-up-from-tailor', 'delivery-reached-dropoff', 'delivery-delivered', 'out-for-delivery', 'shipped'];
      timeConstraint = 'after-ready';
    }
    if (validStatuses.length === 0) return [];
    const readyForPickupTime = history.find(h => h.status === 'ready-for-pickup')?.timestamp;
    const cuttingTime = history.find(h => h.status === 'cutting' || h.status === 'fabric-delivered')?.timestamp;
    let events = history.filter(h => validStatuses.includes(h.status));
    if (timeConstraint === 'before-cutting' && cuttingTime) {
      events = events.filter(e => new Date(e.timestamp) <= new Date(cuttingTime));
    } else if (timeConstraint === 'after-ready' && readyForPickupTime) {
      events = events.filter(e => new Date(e.timestamp) >= new Date(readyForPickupTime));
    }
    return events.map(e => ({
      message: e.message || `Delivery status updated to ${e.status.replace(/-/g, ' ')}`,
      time: new Date(e.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      rawTime: new Date(e.timestamp).getTime()
    })).sort((a, b) => a.rawTime - b.rawTime);
  };
  const timelineStates = stages.map(s => ({
    ...s,
    ...getStageStatus(s.key),
    subEvents: getStageSubEvents(s.key)
  }));
  const currentStageIndex = [...timelineStates].reverse().findIndex(s => s.completed);
  const actualCurrentIndex = currentStageIndex === -1 ? 0 : timelineStates.length - 1 - currentStageIndex;
  const getCurrentStatusMessage = () => {
    if (order.status === 'accepted' && order.paymentStatus === 'pending') {
      return "Tailor accepted the order. Pay to confirm.";
    }
    const history = isBulk ? order.history || [] : order.trackingHistory || [];
    const latestHistory = history[history.length - 1];
    if (latestHistory?.message) return latestHistory.message;
    if (order.status === 'delivered') return `Your order has been delivered successfully. Thank you for trusting ${appName}!`;
    if (isBulk && order.status === 'accepted') return "Security deposit received. Awaiting production start.";
    return "Your order is progressing smoothly through our production line.";
  };

  // Loyalty points check
  const loyaltyCfg = settings?.loyaltyConfig || settings;
  const earnedPoints = Math.floor((order.totalAmount || 0) / 100) * (loyaltyCfg?.pointsPer100Spent || 1) + (loyaltyCfg?.flatPointsPerBooking || 0);

  // Active partner info
  const tailorInfo = order.tailor || null;
  const partnerInfo = order.deliveryPartner || order.pickupPartner || order.dropoffPartner || null;

  // Delivery check for rating section
  const isFinalDelivered = ['delivered', 'product-delivered', 'completed', 'order-completed'].includes((order.status || '').toLowerCase());
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 font-sans text-gray-900">
            {/* Sticky Clean Header Bar */}
            <Box className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 shadow-xs">
                <Box className="max-w-xl mx-auto flex items-center justify-between gap-3">
                    <Box className="flex items-center gap-3">
                        <Btn onPress={() => navigate('/user/orders')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
                            <I icon={ArrowLeft} size={20} />
                        </Btn>
                        <Box>
                            <Txt className="text-sm font-bold text-gray-900 leading-tight">Track Order</Txt>
                            <Txt className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest mt-0.5">
                                {order.orderId}
                            </Txt>
                        </Box>
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Btn onPress={() => setIsHelpModalOpen(true)} className="h-8 px-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5 text-xs font-semibold transition-colors active:scale-95">
                            <I icon={Headphones} size={14} />
                            <Txt>Help</Txt>
                        </Btn>
                        <Btn onPress={() => navigate(`/user/orders/${id}/chat`)} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors relative">
                            <I icon={MoreVertical} size={18} />
                            {unreadChatCount > 0 && <Txt className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
                        </Btn>
                    </Box>
                </Box>
            </Box>
            <Scroll ref={scrollRef} className="flex-1" contentClassName="pb-16">

            {/* Main Content Area */}
            <Box className="max-w-xl mx-auto px-4 py-4 space-y-4">

                {/* OTP Banner Notifications */}
                {measurementOtp && <Box className="bg-white rounded-3xl p-4 border border-[#843D9B]/20 flex items-center justify-between shadow-sm">
                        <Box>
                            <Txt className="text-xs font-black text-[#843D9B] uppercase tracking-wider">Measurement Verification OTP</Txt>
                            <Txt className="text-[11px] text-gray-500 mt-0.5">Share code with measurement executive</Txt>
                        </Box>
                        <Box className="bg-[#843D9B]/10 px-4 py-2 rounded-2xl border border-[#843D9B]/20">
                            <Txt className="text-xl font-black tracking-widest text-[#843D9B]">{measurementOtp}</Txt>
                        </Box>
                    </Box>}

                {order.pickupDeliveryOtp && order.pickupOtpVerified === false && <Box className="bg-white rounded-3xl p-4 border border-[#843D9B]/20 flex items-center justify-between shadow-sm">
                        <Box>
                            <Txt className="text-xs font-black text-[#843D9B] uppercase tracking-wider">Fabric Pickup OTP</Txt>
                            <Txt className="text-[11px] text-gray-500 mt-0.5">Share with partner to hand over fabric</Txt>
                        </Box>
                        <Box className="bg-[#843D9B]/10 px-4 py-2 rounded-2xl border border-[#843D9B]/20">
                            <Txt className="text-xl font-black tracking-widest text-[#843D9B]">{order.pickupDeliveryOtp}</Txt>
                        </Box>
                    </Box>}

                {order.dropoffDeliveryOtp && order.dropoffOtpVerified === false && ['ready-for-delivery', 'out-for-delivery', 'delivered', 'ready'].includes(order.status) && <Box className="bg-white rounded-3xl p-4 border border-emerald-100 flex items-center justify-between shadow-sm">
                        <Box>
                            <Txt className="text-xs font-black text-emerald-700 uppercase tracking-wider">Order Delivery OTP</Txt>
                            <Txt className="text-[11px] text-gray-500 mt-0.5">Share with partner to receive order</Txt>
                        </Box>
                        <Box className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                            <Txt className="text-xl font-black tracking-widest text-emerald-700">{order.dropoffDeliveryOtp}</Txt>
                        </Box>
                    </Box>}

                {/* 1. Top Order Summary Card */}
                <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                    <Box className="flex items-center gap-3.5 min-w-0 flex-1">
                        <Box className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            <Img src={imageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                        </Box>
                        <Box className="min-w-0 flex-1">
                            <Txt className="text-sm font-black text-gray-900 truncate leading-tight">{serviceTitle}</Txt>
                            {orderItems.length > 1 && <Txt className="text-[10px] text-gray-400 font-bold mt-0.5">
                                    {orderItems.length} garments in this order
                                </Txt>}
                            
                            <Box className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-[11px] uppercase tracking-wide mt-1">
                                <I icon={CheckCircle2} size={13} className="shrink-0 fill-emerald-600 text-white" />
                                <Txt className="truncate">{order.status === 'delivered' ? 'DELIVERED SUCCESSFULLY' : order.status.replace(/-/g, ' ').toUpperCase()}</Txt>
                            </Box>

                            <Box className="flex items-center gap-1.5 text-gray-400 font-semibold text-[10px] mt-1">
                                <I icon={Calendar} size={12} className="shrink-0" />
                                <Txt>
                                    {order.status === 'delivered' ? `Delivered on ${dateString}` : `Expected by ${dateString}`}
                                </Txt>
                            </Box>
                        </Box>
                    </Box>

                    <Btn onPress={() => {
          setShowOrderDetailsSection(true);
          setTimeout(() => scrollToSection('order-details-section'), 50);
        }} className="px-3.5 py-1.5 rounded-xl border border-[#843D9B] text-[#843D9B] text-xs font-bold hover:bg-[#843D9B]/5 transition-colors shrink-0 whitespace-nowrap">
                        View Details &gt;
                    </Btn>
                </Box>

                {/* 2. Rewards Section (Conditional) */}
                {settings && earnedPoints > 0 && <Box className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                        <Box className="flex items-center gap-3">
                            <Box className="w-10 h-10 rounded-2xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center shrink-0">
                                <I icon={Star} size={20} className="fill-[#843D9B]" />
                            </Box>
                            <Box>
                                <Txt className="text-xs font-black text-gray-900 leading-tight">Rewards Earned</Txt>
                                <Txt className="text-[10px] font-medium text-gray-500 mt-0.5">Points added to your wallet</Txt>
                            </Box>
                        </Box>
                        <Box className="flex items-center gap-1 text-[#843D9B] font-black text-sm shrink-0">
                            <Txt>+{earnedPoints} pts</Txt>
                            <I icon={ChevronRight} size={16} />
                        </Box>
                    </Box>}

                {/* 3. Live Tracking Section */}
                <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-4">
                    {/* Section Header */}
                    <Box className="flex items-center justify-between">
                        <Box className="flex items-center gap-2">
                            <Box className="w-7 h-7 rounded-xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                <I icon={Radio} size={16} />
                            </Box>
                            <Txt className="text-sm font-black text-gray-900">Live Tracking</Txt>
                        </Box>
                        <Txt className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <Txt className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time
                        </Txt>
                    </Box>

                    {/* App Theme Current Status Banner */}
                    <Box className="bg-gradient-to-r from-[#843D9B] via-[#74338a] to-[#5e2572] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
                        <Box className="relative z-10 max-w-[75%]">
                            <Txt className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60 mb-1">
                                CURRENT STATUS
                            </Txt>
                            <Box className="flex items-center gap-2 mb-2">
                                <Txt className="text-xl sm:text-2xl font-black tracking-tight capitalize leading-none text-white">
                                    {order.status === 'delivered' ? 'Delivered' : order.status.replace(/-/g, ' ')}
                                </Txt>
                                <Box className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                                    <I icon={CheckCircle2} size={14} strokeWidth={3} />
                                </Box>
                            </Box>
                            <Txt className="text-[11px] text-white/80 font-medium leading-relaxed">
                                {getCurrentStatusMessage()}
                            </Txt>
                        </Box>

                        {/* Gift Box Graphic */}
                        <Box className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                            <Box className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
                                <I icon={Gift} size={38} className="text-white drop-shadow-md" />
                                <Box className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                                    <I icon={CheckCircle2} size={16} strokeWidth={3} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Vertical Timeline */}
                    <TrackingTimeline states={timelineStates} currentIndex={actualCurrentIndex} />
                </Box>

                {/* Measurement Verification Card */}
                {['measurements-uploaded', 'measurement-verification'].includes(order.status) && measurementReport && <Box className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col items-center space-y-4">
                        <Box className="bg-[#843D9B]/10 p-3 rounded-full text-[#843D9B]">
                            <I icon={Scissors} size={24} />
                        </Box>
                        <Box className="text-center">
                            <Txt className="text-sm font-bold text-gray-900">Review Measurements</Txt>
                            <Txt className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                                The measurement executive has submitted your measurements. Please review and approve them to start production.
                            </Txt>
                        </Box>
                        
                        <Box className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <Txt className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3">Recorded Metrics</Txt>
                            <Box className="grid grid-cols-2 gap-2">
                                {Object.entries(measurementReport.measurements || {}).map(([key, val]) => <Box key={key} className="bg-white rounded-xl p-2 border border-gray-100 shadow-sm">
                                        <Txt className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                                        </Txt>
                                        <Txt className="text-sm font-black text-gray-900">{String(val)}"</Txt>
                                    </Box>)}
                            </Box>
                        </Box>

                        <Box className="flex flex-col w-full gap-3 mt-2">
                            <Btn onPress={() => handleMeasurementAction('approve')} className="w-full py-3 rounded-xl font-bold text-white bg-[#843D9B] text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                                <I icon={CheckCircle2} size={16} /> Approve & Start Production
                            </Btn>
                            
                            <Btn onPress={() => handleMeasurementAction('reject')} className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 text-sm transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2">
                                Request Changes
                            </Btn>
                        </Box>
                    </Box>}

                {/* Delivery Preference Selection Card */}
                {(order.fabricPickupRequired && order.advancePaymentStatus === 'paid' || order.status === 'measurements-approved') && order.fabricDeliveryPreference === 'pending' && !['measurement-requested', 'measurement-assigned', 'measurement-accepted', 'measurement-otp-verified', 'measurements-uploaded', 'measurement-verification'].includes(order.status) && <Box className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <Box className="bg-amber-50 p-3 rounded-full text-amber-600">
                            <I icon={Package} size={24} />
                        </Box>
                        <Box>
                            <Txt className="text-sm font-bold text-gray-900">How will the fabric reach the tailor?</Txt>
                            <Txt className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                                Please select your preference for delivering the fabric to the tailor.
                            </Txt>
                        </Box>
                        
                        <Box className="flex flex-col w-full gap-3 mt-2">
                            <Btn onPress={() => handleDeliveryPreference('self')} disabled={isUpdatingPreference} className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 text-sm transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2">
                                {isUpdatingPreference ? <Spin size={16} className="animate-spin" /> : 'I will drop it off myself (Self Delivery)'}
                            </Btn>
                            
                            <Btn onPress={() => handleDeliveryPreference('partner')} disabled={isUpdatingPreference} className="w-full py-3 rounded-xl font-bold text-white bg-[#843D9B] text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                                {isUpdatingPreference ? <Spin size={16} className="animate-spin" /> : 'Assign a Delivery Partner'}
                            </Btn>
                        </Box>
                    </Box>}

                {/* Waiting for Tailor Acceptance Card */}
                {order.status === 'pending' && <Box className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm flex flex-col items-center text-center space-y-3 animate-in fade-in duration-300">
                        <Box className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 relative">
                            <I icon={Scissors} size={24} className="animate-pulse" />
                            <Txt className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping opacity-30"></Txt>
                        </Box>
                        <Box>
                            <Txt className="text-base font-black text-gray-900">Waiting for tailor to accept order...</Txt>
                            <Txt className="text-xs text-gray-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                                Your order has been sent to the tailor. Once the tailor reviews and accepts your request, you can proceed with the advance payment.
                            </Txt>
                        </Box>
                        <Box className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 mt-1">
                            <Spin size={12} className="animate-spin" /> Awaiting Tailor Confirmation
                        </Box>
                    </Box>}

                {/* Advance & Remaining Payment Action Cards (Only shown AFTER Tailor Accepts & Advance Payment is Pending) */}
                {(order.acceptedAt || ['accepted', 'measurement-requested', 'measurement-assigned'].includes(order.status)) && order.advancePaymentStatus === 'pending' && (order.advancePaymentAmount > 0 || order.totalAmount > 0) && <Box className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex flex-col items-center text-center space-y-3">
                        <Txt className="text-sm font-bold text-gray-900">Advance Payment Required</Txt>
                        <Txt className="text-xs text-gray-600 max-w-xs">
                            Tailor has accepted your order! Please pay the advance amount of ₹{order.advancePaymentAmount || Math.round((order.totalAmount || 0) * 0.3)} to confirm your booking and dispatch the measurement executive.
                        </Txt>
                        <Btn onPress={() => handlePayment('advance')} disabled={isProcessingPayment} className="w-full max-w-xs py-3 rounded-full font-bold text-white text-sm bg-[#843D9B] hover:bg-[#723287] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                            {isProcessingPayment ? <Spin size={18} className="animate-spin" /> : `Pay ₹${order.advancePaymentAmount || Math.round((order.totalAmount || 0) * 0.3)}`}
                        </Btn>
                    </Box>}

                {/* Measurement Executive Status Cards (Tailor At Home Flow) */}
                {(() => {
        const mReq = order.measurementRequestInfo;
        const isAccepted = mReq && ['accepted', 'otp_sent', 'otp_verified', 'measurements_uploaded'].includes(mReq.status);
        const execUser = order.measurementExecutive || mReq?.executive;
        if (order.isMeasurementHome && order.advancePaymentStatus === 'paid' && !isAccepted && !['completed', 'cancelled', 'measurements-uploaded', 'measurements-approved'].includes(order.status)) {
          return <Box className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col items-center text-center space-y-3 animate-in fade-in duration-300">
                                <Box className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-[#843D9B] relative">
                                    <I icon={Ruler} size={24} className="animate-pulse" />
                                    <Txt className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-30"></Txt>
                                </Box>
                                <Box>
                                    <Txt className="text-base font-black text-gray-900">Waiting for executive to accept visit...</Txt>
                                    <Txt className="text-xs text-gray-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                                        Your advance payment is verified! We are requesting the nearest measurement executive to accept your home visit.
                                    </Txt>
                                </Box>
                                {(order.scheduledDate || order.scheduledTimeSlot) && <Box className="flex items-center gap-2 p-2.5 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs font-semibold text-gray-800">
                                        <I icon={Calendar} size={14} className="text-[#843D9B] shrink-0" />
                                        <Txt>
                                            Visit Scheduled: <Txt className="text-[#843D9B] font-bold">{order.scheduledDate || 'Today'}</Txt>
                                            {order.scheduledTimeSlot && order.scheduledTimeSlot !== 'ASAP' && ` at `}
                                            {order.scheduledTimeSlot && order.scheduledTimeSlot !== 'ASAP' && <Txt className="text-[#843D9B] font-bold">{order.scheduledTimeSlot}</Txt>}
                                            {order.scheduledTimeSlot === 'ASAP' && <Txt className="text-[#843D9B] font-bold"> (ASAP)</Txt>}
                                        </Txt>
                                    </Box>}
                                <Box className="flex items-center gap-2 text-[10px] font-black uppercase text-[#843D9B] tracking-widest bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 mt-1">
                                    <Spin size={12} className="animate-spin" /> Waiting for Executive Acceptance
                                </Box>
                            </Box>;
        }
        if (order.isMeasurementHome && isAccepted && execUser && !['completed', 'cancelled'].includes(order.status)) {
          return <LiveMeasurementTracker order={order} socket={socketInstance} />;
        }
        return null;
      })()}

                {order.status === 'ready-for-delivery' && order.remainingPaymentStatus === 'pending' && order.remainingPaymentAmount > 0 && <Box className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col items-center text-center space-y-3">
                        <Txt className="text-sm font-bold text-gray-900">Final Balance Payment</Txt>
                        <Txt className="text-xs text-gray-600 max-w-xs">
                            Your order is ready! Pay the remaining balance of ₹{order.remainingPaymentAmount}.
                        </Txt>
                        <Btn onPress={() => handlePayment('remaining')} disabled={isProcessingPayment} className="w-full max-w-xs py-3 rounded-full font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                            {isProcessingPayment ? <Spin size={18} className="animate-spin" /> : `Pay Online ₹${order.remainingPaymentAmount}`}
                        </Btn>
                    </Box>}

                {/* Live Delivery Tracker Widget */}
                {(() => {
        const hasActivePickupPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus);
        const hasActiveDropoffPartner = ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.dropoffDeliveryStatus);
        const isInvalidSearchState = ['pending', 'reviewing', 'quoted', 'cancelled'].includes(order.status);
        const isSearchingPickup = !isInvalidSearchState && (order.pickupDeliveryStatus === 'pending' || order.pickupDeliveryStatus === 'searching') && (['pickup-assigned', 'fabric-ready-for-pickup'].includes(order.status) || order.status === 'accepted' && (order.advancePaymentStatus === 'paid' || !order.advancePaymentAmount)) && order.fabricDeliveryPreference === 'partner';
        const isSearchingDropoff = !isInvalidSearchState && (order.dropoffDeliveryStatus === 'pending' || order.dropoffDeliveryStatus === 'searching') && ['ready-for-delivery', 'ready-for-pickup', 'delivery-assigned'].includes(order.status) && order.deliveryMethod !== 'self' && order.deliveryMethod !== 'tailor';
        const shouldShowForPickup = hasActivePickupPartner || isSearchingPickup;
        const shouldShowForDropoff = hasActiveDropoffPartner || isSearchingDropoff;
        const isTailorSelfDelivery = order.status === 'out-for-delivery' && order.deliveryMethod === 'tailor';
        if (shouldShowForPickup || shouldShowForDropoff || isTailorSelfDelivery) {
          return <LiveDeliveryTracker order={order} socket={socketInstance} forceSearching={(isSearchingPickup || isSearchingDropoff) && !isTailorSelfDelivery} />;
        }
        return null;
      })()}

                {/* Contact Actions Bar (Always accessible) */}
                <Box className="grid grid-cols-2 gap-3">
                    {tailorInfo && <Btn onPress={() => Linking.openURL(`tel:${tailorInfo.phoneNumber || ''}`)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all no-underline">
                            <I icon={Phone} size={14} className="text-[#843D9B]" />
                            <Txt>Call Provider</Txt>
                        </Btn>}
                    {tailorInfo && <Btn onPress={() => navigate(`/user/orders/${id}/chat`)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all">
                            <I icon={MessageSquare} size={14} className="text-emerald-600" />
                            <Txt>Chat Provider</Txt>
                        </Btn>}
                </Box>

                {/* 4. Order Details Card */}
                {showOrderDetailsSection && <Box onLayout={onSectionLayout('order-details-section')} className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-4">
                        <Box className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <I icon={ShoppingBag} size={18} className="text-[#843D9B]" />
                            <Txt className="text-sm font-black text-gray-900">Order Details</Txt>
                        </Box>

                        {/* Items Breakdown */}
                        <Box className="space-y-4">
                            {!isBulk && orderItems.length > 0 ? <Box className="space-y-3">
                                    {orderItems.map((item, idx) => {
              const itemImg = getImageUrl(getItemImage(item)) || '/logo.png';
              const label = getItemLabel(item);
              const linePrice = Number(item.price) || 0;
              const selectedStyle = item.selectedStyle || item.configuration?.selectedStyle;
              return <Box key={item._id || idx} className="bg-gray-50/50 rounded-2xl p-3.5 border border-gray-100 space-y-3">
                                                <Box className="flex items-center justify-between gap-3">
                                                    <Box className="flex items-center gap-3 min-w-0">
                                                        <Box className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-2xs">
                                                            <Img src={itemImg} alt={label} className="w-full h-full object-cover" />
                                                        </Box>
                                                        <Box className="min-w-0">
                                                            <Txt className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                                                                {orderItems.length > 1 ? `${idx + 1}. ` : ''}{label}
                                                            </Txt>
                                                            <Txt className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                                {item.fabricSource === 'platform' ? 'Platform Fabric' : 'Customer Fabric'}
                                                            </Txt>
                                                            <Box className="flex gap-1.5 mt-1.5 flex-wrap">
                                                                <Txt className="text-[9px] font-black uppercase bg-white text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                                                                    Size: {item.measurements?.type === 'slip' ? 'Slip' : 'Custom'}
                                                                </Txt>
                                                                <Txt className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${item.deliveryType === 'express' ? 'bg-red-50 text-[#843D9B] border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                    {item.deliveryType || 'Standard'}
                                                                </Txt>
                                                                <Txt className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200/60">
                                                                    Qty: {item.quantity || 1}
                                                                </Txt>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    {linePrice > 0 && <Txt className="text-sm font-black text-gray-900 shrink-0 self-start mt-0.5">
                                                            ₹{linePrice.toLocaleString('en-IN')}
                                                        </Txt>}
                                                </Box>

                                                {/* Selected Custom Reference Photo or Style Variant */}
                                                {selectedStyle && <Box className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 space-y-2">
                                                        <Box className="flex items-center justify-between">
                                                            <Txt className="text-[10px] font-black uppercase text-[#843D9B] tracking-wider flex items-center gap-1.5">
                                                                <I icon={Scissors} size={12} /> {selectedStyle.isCustom ? '📸 Custom Reference Design Photo' : '✂️ Selected Style Variant'}
                                                            </Txt>
                                                            <Txt className="text-[8px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                                                {selectedStyle.isCustom ? 'Custom Upload' : 'Variant'}
                                                            </Txt>
                                                        </Box>
                                                        <Txt className="text-xs font-black text-gray-900">{selectedStyle.name || 'Custom Design'}</Txt>
                                                        {selectedStyle.image && <Box className="relative group max-w-full overflow-hidden rounded-xl border border-purple-200 shadow-xs bg-white mt-1">
                                                                <Img src={selectedStyle.image} alt="Style Reference" className="w-full max-h-48 object-contain cursor-pointer transition-transform duration-300 hover:scale-105" onPress={() => Linking.openURL(selectedStyle.image)} />
                                                                <Box className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                                                                    Click to expand 🔍
                                                                </Box>
                                                            </Box>}
                                                        {selectedStyle.description && <Txt className="text-[10px] text-gray-600 font-medium italic">"{selectedStyle.description}"</Txt>}
                                                    </Box>}
                                            </Box>;
            })}
                                </Box> : <Box className="flex items-center justify-between gap-3">
                                    <Box className="flex items-center gap-3 min-w-0">
                                        <Box className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                            <Img src={imageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                                        </Box>
                                        <Box className="min-w-0">
                                            <Txt className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">{serviceTitle}</Txt>
                                        </Box>
                                    </Box>
                                </Box>}

                            {/* ✨ Style Add-ons (Dedicated Section) */}
                            {!isBulk && orderItems.some(item => getNormalizedAddons(item).length > 0) && <Box className="bg-purple-50/40 rounded-2xl p-4 border border-purple-100 space-y-3">
                                    <Box className="flex items-center justify-between">
                                        <Box className="flex items-center gap-2">
                                            <Box className="w-7 h-7 rounded-lg bg-purple-100 text-[#843D9B] flex items-center justify-center">
                                                <I icon={Sparkles} size={14} />
                                            </Box>
                                            <Box>
                                                <Txt className="text-xs sm:text-sm font-black text-gray-900 leading-tight">Style Add-ons</Txt>
                                                <Txt className="text-[10px] text-gray-400 font-medium leading-tight">Added styling options for your outfit</Txt>
                                            </Box>
                                        </Box>
                                        <Txt className="text-[9px] font-black uppercase bg-purple-100/80 text-[#843D9B] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200/50">
                                            Extra Add-ons <I icon={ChevronRight} size={10} />
                                        </Txt>
                                    </Box>

                                    <Box className="space-y-2">
                                        {orderItems.flatMap((item, itemIdx) => getNormalizedAddons(item).map((addon, aIdx) => <Box key={`addon-${itemIdx}-${addon._id || aIdx}`} className="bg-white rounded-xl p-3 border border-purple-100/80 flex items-center justify-between gap-3 shadow-2xs">
                                                    {/* Left Thumbnail */}
                                                    <Box className="relative shrink-0">
                                                        {addon.image ? <Img src={addon.image} alt={addon.name} className="w-12 h-12 rounded-xl object-cover border border-purple-100 bg-white cursor-pointer shadow-2xs hover:opacity-95" onPress={() => Linking.openURL(addon.image)} /> : <Box className="w-12 h-12 rounded-xl bg-purple-100/80 text-[#843D9B] flex items-center justify-center text-lg font-black">
                                                                ✨
                                                            </Box>}
                                                        <Box className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#843D9B] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                                                            +
                                                        </Box>
                                                    </Box>

                                                    {/* Middle Details */}
                                                    <Box className="flex-1 min-w-0">
                                                        <Box className="flex items-center gap-1.5 mb-0.5">
                                                            <Txt className="text-[8px] font-black uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">
                                                                ★ {addon.category || 'Premium'}
                                                            </Txt>
                                                            {orderItems.length > 1 && <Txt className="text-[8px] font-bold text-gray-400">
                                                                    (Item {itemIdx + 1})
                                                                </Txt>}
                                                        </Box>
                                                        <Txt className="text-xs font-black text-gray-900 leading-tight truncate">{addon.name}</Txt>
                                                        {addon.description && <Txt className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">{addon.description}</Txt>}
                                                    </Box>

                                                    {/* Right Price */}
                                                    <Box className="shrink-0 text-right">
                                                        <Txt className="text-xs font-black text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-full">
                                                            +₹{Number(addon.price || 0).toLocaleString('en-IN')}
                                                        </Txt>
                                                    </Box>
                                                </Box>))}
                                    </Box>
                                </Box>}

                            {/* ✂️ Garment Customizations (Dedicated Section) */}
                            {!isBulk && orderItems.some(item => getNormalizedCustomizations(item).length > 0) && <Box className="bg-purple-50/40 rounded-2xl p-4 border border-purple-100 space-y-3">
                                    <Box className="flex items-center justify-between">
                                        <Box className="flex items-center gap-2">
                                            <Box className="w-7 h-7 rounded-lg bg-purple-100 text-[#843D9B] flex items-center justify-center">
                                                <I icon={Scissors} size={14} />
                                            </Box>
                                            <Box>
                                                <Txt className="text-xs sm:text-sm font-black text-gray-900 leading-tight">Garment Customizations</Txt>
                                                <Txt className="text-[10px] text-gray-400 font-medium leading-tight">Tailored design selections</Txt>
                                            </Box>
                                        </Box>
                                        <Txt className="text-[9px] font-black uppercase bg-purple-100/80 text-[#843D9B] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200/50">
                                            Tailor Specs <I icon={ChevronRight} size={10} />
                                        </Txt>
                                    </Box>

                                    <Box className="space-y-2">
                                        {orderItems.flatMap((item, itemIdx) => getNormalizedCustomizations(item).map(cust => <Box key={`cust-${itemIdx}-${cust.key}`} className="bg-white rounded-xl p-3 border border-purple-100/80 flex items-center justify-between gap-3 shadow-2xs">
                                                    {/* Left Image */}
                                                    <Box className="relative shrink-0">
                                                        {cust.refImage ? <Img src={cust.refImage} alt={cust.name} className="w-12 h-12 rounded-xl object-cover border border-purple-100 bg-white cursor-pointer shadow-2xs hover:opacity-95" onPress={() => Linking.openURL(cust.refImage)} /> : <Box className="w-12 h-12 rounded-xl bg-purple-100/80 text-[#843D9B] flex items-center justify-center text-lg font-black">
                                                                ✂️
                                                            </Box>}
                                                        <Box className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#843D9B] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                                                            +
                                                        </Box>
                                                    </Box>

                                                    {/* Middle Details */}
                                                    <Box className="flex-1 min-w-0">
                                                        <Box className="flex items-center gap-1.5 mb-0.5">
                                                            <Txt className="text-[8px] font-black uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">
                                                                {cust.label || 'CUSTOM FIT'}
                                                            </Txt>
                                                            {orderItems.length > 1 && <Txt className="text-[8px] font-bold text-gray-400">
                                                                    (Item {itemIdx + 1})
                                                                </Txt>}
                                                        </Box>
                                                        <Txt className="text-xs font-black text-gray-900 leading-tight truncate">{cust.name}</Txt>
                                                        {cust.description && <Txt className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">
                                                                {cust.description}
                                                            </Txt>}
                                                        {cust.notes && <Box className="mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200/60 rounded text-amber-900 text-[10px] font-medium flex items-start gap-1">
                                                                <Txt className="font-bold text-amber-700 shrink-0">📌 Note:</Txt>
                                                                <Txt className="break-words">{cust.notes}</Txt>
                                                            </Box>}
                                                    </Box>

                                                    {/* Right Price */}
                                                    <Box className="shrink-0 text-right">
                                                        <Txt className="text-xs font-black text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-full">
                                                            {cust.price > 0 ? `+₹${Number(cust.price).toLocaleString('en-IN')}` : 'Included'}
                                                        </Txt>
                                                    </Box>
                                                </Box>))}
                                    </Box>
                                </Box>}

                            <Box className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order total</Txt>
                                <Txt className="text-sm font-black text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN') || '0'}</Txt>
                            </Box>
                        </Box>

                        {/* Information Grid */}
                        <Box className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                            <Box className="flex justify-between items-center text-gray-600">
                                <Txt className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <I icon={Calendar} size={13} /> Booking Date
                                </Txt>
                                <Txt className="font-bold text-gray-900">{createdDateString}</Txt>
                            </Box>

                            <Box className="flex justify-between items-center text-gray-600">
                                <Txt className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <I icon={Truck} size={13} /> Expected Service Date
                                </Txt>
                                <Txt className="font-bold text-gray-900">{dateString}</Txt>
                            </Box>

                            <Box className="flex justify-between items-center text-gray-600">
                                <Txt className="flex items-center gap-1.5 text-gray-400 font-medium">
                                    <I icon={CreditCard} size={13} /> Payment Method
                                </Txt>
                                <Txt className="font-bold text-gray-900 uppercase">{order.paymentMethod || 'Online'}</Txt>
                            </Box>
                        </Box>

                        {/* Address */}
                        {order.deliveryAddress && <Box className="pt-3 border-t border-gray-100 space-y-1.5">
                                <Box className="flex items-center justify-between gap-2">
                                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <I icon={MapPin} size={12} className="text-[#843D9B]" /> ADDRESS
                                    </Txt>
                                    <Txt className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                        {orderHasTailorAtHome(orderItems) ? 'Tailor At Home' : 'Standard Delivery'}
                                    </Txt>
                                </Box>
                                <Txt className="text-xs text-gray-600 font-medium leading-relaxed pl-4">
                                    {!order.deliveryAddress.street && !order.deliveryAddress.city ? 'Address provided upon confirmation' : `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}`}
                                </Txt>
                            </Box>}

                        {/* Booking Notes */}
                        {order.specialInstructions && <Box className="pt-3 border-t border-gray-100 space-y-1">
                                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <I icon={FileText} size={12} /> Booking Notes
                                </Txt>
                                <Txt className="text-xs text-gray-600 italic pl-4">"{order.specialInstructions}"</Txt>
                            </Box>}

                        {/* Total Amount */}
                        <Box className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <Txt className="font-bold text-gray-700 text-xs">Total Amount</Txt>
                            <Txt className="font-black text-[#843D9B] text-base">₹{order.totalAmount?.toLocaleString('en-IN') || '0'}</Txt>
                        </Box>
                    </Box>}

                {/* 5. Rating Section (STRICTLY Render ONLY IF Order Delivered) */}
                {isFinalDelivered && (() => {
        const hasValidTailor = !!(tailorInfo && (tailorInfo._id || tailorInfo.name || tailorInfo.shopName));
        const hasValidPartner = !!(partnerInfo && (partnerInfo._id || partnerInfo.name));
        if (!hasValidTailor && !hasValidPartner) return null;
        return <Box className={`grid grid-cols-1 ${hasValidTailor && hasValidPartner ? 'md:grid-cols-2' : ''} gap-4`}>
                            {/* Service Provider Card */}
                            {hasValidTailor && <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                    <Box className="space-y-3">
                                        <Box className="flex items-center gap-2">
                                            <Box className="w-6 h-6 rounded-lg bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                                <I icon={Scissors} size={14} />
                                            </Box>
                                            <Txt className="text-xs font-black text-gray-900">Service Provider Rating</Txt>
                                        </Box>

                                        <Box className="flex items-center gap-3">
                                            <Box className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-[#843D9B] shrink-0">
                                                <Img src={tailorInfo.profileImage || '/logo.png'} alt={tailorInfo.shopName || 'Tailor Partner'} className="w-full h-full object-cover" />
                                            </Box>
                                            <Box className="min-w-0 flex-1">
                                                <Txt className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">
                                                    {tailorInfo.shopName || 'Tailor Partner'}
                                                </Txt>
                                                <Box className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-0.5">
                                                    <I icon={CheckCircle2} size={12} className="fill-emerald-600 text-white" />
                                                    <Txt>Verified Provider</Txt>
                                                </Box>
                                                <Box className="flex items-center gap-1 text-amber-500 text-[11px] font-black mt-1">
                                                    {[1, 2, 3, 4, 5].map(star => <I icon={Star} key={star} size={12} className="fill-amber-400 text-amber-400" />)}
                                                    <Txt className="text-gray-900 ml-1 text-xs">{tailorInfo.rating || '4.8'}</Txt>
                                                    {tailorInfo.totalRatings && <Txt className="text-gray-400 font-normal text-[10px]">({tailorInfo.totalRatings})</Txt>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Rating Action Button */}
                                    <Box className="pt-2">
                                        <Btn onPress={() => setIsReviewModalOpen(true)} className="w-full py-3 bg-[#843D9B] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#723287] transition-all active:scale-[0.98]">
                                            <I icon={Star} size={14} className="fill-white" />
                                            <Txt>Rate Provider</Txt>
                                        </Btn>
                                    </Box>
                                </Box>}

                            {/* Delivery Partner Rating Card */}
                            {hasValidPartner && <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                    <Box className="space-y-3">
                                        <Box className="flex items-center gap-2">
                                            <Box className="w-6 h-6 rounded-lg bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center">
                                                <I icon={Truck} size={14} />
                                            </Box>
                                            <Txt className="text-xs font-black text-gray-900">Delivery Partner Rating</Txt>
                                        </Box>

                                        <Box className="flex items-center gap-3">
                                            <Box className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-[#843D9B] shrink-0">
                                                <Img src={partnerInfo.profileImage || '/logo.png'} alt={partnerInfo.name} className="w-full h-full object-cover" />
                                            </Box>
                                            <Box className="min-w-0 flex-1">
                                                <Txt className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">
                                                    {partnerInfo.name}
                                                </Txt>
                                                <Box className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-0.5">
                                                    <I icon={CheckCircle2} size={12} className="fill-emerald-600 text-white" />
                                                    <Txt>Verified Partner</Txt>
                                                </Box>
                                                <Box className="flex items-center gap-1 text-amber-500 text-[11px] font-black mt-1">
                                                    {[1, 2, 3, 4, 5].map(star => <I icon={Star} key={star} size={12} className="fill-amber-400 text-amber-400" />)}
                                                    <Txt className="text-gray-900 ml-1 text-xs">{partnerInfo.rating || '4.8'}</Txt>
                                                    {partnerInfo.totalRatings && <Txt className="text-gray-400 font-normal text-[10px]">({partnerInfo.totalRatings})</Txt>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Rating Action Button */}
                                    <Box className="pt-2">
                                        <Btn onPress={() => setIsReviewModalOpen(true)} className="w-full py-3 bg-[#843D9B] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#723287] transition-all active:scale-[0.98]">
                                            <I icon={Star} size={14} className="fill-white" />
                                            <Txt>Rate Partner</Txt>
                                        </Btn>
                                    </Box>
                                </Box>}
                        </Box>;
      })()}

                {/* Report Issue / Rework Card (Visible after Delivery) */}
                {isFinalDelivered && <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-red-100 shadow-sm flex items-center justify-between gap-3">
                        <Box className="flex items-center gap-3 min-w-0">
                            <Box className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                <I icon={AlertCircle} size={20} />
                            </Box>
                            <Box className="min-w-0">
                                <Txt className="text-xs font-black text-gray-900 leading-tight truncate">Having fitting or quality issues?</Txt>
                                <Txt className="text-[10px] font-medium text-gray-500 mt-0.5 truncate">Report an issue for alteration & free rework</Txt>
                            </Box>
                        </Box>
                        <Btn onPress={() => {
          if (order.reportedIssue?._id || order.issueId) {
            navigate(`/user/issues/${order.reportedIssue?._id || order.issueId}`);
          } else {
            navigate(`/user/issues/report/${order._id}`);
          }
        }} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 whitespace-nowrap active:scale-95 flex items-center gap-1.5">
                            <I icon={AlertCircle} size={14} />
                            <Txt>{order.reportedIssue?._id || order.issueId ? 'View Issue' : 'Report Issue'}</Txt>
                        </Btn>
                    </Box>}

                {/* Thank You Banner after review */}
                {(order.isReviewed || isReviewed) && isFinalDelivered && <Box className="bg-[#843D9B]/10 rounded-2xl p-4 text-center border border-[#843D9B]/20 font-bold text-[#843D9B] text-xs">
                        <I icon={Check} size={16} className="inline-block mr-1 text-[#843D9B]" /> Thank you for rating your experience! 💚
                    </Box>}

                {/* Review Modal */}
                <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} orderId={order._id} tailorId={tailorInfo?._id || tailorInfo} deliveryPartnerId={partnerInfo?._id || partnerInfo} onSuccess={() => {
        setIsReviewed(true);
        fetchOrderDetails();
      }} />

                {/* Exchange Modal */}
                {isExchangeModalOpen && <ExchangeRequestModal isOpen={isExchangeModalOpen} onClose={() => setIsExchangeModalOpen(false)} order={order} onSuccess={() => fetchOrderDetails()} />}

                {/* Help & Support Modal */}
                <OrderHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} order={order} settings={settings} />
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default OrderTracking;
