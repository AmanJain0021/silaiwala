// Port of modules/customer/pages/CustomerLiveJourney.jsx — foreground GPS watch, Directions REST route, location broadcast, OTP dialog.
import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChevronLeft, MapPin, CheckCircle2, XCircle } from 'lucide-react-native';
import { useParams, useNavigate } from '../lib/nav';
import api from '../lib/api';
import { alert } from '../lib/alert';
import { watchPosition } from '../lib/location';
import { getDirections } from '../lib/directions';
import Screen from '../components/common/Screen';
import Spin from '../components/ui/Spin';
import { Dialog } from '../components/ui/Sheet';
import { Box, Txt, Btn, I, Input } from '../components/ui/primitives';

const ll = (c) => ({ latitude: c.lat, longitude: c.lng });

const CustomerLiveJourney = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState('');
  const [eta, setEta] = useState('');
  const [error, setError] = useState(null);
  const [isArrived, setIsArrived] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const mapRef = useRef(null);
  const arrivedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.message === 'canceled') return;
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      }
    })();
  }, [id]);

  const vendor = order
    ? { lat: order.vendorLatitude ? Number(order.vendorLatitude) : 22.7196, lng: order.vendorLongitude ? Number(order.vendorLongitude) : 75.8577 }
    : null;

  const updateRouteAndBroadcast = async (currentLoc) => {
    if (!order || arrivedRef.current) return;
    const destination = { lat: order.vendorLatitude ? Number(order.vendorLatitude) : 22.7196, lng: order.vendorLongitude ? Number(order.vendorLongitude) : 75.8577 };
    const r = await getDirections(currentLoc, destination);
    if (r) {
      setRoute(r);
      mapRef.current?.fitToCoordinates(r.coords, { edgePadding: { top: 40, bottom: 40, left: 40, right: 40 }, animated: true });
      setDistance(r.distance);
      setEta(r.duration);
      if (r.distanceValue <= 50) {
        arrivedRef.current = true;
        setIsArrived(true);
      }
      try {
        await api.post(`/orders/${order._id}/customer-location`, { latitude: currentLoc.lat, longitude: currentLoc.lng, distanceRemaining: r.distance, eta: r.duration });
      } catch (_) { /* broadcast best effort */ }
    } else {
      mapRef.current?.fitToCoordinates([ll(currentLoc), ll(destination)], { edgePadding: { top: 50, bottom: 50, left: 50, right: 50 }, animated: true });
    }
  };

  useEffect(() => {
    if (!order) return undefined;
    const stop = watchPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCurrentLocation(loc);
        updateRouteAndBroadcast(loc);
      },
      () => {
        // same fallback as the web: saved address or default point
        const mock = order.customerLatitude && order.customerLongitude ? { lat: Number(order.customerLatitude), lng: Number(order.customerLongitude) } : { lat: 22.7246, lng: 75.8677 };
        setCurrentLocation(mock);
        updateRouteAndBroadcast(mock);
      },
    );
    return stop;
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitOtp = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    setIsUpdating(true);
    try {
      const targetStatus = ['ready-for-pickup', 'ready-for-delivery'].includes(order.status) ? 'product-delivered' : 'fabric-received';
      await api.patch(`/orders/${order._id}/status`, { status: targetStatus, otp });
      setShowOtpModal(false);
      navigate(`/user/orders/${order._id}/track`, { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status. Incorrect OTP?');
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <Screen className="bg-gray-50">
        <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <I icon={XCircle} size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Txt className="text-lg font-bold text-gray-900 mb-2">Location Error</Txt>
          <Txt className="text-gray-500 mb-6 text-center">{error}</Txt>
          <Btn onPress={() => navigate('/user/orders')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Go Back</Btn>
        </Box>
      </Screen>
    );
  }
  if (!order) {
    return (
      <Screen className="bg-gray-50">
        <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Spin size={32} color="#843D9B" style={{ marginBottom: 16 }} />
          <Txt className="text-gray-500 font-medium">Initializing Tracker...</Txt>
        </Box>
      </Screen>
    );
  }

  const isPickup = ['ready-for-pickup', 'ready-for-delivery'].includes(order.status);
  const start = currentLocation || { lat: 20.5937, lng: 78.9629 };

  return (
    <Screen className="bg-white">
      <Box className="flex-1 bg-gray-50 flex flex-col font-sans">
        <Box className="bg-white px-4 py-4 shadow-sm z-10 flex items-center justify-between border-b border-gray-100">
          <Btn onPress={() => navigate('/user/orders')} className="p-2 -ml-2 rounded-full">
            <I icon={ChevronLeft} size={24} color="#1f2937" />
          </Btn>
          <Box className="items-center">
            <Txt className="text-[14px] font-black tracking-tight text-gray-900">Your Journey to Tailor</Txt>
            <Txt className="text-[10px] font-bold text-primary uppercase tracking-widest">{isPickup ? 'Product Pickup' : 'Live GPS Broadcast'}</Txt>
          </Box>
          <Box className="w-10" />
        </Box>

        <Box className="flex-1 relative bg-gray-100">
          <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={{ flex: 1 }} toolbarEnabled={false} initialRegion={{ ...ll(start), latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
            {route?.coords && <Polyline coordinates={route.coords} strokeColor="rgba(59,7,100,0.22)" strokeWidth={9} zIndex={1} />}
            {route?.coords && <Polyline coordinates={route.coords} strokeColor="#843D9B" strokeWidth={5.5} zIndex={2} />}
            {currentLocation && (
              <Marker coordinate={ll(currentLocation)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                <Svg width={20} height={20}><Circle cx={10} cy={10} r={8} fill="#4f46e5" stroke="#ffffff" strokeWidth={2} /></Svg>
              </Marker>
            )}
            {vendor && (
              <Marker coordinate={ll(vendor)} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                <Svg width={22} height={26} viewBox="0 0 22 26"><Path d="M11 25 L2 4 L11 9 L20 4 Z" fill="#000000" stroke="#ffffff" strokeWidth={2} /></Svg>
              </Marker>
            )}
          </MapView>
          <View pointerEvents="none" style={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
            <Box className="bg-white/90 p-4 rounded-2xl shadow-lg border border-gray-100/50 flex items-center justify-between">
              <Box>
                <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time Left</Txt>
                <Txt className="text-lg font-black text-gray-900 leading-none">{eta || '--'}</Txt>
              </Box>
              <Box className="h-8 w-px bg-gray-200" />
              <Box className="items-end">
                <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Distance</Txt>
                <Txt className="text-lg font-black text-gray-900 leading-none">{distance || '--'}</Txt>
              </Box>
            </Box>
          </View>
        </Box>

        <Box className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 z-10">
          <Box className="flex items-center gap-4 mb-6">
            <Box className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <I icon={MapPin} size={24} color="#843D9B" />
            </Box>
            <Box className="flex-1">
              <Txt className="text-sm font-black text-gray-900">{order.tailor?.shopName || 'Tailor Shop'}</Txt>
              <Txt className="text-xs text-gray-500 line-clamp-1">{order.tailor?.location?.address || 'Indore, Madhya Pradesh (Fallback Address)'}</Txt>
            </Box>
          </Box>
          <Btn onPress={() => setShowOtpModal(true)} disabled={isUpdating} className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 bg-primary text-white shadow-lg shadow-primary/25">
            {isUpdating ? <Spin size={20} color="#fff" /> : <I icon={CheckCircle2} size={20} />}
            <Txt>{isPickup ? (isArrived ? 'Confirm Product Received' : 'Proceeding to Shop (Collect Product)') : (isArrived ? 'Confirm Fabric Dropped' : 'Proceeding to Shop (Click to Complete)')}</Txt>
          </Btn>
        </Box>
      </Box>

      <Dialog visible={showOtpModal} onClose={() => setShowOtpModal(false)} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
        <Btn onPress={() => setShowOtpModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full z-10">
          <I icon={XCircle} size={20} color="#6b7280" />
        </Btn>
        <Box className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <I icon={CheckCircle2} size={24} color="#843D9B" />
        </Box>
        <Txt className="text-xl font-black text-gray-900 mb-2">Dropoff Verification</Txt>
        <Txt className="text-sm text-gray-500 font-medium mb-6">Please ask the Tailor for the 6-digit delivery OTP to confirm you have dropped off the fabric.</Txt>
        <Input placeholder="Enter 6-digit OTP" maxLength={6} keyboardType="number-pad" value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
          className="w-full bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] mb-4" />
        <Btn onPress={submitOtp} disabled={isUpdating || otp.length !== 6} className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 bg-primary text-white shadow-lg shadow-primary/25">
          {isUpdating ? <Spin size={20} color="#fff" /> : <Txt>Verify & Complete</Txt>}
        </Btn>
      </Dialog>
    </Screen>
  );
};

export default CustomerLiveJourney;
