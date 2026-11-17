// Port of shared/components/TailorLiveDeliveryTracker.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../lib/nav';
import { Linking } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../lib/config';
import Spin from '../../components/ui/Spin';
import { watchPosition } from '../../lib/location';
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Clock, Navigation, CheckCircle2, Loader2, Phone, DollarSign } from "lucide-react-native";
import DeliveryBoyLiveMap from "./DeliveryBoyLiveMap";
import api from "../../lib/api";
import toast from '../../lib/toast';
import { Box, Txt, I, Btn, Input, Scroll } from '../ui/primitives';
const TailorLiveDeliveryTracker = ({
  order,
  socket,
  onDeliveryComplete
}) => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash' or 'online'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const isLoaded = true;
  const loadError = null;
  const hasRemainingPayment = order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== 'paid';

  // Geolocation watch (web: navigator.geolocation.watchPosition; native: expo-location, foreground)
  useEffect(() => {
    const stop = watchPosition(position => {
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
    }, err => {
      console.error("GPS Watch Error:", err);
      // Same fallback as the web (Indore offset) when GPS is unavailable
      setCurrentLocation({ lat: 22.7230, lng: 75.8620 });
    });
    watchIdRef.current = stop;
    return () => stop();
  }, []);

  // Broadcast location over Socket.IO and REST (backup/throttled)
  useEffect(() => {
    if (!currentLocation || !socket) return;
    const now = Date.now();
    // Throttle socket emits to every 8 seconds to save resources
    if (now - lastEmitRef.current < 8000) return;
    lastEmitRef.current = now;

    // Direct Socket emit
    socket.emit('tailor_location_update', {
      orderId: order._id,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      distanceRemaining: distance,
      eta: eta
    });

    // REST POST backup broadcast
    api.post(`/orders/${order._id}/tailor-location`, {
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      distanceRemaining: distance,
      eta: eta
    }).catch(err => console.error("REST location broadcast failed:", err.message));
  }, [currentLocation, distance, eta, socket, order._id]);

  // Handle route metadata calculation
  const handleRouteCalculated = routeData => {
    if (routeData) {
      setDistance(routeData.distance);
      setEta(routeData.duration);
    }
  };
  const handleCompleteDelivery = async e => {
    if (!/^\d{6}$/.test(otp.trim())) {
      return toast.error("Enter a valid 6-digit OTP");
    }
    if (hasRemainingPayment && !paymentMethod) {
      return toast.error("Please confirm payment collection method");
    }
    setIsSubmitting(true);
    try {
      const response = await api.patch(`/orders/${order._id}/tailor-complete-delivery`, {
        otp: otp.trim(),
        paymentMethod: hasRemainingPayment ? paymentMethod : undefined
      });
      if (response.data?.success) {
        toast.success("Delivery completed successfully! 🎉");
        setIsCompleted(true);
        if (onDeliveryComplete) {
          onDeliveryComplete(response.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Verification failed. Incorrect OTP?");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isCompleted || ['delivered', 'order-completed'].includes(order.status)) {
    return null;
  }

  // Destination coordinates: Customer location
  const destination = order.customerLatitude && order.customerLongitude ? {
    lat: Number(order.customerLatitude),
    lng: Number(order.customerLongitude)
  } : null;
  return <Box className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      <Box className="flex items-center justify-between">
        <Txt className="text-sm font-black text-gray-900 flex items-center gap-2">
          <I icon={Navigation} size={16} className="text-[#843D9B] animate-pulse" />
          Self Delivery - Live Route
        </Txt>
        <Box className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 animate-pulse">
          Broadcasting GPS
        </Box>
      </Box>

      {/* Map Container */}
      <Box className="w-full h-64 rounded-2xl overflow-hidden relative border border-gray-100">
        {isLoaded && destination ? <DeliveryBoyLiveMap currentLocation={currentLocation} destination={destination} isLoaded={isLoaded} height="100%" onRouteCalculated={handleRouteCalculated} /> : <Box className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Spin className="w-6 h-6 animate-spin text-[#843D9B]" />
          </Box>}

        {/* Floating Distance/ETA */}
        {(distance || eta) && <Box className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100/50 flex gap-4">
            {distance && <Box className="flex items-center gap-1.5">
                <I icon={MapPin} size={14} className="text-primary" />
                <Txt className="text-xs font-bold text-gray-800">{distance}</Txt>
              </Box>}
            {eta && <Box className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                <I icon={Clock} size={14} className="text-primary" />
                <Txt className="text-xs font-bold text-gray-800">{eta}</Txt>
              </Box>}
          </Box>}
      </Box>

      {/* Customer Info Card */}
      <Box className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <Box className="flex items-center gap-3">
          <Box className="w-10 h-10 bg-[#843D9B]/10 rounded-xl flex items-center justify-center shrink-0">
            <Txt className="text-lg font-black text-[#843D9B]">
              {order.customer?.name?.charAt(0) || 'C'}
            </Txt>
          </Box>
          <Box>
            <Txt className="text-sm font-bold text-gray-900">{order.customer?.name || 'Customer'}</Txt>
            <Txt className="text-[10px] text-gray-500 font-medium leading-none mt-1">Delivery Address Location</Txt>
          </Box>
        </Box>

        {order.customer?.phoneNumber && <Btn onPress={() => Linking.openURL(`tel:${order.customer.phoneNumber}`)} className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors shadow-sm">
            <I icon={Phone} size={14} fill="currentColor" />
          </Btn>}
      </Box>

      {/* Verification OTP and Payment Gate Form */}
      <Box className="space-y-4 pt-2">
        {hasRemainingPayment && <Box className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
            <Box className="flex items-center justify-between text-amber-900">
              <Txt className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <I icon={DollarSign} size={14} /> Remaining Payment Due
              </Txt>
              <Txt className="text-sm font-black">₹{order.remainingPaymentAmount}</Txt>
            </Box>
            
            <Txt className="text-[10px] text-amber-700 font-medium">
              Confirm payment collection method from the customer before completing.
            </Txt>

            <Box className="grid grid-cols-2 gap-2">
              <Btn onPress={() => setPaymentMethod('cash')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${paymentMethod === 'cash' ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50'}`}>
                Cash Collected
              </Btn>
              <Btn onPress={() => setPaymentMethod('online')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${paymentMethod === 'online' ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50'}`}>
                QR / Paid Online
              </Btn>
            </Box>
          </Box>}

        <Box className="space-y-2">
          <Txt className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
            Customer Delivery OTP
          </Txt>
          <Input maxLength={6} value={otp} onChangeText={e => setOtp(e.replace(/\D/g, ''))} placeholder="Enter 6-digit OTP shared by customer" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-center tracking-[0.2em] focus:outline-none focus:border-[#843D9B] focus:bg-white transition-colors" keyboardType="phone-pad" />
        </Box>

        <Btn disabled={isSubmitting || otp.length < 6 || hasRemainingPayment && !paymentMethod} className="w-full py-4 bg-[#843D9B] hover:bg-[#6c317f] disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#843D9B]/10 flex items-center justify-center gap-2">
          {isSubmitting ? <Spin className="w-4 h-4 animate-spin" /> : <I icon={CheckCircle2} size={16} />}
          Complete Delivery Flow
        </Btn>
      </Box>
    </Box>;
};
export default TailorLiveDeliveryTracker;
