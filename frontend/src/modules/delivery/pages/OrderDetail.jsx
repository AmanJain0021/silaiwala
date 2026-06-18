import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiClock,
  FiPackage,
  FiNavigation,
  FiCheckCircle,
  FiUser,
  FiCamera,
  FiShield,
  FiCreditCard,
  FiSend,
  FiX,
  FiMaximize,
  FiImage,
  FiPlus,
  FiZap,
  FiAlertTriangle,
  FiLoader,
} from 'react-icons/fi';
import CancellationModal from '../components/CancellationModal';
import TrackingMap from '../../../shared/components/TrackingMap';
import DeliveryBoyLiveMap from '../../../shared/components/DeliveryBoyLiveMap';
import PageTransition from '../../../shared/components/PageTransition';
import { formatPrice } from '../../../shared/utils/helpers';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { useDeliveryTracking } from '../../../shared/hooks/useDeliveryTracking';
import socketService from '../../../shared/utils/socket';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const DeliveryOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const { layoutLocationStr, layoutLocationCoords } = outletCtx || {};
  
  const { isLoaded: localIsLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      libraries: GOOGLE_MAPS_LIBRARIES
  });
  
  const isLoaded = outletCtx?.isLoaded !== undefined ? outletCtx.isLoaded : localIsLoaded;
  const {
    fetchOrderById,
    resendDeliveryOtp,
    isLoadingOrder,
    isUpdatingOrderStatus,
    updateOrderStatus,
    markArrivedAtCustomer,
    submitTryAndBuy,
    setPaymentMethod,
    completeDeliveryFlow,
    cancelOrder,
    rejectOrder,
    deliveryBoy,
  } = useDeliveryAuthStore();
  
  const [order, setOrder] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [otpValue, setOtpValue] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [pickupPhoto, setPickupPhoto] = useState(null);
  const [eta, setEta] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [paymentSelection, setPaymentSelection] = useState(null);
  
  // Use layout location as the initial fallback for faster rendering
  const [currentLocation, setCurrentLocation] = useState(layoutLocationCoords || null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState(layoutLocationStr || 'Current GPS Location');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [totalTripDistanceKm, setTotalTripDistanceKm] = useState(null);
  const [feeSettings, setFeeSettings] = useState(null);

  const pickupInputRef = useRef(null);
  const pickupGalleryRef = useRef(null);
  const deliveryInputRef = useRef(null);
  const deliveryGalleryRef = useRef(null);
  
  const isReturn = order?.type === 'return';
  const getPhase = () => {
    if (!order) return null;
    const s = String(order.status || '').toLowerCase();
    const rawS = String(order.rawStatus || order.status || '').toLowerCase();
    
    // Pickup phase
    if (['pending', 'ready_for_pickup', 'ready-for-pickup', 'ready-for-delivery', 'fabric-ready-for-pickup', 'assigned', 'accepted'].includes(s) || 
        ['ready_for_pickup', 'ready-for-pickup', 'ready-for-delivery', 'fabric-ready-for-pickup', 'assigned', 'accepted'].includes(rawS)) return 'pickup';
        
    // Delivery phase
    if (['picked-up', 'picked_up', 'fabric-picked-up', 'out-for-delivery', 'out_for_delivery', 'shipped'].includes(s) ||
        ['picked_up', 'fabric-picked-up', 'out_for_delivery'].includes(rawS)) return 'delivery';
        
    return 'pickup'; // Default fallback instead of null
  };

  const currentPhase = getPhase();
  const isFabricPickup = order?.taskType === 'fabric-pickup';

  // Extract coordinates safely from the nested location arrays [lng, lat]
  const tailorLat = order?.tailor?.location?.coordinates?.[1];
  const tailorLng = order?.tailor?.location?.coordinates?.[0];
  const customerLat = order?.deliveryAddress?.location?.coordinates?.[1];
  const customerLng = order?.deliveryAddress?.location?.coordinates?.[0];

  const tailorAddress = order?.tailor?.location?.address;
  const formatDeliveryAddress = (addr) => {
    if (!addr) return 'Address not provided';
    if (addr.street && addr.street.length > 20) return addr.street; // Full Google string
    const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (addr.location?.coordinates?.[1] && addr.location?.coordinates?.[0]) {
      return `GPS: ${addr.location.coordinates[1].toFixed(5)}, ${addr.location.coordinates[0].toFixed(5)}`;
    }
    return 'Address not provided';
  };
  const customerAddress = formatDeliveryAddress(order?.deliveryAddress);

  const tailorPhone = order?.tailor?.phone;
  const customerPhone = order?.customerPhone || order?.phone; // fallback if needed

  // Define source and destination dynamically based on task type
  const pickupName = isFabricPickup ? order?.customerName : order?.tailor?.shopName;
  const pickupAddress = isFabricPickup ? customerAddress : tailorAddress;
  const pickupLat = isFabricPickup ? customerLat : tailorLat;
  const pickupLng = isFabricPickup ? customerLng : tailorLng;
  const pickupPhone = isFabricPickup ? customerPhone : tailorPhone;

  const dropoffName = isFabricPickup ? order?.tailor?.shopName : order?.customerName;
  const dropoffAddress = isFabricPickup ? tailorAddress : customerAddress;
  const dropoffLat = isFabricPickup ? tailorLat : customerLat;
  const dropoffLng = isFabricPickup ? tailorLng : customerLng;
  const dropoffPhone = isFabricPickup ? tailorPhone : customerPhone;
  
  // FIXED: Ensure we pass the correct ID (either _id or id)
  const liveLocation = useDeliveryTracking(deliveryBoy?._id || deliveryBoy?.id, order ? [order] : []);

  // Check if this order is actually assigned to the current rider
  const isAssignedToMe = order && (
    (typeof order.deliveryBoyId === 'string' && order.deliveryBoyId === deliveryBoy?.id) ||
    (order.deliveryBoyId?._id === deliveryBoy?.id) ||
    (order.deliveryBoyId === deliveryBoy?._id)
  );

  const isAvailableTask = order && !order.deliveryBoyId && (order.rawStatus === 'ready_for_pickup' || order.status === 'pending');
  
  useEffect(() => {
    // Only use live location from hook to ensure accurate tracking
    if (liveLocation?.lat && liveLocation?.lng) {
      setCurrentLocation(liveLocation);
    } else if (layoutLocationCoords?.lat && !currentLocation?.lat) {
      // Fallback to layout coordinates if live tracking hasn't locked on yet
      setCurrentLocation(layoutLocationCoords);
    }
  }, [liveLocation, layoutLocationCoords]);

  useEffect(() => {
    // If we have layoutLocationStr and liveLocation hasn't triggered yet, use layout string
    if (layoutLocationStr && layoutLocationStr !== 'Fetching Location...' && (!currentLocation?.lat || currentLocationAddress === 'Current GPS Location' || currentLocationAddress === 'Fetching Location...')) {
      console.log('📍 [OrderDetail] Using layoutLocationStr as fallback:', layoutLocationStr);
      setCurrentLocationAddress(layoutLocationStr);
    }
    
    if (currentLocation?.lat && currentLocation?.lng && isLoaded && window.google && window.google.maps && window.google.maps.Geocoder) {
      console.log('🗺️ [OrderDetail] Geocoding actual currentLocation:', { lat: currentLocation.lat, lng: currentLocation.lng });
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) } }, (results, status) => {
          console.log(`📏 [OrderDetail] Geocoder Status: ${status}`, results);
          if (status === 'OK' && results[0]) {
            setCurrentLocationAddress(results[0].formatted_address);
          } else {
            console.warn('⚠️ [OrderDetail] Geocoder failed or returned no results, using fallback');
            setCurrentLocationAddress(layoutLocationStr || 'Current GPS Location');
          }
        });
      } catch (err) {
        console.error('❌ [OrderDetail] Geocoder exception:', err);
        setCurrentLocationAddress(layoutLocationStr || 'Current GPS Location');
      }
    }
  }, [currentLocation?.lat, currentLocation?.lng, isLoaded, layoutLocationStr]);
  
  // Calculate dynamic delivery fee and total trip distance
  useEffect(() => {
    const hasPickup = (pickupLat && pickupLng) || pickupAddress;
    const hasDropoff = (dropoffLat && dropoffLng) || dropoffAddress;
    if (hasPickup && hasDropoff && isLoaded && window.google) {
      const fetchSettingsAndCalculate = async () => {
        try {
          const res = await api.get('/cms/settings');
          const rates = res.data?.data?.deliveryRates || { baseFee: 20, perKmRate: 10 };
          setFeeSettings(rates);
          
          const directionsService = new window.google.maps.DirectionsService();
          const hasCurrentLocation = currentLocation?.lat && currentLocation?.lng;
          
          const pickupLocation = pickupAddress || { lat: Number(pickupLat), lng: Number(pickupLng) };
          const dropoffLocation = dropoffAddress || { lat: Number(dropoffLat), lng: Number(dropoffLng) };
          
          // 1. Calculate Earnings (Always Pickup -> Dropoff)
          const earningsRequest = {
            origin: pickupLocation,
            destination: dropoffLocation,
            travelMode: window.google.maps.TravelMode.DRIVING,
          };

          directionsService.route(earningsRequest, (result, status) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
                const tripLeg = result.routes[0].legs[0];
                if (tripLeg) {
                  const km = tripLeg.distance.value / 1000;
                  setTotalTripDistanceKm(km);
                  
                  // If no GPS, fallback to using this trip distance for the display
                  if (!hasCurrentLocation) {
                    setDistanceRemaining(tripLeg.distance.value);
                    setEta(tripLeg.duration.text);
                  }
                }
              } else {
                console.warn('⚠️ [OrderDetail] DirectionsService failed (earnings):', status);
              }
            }
          );

          // 2. Calculate Active Navigation Distance (Current Location -> Target)
          if (hasCurrentLocation) {
            const isPickup = currentPhase === 'pickup';
            const navRequest = {
              origin: { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) },
              destination: isPickup ? pickupLocation : dropoffLocation,
              travelMode: window.google.maps.TravelMode.DRIVING,
            };

            directionsService.route(navRequest, (result, status) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
                const navLeg = result.routes[0].legs[0];
                if (navLeg) {
                  setDistanceRemaining(navLeg.distance.value);
                  setEta(navLeg.duration.text);
                }
              } else {
                console.warn('⚠️ [OrderDetail] DirectionsService failed (navigation):', status);
              }
            });
          }
        } catch (err) {
          console.error("Failed to calculate dynamic fee:", err);
        }
      };
      
      fetchSettingsAndCalculate();
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, pickupAddress, dropoffAddress, currentLocation?.lat, currentLocation?.lng, isLoaded, currentPhase]);

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetchOrderById(id);
      setOrder(response || null);
      
      const isArrivedStatus = ['reached-pickup', 'reached-dropoff'].includes(response?.deliveryStatus) || 
                              ['reached-pickup', 'reached-dropoff'].includes(response?.pickupDeliveryStatus) ||
                              ['reached-pickup', 'reached-dropoff'].includes(response?.dropoffDeliveryStatus);

      if (response?.arrivedAt || response?.deliveryFlow?.arrivedAt || isArrivedStatus) {
        setHasArrived(true);
        const accepted = (response.deliveryFlow?.tryAndBuyItems || response.items || [])
          .filter(i => i.decision !== 'rejected')
          .map(i => i.productId || i._id);
        setSelectedItemIds(new Set(accepted));
        setPaymentSelection(response.paymentMethod);
      } else if (response?.items) {
        setSelectedItemIds(new Set(response.items.map(i => i.productId || i._id)));
      }
      setIsInitialLoading(false);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.message === 'Cancelled by a new request') {
        console.log('Request cancelled, waiting for new request to complete.');
        return; // Do not update state if the request was cancelled by a newer one
      }
      setOrder(null);
      setIsInitialLoading(false);
    }
  }, [id, fetchOrderById]);

  useEffect(() => {
    loadOrder();
    const handleUpdate = () => loadOrder();
    socketService.on('order_status_updated', handleUpdate);
    socketService.on('order_taken', (data) => {
      if (data.id === id || data.orderId === id) {
        toast.error('Mission taken by another partner');
        navigate('/delivery/dashboard');
      }
    });

    if (id) socketService.emit('join', `order_${id}`);
    return () => {
       socketService.off('order_status_updated');
       socketService.off('order_taken');
    };
  }, [id, loadOrder, navigate]);

  const handleAcceptMission = async () => {
    try {
      // Use stable id from useParams
      await useDeliveryAuthStore.getState().acceptOrder(id, {
        calculatedDistance: totalTripDistanceKm
      });
      await loadOrder();
      toast.success('MISSION ACCEPTED! GO TO PICKUP');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept mission');
      navigate('/delivery/dashboard');
    }
  };

  const handleUpdateStatus = async (status, msg, options = {}) => {
    try {
      // Use stable id from useParams
      await updateOrderStatus(id, status, options);
      await loadOrder();
      toast.success(msg);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const handleArrivalUpdate = async () => {
    if (!id) return;
    try {
      const status = currentPhase === 'pickup' ? 'reached-pickup' : 'reached-dropoff';
      await updateOrderStatus(id, status);
      await loadOrder();
      setHasArrived(true);
      toast.success('Arrival marked successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark arrival');
    }
  };

  const handleOtpResend = async () => {
    if (isResending || !id) return;
    try {
      setIsResending(true);
      await resendDeliveryOtp(id);
      toast.success('OTP sent to customer');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const toggleItem = (pid) => {
    if (!order.isTryAndBuy) return;
    const next = new Set(selectedItemIds);
    if (next.has(pid)) {
      if (next.size <= 1) return toast.error('Min 1 item required');
      next.delete(pid);
    } else {
      next.add(pid);
    }
    setSelectedItemIds(next);
  };

  const handleItemConfirmation = async () => {
    try {
      await new Promise(r => setTimeout(r, 500));
      toast.success('Items selection confirmed');
    } catch {
      toast.error('Failed to confirm selection');
    }
  };

  const handlePaymentMethod = async (method) => {
    try {
      await new Promise(r => setTimeout(r, 500));
      setPaymentSelection(method);
      if (method === 'qr') setShowQRModal(true);
      toast.success(`Method: ${method.toUpperCase()}`);
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const isFinalDelivery = order?.taskType === 'order-delivery';
  
  const calculatedTotal = (isFinalDelivery && order?.remainingPaymentAmount > 0 && order?.remainingPaymentStatus !== 'paid')
    ? order.remainingPaymentAmount
    : (order?.isTryAndBuy 
        ? order.items.reduce((sum, item) => selectedItemIds.has(item.productId || item._id) ? sum + (item.price * item.quantity) : sum, 0)
        : order?.totalAmount || order?.total || 0);

  const isCod = calculatedTotal > 0 && (
    (isFinalDelivery && order?.remainingPaymentStatus !== 'paid' && order?.remainingPaymentAmount > 0) ||
    order?.paymentMethod === 'cod' || 
    order?.paymentMethod === 'cash'
  );
  const handleCancelOrder = () => {
    setIsCancellationModalOpen(true);
  };

  const confirmCancellation = async (reason) => {
    setIsCancelling(true);
    try {
      const updated = await cancelOrder(id, reason);
      setOrder(updated);
      toast.success('Order cancelled successfully');
      setIsCancellationModalOpen(false);
      navigate('/delivery/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancellation failed');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFinalize = async () => {
    if (!/^\d{6}$/.test(otpValue.trim())) return toast.error('Enter 6-digit OTP');
    if (isCod && !paymentSelection) return toast.error('Select payment method');
    if (!deliveryPhoto) return toast.error('Delivery photo required');

    try {
      const updated = await completeDeliveryFlow(id, { 
        otp: otpValue.trim(), 
        deliveryProofPhoto: deliveryPhoto,
        paymentMethod: paymentSelection // Pass selected payment method (cash or qr)
      });
      setOrder(updated);
      setShowSuccess(true);
    } catch(err) {
      toast.error(err?.response?.data?.message || 'Delivery failed');
    }
  };

  const handleImage = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  };

  console.log("OrderDetail Render:", { isInitialLoading, isLoadingOrder, isLoaded, order: !!order, id });

  // We only show "Order not found" if we have finished initial loading, we are not currently loading, and order is still null.
  if (isInitialLoading || isLoadingOrder || !isLoaded || (!order && isInitialLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
         <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
         <p className="text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">Fetching the order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <FiAlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <p className="text-slate-500 text-xs mt-2 mb-6 text-center max-w-[240px]">We couldn't find the details for this mission. It may have been reassigned or cancelled.</p>
        <button onClick={() => navigate('/delivery/dashboard')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Return to Dashboard</button>
      </div>
    );
  }

  if (showSuccess || order.status === 'delivered') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 border-4 border-emerald-50">
          <FiCheckCircle size={32} />
        </motion.div>
        <h1 className="text-xl font-bold text-slate-800">Job Complete</h1>
        <p className="text-slate-500 text-[10px] mt-2 mb-8 max-w-[240px] leading-relaxed uppercase tracking-widest font-bold">Delivery recorded successfully. <br/> Records have been updated.</p>
        <button onClick={() => navigate('/delivery/dashboard')} className="w-full max-w-[200px] h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest">Back to Home</button>
      </div>
    );
  }

  const getOrderTypeBadge = () => {
    if (order.isCheckAndBuy) return <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[8.5px] font-black border border-indigo-100 uppercase tracking-tighter">Check & Buy</span>;
    if (order.isTryAndBuy) return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[8.5px] font-black border border-amber-100 uppercase tracking-tighter">Try & Buy</span>;
    return <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-full text-[8.5px] font-black border border-slate-100 uppercase tracking-tighter">Standard</span>;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 pb-40 relative">
        {/* HEADER - CLEAN WHITE WITH BACK BUTTON */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-600"><FiArrowLeft size={20}/></button>
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">{isAvailableTask ? 'NEW BOOKING OFFER' : 'DRIVER ASSIGNED'}</p>
              <div className="flex items-center gap-1.5">
                 <span className="font-black text-sm text-slate-800 leading-none">{isAvailableTask ? 'Task' : getOrderTypeBadge()}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">#{String(order.orderId || order.id || id).slice(-8).toUpperCase()}</p>
        </header>

        <div className="max-w-md mx-auto pt-16">
          {/* HERO MAP SECTION */}
          {currentPhase && (
             <div className={`w-full bg-white relative transition-all duration-300 ${hasArrived ? 'h-[140px]' : 'h-[260px]'}`}>
                 <DeliveryBoyLiveMap 
                  currentLocation={currentLocation}
                  fallbackOrigin={{ lat: Number(pickupLat), lng: Number(pickupLng) }}
                  destination={
                    currentPhase === 'pickup' 
                      ? (pickupLat ? { lat: Number(pickupLat), lng: Number(pickupLng) } : null)
                      : (dropoffLat ? { lat: Number(dropoffLat), lng: Number(dropoffLng) } : null)
                  }
                  destinationAddress={currentPhase === 'pickup' ? pickupAddress : dropoffAddress}
                  isLoaded={isLoaded}
                  height="100%"
                  onRouteCalculated={(data) => {
                    setEta(data.duration);
                    setDistanceRemaining(data.distanceValue);
                    if (currentLocation?.lat && currentLocation?.lng && currentPhase === 'pickup') {
                      useDeliveryAuthStore.getState().updateLocation(currentLocation.lat, currentLocation.lng, data.duration, data.distanceValue);
                    }
                  }}
                />
                 
                 {/* FLOATING PROMPT LIKE SCREENSHOT */}
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-5 py-2.5 rounded-full shadow-lg border border-slate-100 whitespace-nowrap text-[11px] font-bold text-slate-600 shadow-slate-200/50 z-20">
                    {isAvailableTask ? 'Review the task details below.' : "Start when you're ready to head to the pickup."}
                 </div>
                 
                 {/* Distance/ETA Overlay - moved top right for cleaner look */}
                 <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 flex gap-3">
                   <div className="flex items-center gap-1">
                     <FiMapPin size={12} className="text-indigo-600" />
                     <span className="text-[10px] font-bold text-slate-800">
                       {distanceRemaining ? `${(distanceRemaining / 1000).toFixed(1)} km` : <span className="animate-pulse text-slate-400">Wait...</span>}
                     </span>
                   </div>
                   <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                     <FiClock size={12} className="text-indigo-600" />
                     <span className="text-[10px] font-bold text-slate-800">
                       {eta ? eta : <span className="animate-pulse text-slate-400">Wait...</span>}
                     </span>
                   </div>
                 </div>
             </div>
          )}

          <div className="p-4 pt-10 space-y-4">
             {/* PICKUP TARGET DETAILS CARD */}
             <div className={`bg-white rounded-[1.5rem] p-4 shadow-sm border ${currentPhase === 'pickup' ? 'border-orange-200 shadow-orange-100' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border shrink-0 ${currentPhase !== 'pickup' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                       {currentPhase !== 'pickup' ? <FiCheckCircle size={24} /> : (pickupName?.[0]?.toUpperCase() || 'P')}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5">
                         PICKUP FROM
                         {currentPhase !== 'pickup' && <span className="text-emerald-500 flex items-center gap-0.5 normal-case tracking-normal text-[10px]"><FiCheckCircle size={10}/> Completed</span>}
                       </p>
                       <h3 className="text-base font-black text-slate-800 leading-tight truncate">{pickupName}</h3>
                    </div>
                </div>

                <div className="space-y-3 mb-4 pl-1">
                    <div className="flex gap-3">
                       <FiMapPin size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                       <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Address</p>
                          <p className="text-xs font-bold text-slate-800">{pickupAddress}</p>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <FiPhone size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                       <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Phone</p>
                          <p className="text-xs font-bold text-slate-800">{pickupPhone || 'N/A'}</p>
                       </div>
                    </div>
                </div>

                <div className="flex gap-2">
                   <a 
                     href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddress)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={`w-14 h-11 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all ${currentPhase !== 'pickup' ? 'bg-slate-50 text-slate-400' : 'bg-blue-50 text-blue-600'}`}
                   >
                      <FiNavigation size={18}/>
                   </a>
                   <a href={`tel:${pickupPhone}`} className={`flex-1 h-11 font-bold rounded-2xl flex items-center justify-center gap-2 text-[13px] shadow-sm active:scale-95 transition-all ${currentPhase !== 'pickup' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                      <FiPhone size={16}/> Call
                   </a>
                </div>
             </div>

             {/* DROPOFF TARGET DETAILS CARD */}
             <div className={`bg-white rounded-[1.5rem] p-4 shadow-sm border ${currentPhase === 'delivery' ? 'border-indigo-200 shadow-indigo-100' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg border border-indigo-100 shrink-0">
                       {dropoffName?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5">
                         DELIVER TO
                       </p>
                       <h3 className="text-base font-black text-slate-800 leading-tight truncate">{dropoffName}</h3>
                    </div>
                </div>

                <div className="space-y-3 mb-4 pl-1">
                    <div className="flex gap-3">
                       <FiMapPin size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                       <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Address</p>
                          <p className="text-xs font-bold text-slate-800">{dropoffAddress}</p>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <FiPhone size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                       <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Phone</p>
                          <p className="text-xs font-bold text-slate-800">{dropoffPhone || 'N/A'}</p>
                       </div>
                    </div>
                </div>

                <div className="flex gap-2">
                   <a 
                     href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dropoffAddress)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-14 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                   >
                      <FiNavigation size={18}/>
                   </a>
                   <a href={`tel:${dropoffPhone}`} className="flex-1 h-11 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-[13px] shadow-sm shadow-emerald-200 active:scale-95 transition-all">
                      <FiPhone size={16}/> Call
                   </a>
                </div>
             </div>

             {/* ORDER ITEMS CARD */}
             <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                       <FiPackage className="text-slate-400" size={18}/>
                    </div>
                    <div className="flex-1">
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">ORDER CONTENTS</p>
                       <h3 className="text-sm font-black text-slate-800 leading-tight">{order.items?.length || 0} Items in Task</h3>
                    </div>
                 </div>
                 
                 {/* Only show items list if not just an offer */}
                 {!isAvailableTask && (
                   <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
                     {order.items?.map((item, idx) => {
                        const isPicked = selectedItemIds.has(item.productId || item._id);
                        const isTryMode = order.isTryAndBuy && hasArrived;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => isTryMode && toggleItem(item.productId || item._id)}
                            className={`flex gap-3 p-2 rounded-xl border transition-all ${isTryMode ? (isPicked ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent opacity-60') : 'bg-slate-50 border-transparent'}`}
                          >
                             <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <FiPackage className="text-slate-200 mt-2.5 mx-auto" size={16} />}
                             </div>
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[11px] font-bold text-slate-800 truncate">{item.productName || item.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Qty: {item.quantity}</p>
                             </div>
                             {isTryMode && (
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 my-auto ${isPicked ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200'}`}>
                                  {isPicked ? <FiCheckCircle size={12}/> : <div className="w-2.5 h-2.5 border border-slate-300 rounded-full" />}
                               </div>
                             )}
                          </div>
                        );
                     })}
                     {order.isTryAndBuy && hasArrived && !order.tryAndBuyCompleted && (
                       <button onClick={handleItemConfirmation} className="w-full mt-4 h-10 bg-slate-900 text-white font-bold rounded-2xl text-[10px] uppercase tracking-[0.1em]">Confirm Selection</button>
                     )}
                   </div>
                 )}
             </div>

             {/* TRIP/LOCATION CARD */}
             <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">TRIP</p>
                
                {/* Distance Overview Box */}
                <div className="bg-indigo-50/50 rounded-xl p-3 mb-5 border border-indigo-50 flex items-center justify-between">
                   <div>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
                        {currentLocation?.lat ? 'Distance from you' : 'Trip Distance'}
                      </p>
                      <p className="text-sm font-black text-indigo-900">
                        {distanceRemaining === -1 ? 'Unknown' : distanceRemaining !== null ? `${(distanceRemaining / 1000).toFixed(1)} km` : <span className="text-xs text-indigo-400 font-bold animate-pulse">Calculating...</span>}
                      </p>
                   </div>
                   <div className="h-6 w-px bg-indigo-100" />
                   <div className="text-right">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Est. Time</p>
                      <p className="text-sm font-black text-indigo-900">
                        {eta ? eta : <span className="text-xs text-indigo-400 font-bold animate-pulse">Wait...</span>}
                      </p>
                   </div>
                </div>

                <div className="flex gap-3 relative">
                   <div className="mt-0.5 relative z-10 bg-white">
                      {currentPhase !== 'pickup' ? <FiCheckCircle size={16} className="text-emerald-500" /> : <FiMapPin size={16} className="text-indigo-500" />}
                   </div>
                   <div className="flex-1">
                       <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1 ${currentPhase !== 'pickup' ? 'text-emerald-500' : 'text-slate-500'}`}>
                           Pickup
                           {currentPhase !== 'pickup' && <span className="text-emerald-500 normal-case tracking-normal text-[9px]">(Completed)</span>}
                       </p>
                       <p className={`text-xs font-semibold leading-snug ${currentPhase !== 'pickup' ? 'text-slate-400' : 'text-slate-700'}`}>
                           {pickupAddress}
                       </p>
                       {currentPhase === 'pickup' && (
                           <p className="text-[9px] font-mono text-indigo-400 font-medium mt-1 uppercase tracking-tighter bg-indigo-50 inline-block px-1.5 py-0.5 rounded border border-indigo-100">
                               {currentLocationAddress === 'Fetching Location...' ? 'Fetching your distance...' : 'GPS Active'}
                           </p>
                       )}
                   </div>
                   <div className="absolute left-2 top-5 bottom-[-20px] w-px border-l-2 border-dashed border-slate-200 z-0" />
                </div>
                <div className="flex gap-3 mt-6 relative">
                   <div className="mt-0.5 relative z-10 bg-white"><FiMapPin size={16} className="text-rose-500" /></div>
                   <div className="flex-1">
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">
                           Dropoff
                       </p>
                       <p className="text-xs font-semibold text-slate-700 leading-snug">
                           {dropoffAddress}
                       </p>
                   </div>
                </div>
             </div>

             {/* EARNING CARD */}
             <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                       <FiCreditCard size={14}/>
                    </div>
                    <div className="w-full">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Your earning</p>
                       <h2 className="text-lg font-black text-slate-800 leading-tight">
                          {formatPrice(order.deliveryFee || order.deliveryEarnings || 0)}
                       </h2>
                       
                       {totalTripDistanceKm !== null && feeSettings && (
                         <div className="mt-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex flex-col gap-1.5">
                           <div className="flex justify-between items-center">
                             <span className="text-[9px] font-bold text-slate-500">Base Fee</span>
                             <span className="text-[10px] font-black text-slate-700">{formatPrice(feeSettings.baseFee)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-[9px] font-bold text-slate-500">Distance ({totalTripDistanceKm.toFixed(1)} km × {formatPrice(feeSettings.perKmRate)})</span>
                             <span className="text-[10px] font-black text-slate-700">{formatPrice(Math.round(totalTripDistanceKm * feeSettings.perKmRate))}</span>
                           </div>
                         </div>
                       )}
                       
                       <p className="text-[9px] text-slate-400 mt-2 leading-snug">Net amount after platform commission. Credited to your wallet once the trip is completed.</p>
                    </div>
                </div>
             </div>

             {/* Verification and OTP Area - only show if accepted and arrived */}
             {!isAvailableTask && isAssignedToMe && hasArrived && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                     <div>
                        <div className="flex items-center justify-between mb-3">
                           <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Verification Proof</p>
                           <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded leading-none uppercase">{(currentPhase || 'Phase').toUpperCase()}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative aspect-[16/9] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center group shadow-inner">
                               {(currentPhase === 'pickup' ? pickupPhoto : deliveryPhoto) ? (
                                  <>
                                    <img src={currentPhase === 'pickup' ? pickupPhoto : deliveryPhoto} className="w-full h-full object-cover" />
                                    <button onClick={() => currentPhase === 'pickup' ? setPickupPhoto(null) : setDeliveryPhoto(null)} className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-lg text-sm leading-none">×</button>
                                  </>                               ) : (
                                  <div className="flex flex-col items-center gap-3">
                                     <button onClick={() => currentPhase === 'pickup' ? pickupInputRef.current?.click() : deliveryInputRef.current?.click()} className="flex flex-col items-center gap-1.5 text-indigo-600 active:scale-95 transition-transform">
                                        <FiCamera size={28}/>
                                        <span className="text-[9px] font-black uppercase tracking-tight">CAMERA</span>
                                     </button>
                                     <div className="w-12 h-px bg-slate-200" />
                                     <button onClick={() => currentPhase === 'pickup' ? pickupGalleryRef.current?.click() : deliveryGalleryRef.current?.click()} className="flex flex-col items-center gap-1.5 text-slate-400 active:scale-95 transition-transform">
                                        <FiImage size={24}/>
                                        <span className="text-[8px] font-black uppercase tracking-tight">GALLERY</span>
                                     </button>
                                  </div>
                               )}
                            </div>
                         </div>
                     </div>

                     {/* OTP AREA */}
                     {(currentPhase === 'delivery' || currentPhase === 'pickup') && ((currentPhase === 'pickup' && pickupPhoto) || (currentPhase === 'delivery' && deliveryPhoto)) && (
                       <div className="pt-4 border-t border-slate-100/50 text-center">
                          <p className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.2em] mb-4">Security Terminal</p>
                          
                          <div className="max-w-[210px] mx-auto space-y-3">
                            <div className="relative group">
                                <input 
                                type="tel" maxLength={6} value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit OTP"
                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black tracking-[0.2em] text-slate-800 placeholder:text-slate-300 placeholder:text-[10px] placeholder:tracking-normal outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20">
                                    <FiShield size={18}/>
                                </div>
                            </div>
                            <button 
                              onClick={handleOtpResend} 
                              disabled={isResending}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-[9px] font-bold text-indigo-600 bg-indigo-50/50 rounded-xl active:bg-indigo-50 transition-colors uppercase tracking-[0.1em] shadow-sm active:scale-95"
                            >
                               {isResending ? 'GENERATING NEW OTP...' : <><FiSend size={12}/> RE-GENERATE & RESEND OTP</>}
                            </button>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight leading-none px-2 mt-2 opacity-60">OTP is sent only during active arrival session.</p>
                          </div>

                          {/* PAYMENT OPTIONS */}
                          {isCod && (
                            <div className="mt-6 pt-5 border-t border-slate-50 text-left">
                               <div className="flex items-center justify-between mb-4">
                                  <div className="min-w-0">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1 tracking-tighter">Amount Due</p>
                                     <p className="text-xl font-black text-slate-900 leading-none">{formatPrice(calculatedTotal)}</p>
                                  </div>
                                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                     <FiCreditCard size={18} className="text-indigo-600"/>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                   <button 
                                     onClick={()=>handlePaymentMethod('cash')} 
                                     disabled={isUpdatingOrderStatus}
                                     className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 flex items-center justify-center gap-1.5 ${paymentSelection==='cash' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100'}`}
                                   >
                                     {isUpdatingOrderStatus && paymentSelection==='cash' ? <><FiLoader className="w-3.5 h-3.5 animate-spin" /> SELECTING...</> : 'CASH'}
                                   </button>
                                   <button 
                                     onClick={()=>handlePaymentMethod('qr')} 
                                     disabled={isUpdatingOrderStatus}
                                     className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 flex items-center justify-center gap-1.5 ${paymentSelection==='qr' ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border-slate-100'}`}
                                   >
                                     {isUpdatingOrderStatus && paymentSelection==='qr' ? <><FiLoader className="w-3.5 h-3.5 animate-spin" /> GENERATING...</> : 'UPI QR'}
                                   </button>
                               </div>
                            </div>
                          )}
                       </div>
                     )}
                </div>
             )}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex flex-col gap-2">
          {isAvailableTask ? (
            <div className="flex gap-3">
              <button 
                  onClick={async () => {
                      if(confirm("Are you sure you want to decline this task? It will be assigned to someone else.")) {
                          try {
                              await rejectOrder(id);
                              toast.success('Task declined successfully');
                              navigate('/delivery/dashboard');
                          } catch(err) {
                              toast.error(err?.response?.data?.message || 'Failed to decline task');
                          }
                      }
                  }}
                  disabled={isUpdatingOrderStatus}
                  className="flex-1 h-12 bg-white text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border-2 border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                  {isUpdatingOrderStatus ? <><FiLoader className="w-3.5 h-3.5 animate-spin" /> DECLINING...</> : 'Skip'}
              </button>
              <button 
                  onClick={handleAcceptMission}
                  disabled={isUpdatingOrderStatus}
                  className="flex-[2] h-12 bg-amber-400 text-amber-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                  {isUpdatingOrderStatus ? <><FiLoader className="w-3.5 h-3.5 animate-spin text-amber-950" /> ACCEPTING...</> : 'Accept'}
              </button>
            </div>
          ) : isAssignedToMe ? (
            <>
              {!hasArrived ? (
                 <button 
                    onClick={handleArrivalUpdate}
                    className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    <FiZap size={14} className="animate-pulse" /> GENERATE OTP (I HAVE ARRIVED)
                 </button>
              ) : (
                <button 
                    onClick={currentPhase === 'pickup' ? () => {
                        const correctStatus = (order.taskType === 'fabric-pickup' || order.status === 'fabric-ready-for-pickup') ? 'fabric-picked-up' : 'picked-up-from-tailor';
                        handleUpdateStatus(correctStatus, 'Items picked up!', { pickupPhoto, otp: otpValue.trim() });
                    } : handleFinalize}
                    disabled={isUpdatingOrderStatus || (currentPhase === 'pickup' && (otpValue.length < 6 || !pickupPhoto)) || (currentPhase === 'delivery' && (otpValue.length < 6 || !deliveryPhoto || (isCod && (!paymentSelection))))}
                    className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                    {isUpdatingOrderStatus ? <><FiLoader className="w-3.5 h-3.5 animate-spin text-white" /> WAITING...</> : (currentPhase === 'pickup' ? ((otpValue.length < 6 || !pickupPhoto) ? 'PROVIDE OTP & PHOTO TO COMPLETE' : 'MARK AS PICKED UP') : ((otpValue.length < 6 || !deliveryPhoto || (isCod && (!paymentSelection))) ? 'PROVIDE OTP & PHOTO TO COMPLETE' : 'COMPLETE DELIVERY'))}
                </button>
              )}
              
              {/* Cancel Trip Button */}
              <button 
                onClick={handleCancelOrder}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-black text-rose-500 rounded-xl active:bg-rose-50 transition-colors uppercase tracking-widest mt-1"
              >
                 <FiX size={12}/> Cancel Trip
              </button>
            </>
          ) : (
            <div className="text-center py-2 px-4 bg-rose-50 rounded-xl border border-rose-100">
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5">UNAUTHORIZED ACCESS</p>
               <p className="text-[8px] font-bold text-rose-400 uppercase leading-none">This task is assigned to another partner.</p>
            </div>
          )}
        </div>

        {/* QR MODAL */}
        <AnimatePresence>
          {showQRModal && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="bg-white w-full max-w-xs rounded-[2.5rem] p-6 shadow-2xl relative border-b-[10px] border-indigo-600 overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
                  <button onClick={() => setShowQRModal(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full z-10"><FiX size={18}/></button>
                  
                  <div className="text-center relative">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">UPI Payment Gateway</p>
                    <h4 className="text-sm font-black text-slate-800 mb-6 font-mono border-b border-slate-100 pb-4">{formatPrice(calculatedTotal)}</h4>
                    
                     <div className="aspect-square bg-white border-2 border-slate-50 rounded-[1.5rem] flex items-center justify-center p-5 mb-6 shadow-xl relative group">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${import.meta.env.VITE_ADMIN_UPI_ID || 'silaiwala@razorpay'}&pn=Silaiwala&am=${calculatedTotal}&cu=INR`)}`} alt="Payment QR" className="w-full h-full" />
                        <div className="absolute inset-0 border-4 border-white rounded-[1.5rem]" />
                     </div>

                    <p className="text-[9px] font-bold text-slate-400 px-2 leading-tight uppercase tracking-tighter mb-8">Scan QR with any UPI app.</p>
                    <button onClick={() => setShowQRModal(false)} className="w-full h-12 bg-indigo-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-indigo-100 uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                       <FiCheckCircle size={16}/> PAYMENT CONFIRMED
                    </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CancellationModal
          isOpen={isCancellationModalOpen}
          onClose={() => setIsCancellationModalOpen(false)}
          onConfirm={confirmCancellation}
          isSubmitting={isCancelling}
        />

        {/* HIDDEN INPUTS FOR FILE UPLOAD */}
        <input type="file" accept="image/*" capture="environment" ref={pickupInputRef} onChange={(e) => handleImage(e.target.files[0], setPickupPhoto)} className="hidden" />
        <input type="file" accept="image/*" ref={pickupGalleryRef} onChange={(e) => handleImage(e.target.files[0], setPickupPhoto)} className="hidden" />
        <input type="file" accept="image/*" capture="environment" ref={deliveryInputRef} onChange={(e) => handleImage(e.target.files[0], setDeliveryPhoto)} className="hidden" />
        <input type="file" accept="image/*" ref={deliveryGalleryRef} onChange={(e) => handleImage(e.target.files[0], setDeliveryPhoto)} className="hidden" />
      </div>
    </PageTransition>
  );
};

export default DeliveryOrderDetail;
