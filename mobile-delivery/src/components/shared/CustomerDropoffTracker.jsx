// Port of shared/components/CustomerDropoffTracker.jsx: Google Maps JS -> react-native-maps (Google provider).
// Same socket contract: join `joinOrderRoom`, listen to `locationUpdated` for this order.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { User, Navigation, Clock } from 'lucide-react-native';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../lib/config';
import { getToken } from '../../lib/auth';
import { Box, I, Txt } from '../ui/primitives';

const CustomerDropoffTracker = ({ order }) => {
  const [customerLocation, setCustomerLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const mapRef = useRef(null);
  const orderId = order?._id || order?.id;

  useEffect(() => {
    const token = getToken();
    if (!token || !orderId) return undefined;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket.emit('joinOrderRoom', orderId));
    socket.on('locationUpdated', (data) => {
      if (data.orderId !== orderId) return;
      setCustomerLocation({ latitude: data.currentLocation.latitude, longitude: data.currentLocation.longitude });
      if (data.eta) setEta(data.eta);
      if (data.distanceRemaining) setDistance(data.distanceRemaining);
    });
    return () => socket.disconnect();
  }, [orderId]);

  const destination = useMemo(() => {
    const c = order?.tailor?.location?.coordinates;
    return c && c.length >= 2 ? { latitude: Number(c[1]), longitude: Number(c[0]) } : { latitude: 22.7196, longitude: 75.8577 };
  }, [order]);

  const center = customerLocation || destination;
  useEffect(() => {
    mapRef.current?.animateCamera?.({ center, zoom: 15 }, { duration: 400 });
  }, [center]);

  return (
    <Box className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mt-4">
      <Box className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <Box className="flex items-center gap-3">
          <Box className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <I icon={User} size={20} color="#2563eb" />
          </Box>
          <Box>
            <Txt className="text-sm font-black text-gray-900">Customer Dropoff</Txt>
            <Txt className="text-xs font-medium text-gray-500">Live Location Tracking</Txt>
          </Box>
        </Box>
        {eta ? (
          <Box className="items-end">
            <Box className="flex items-center gap-1.5 mb-0.5">
              <I icon={Clock} size={14} color="#2563eb" />
              <Txt className="text-sm font-black text-blue-600">{eta}</Txt>
            </Box>
            <Txt className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{distance || 'Approaching'}</Txt>
          </Box>
        ) : null}
      </Box>

      <Box className="relative h-[250px] w-full">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialCamera={{ center, zoom: 15, heading: 0, pitch: 0 }}
          toolbarEnabled={false}
          zoomControlEnabled
        >
          <Marker coordinate={destination} pinColor="#843D9B" title="Tailor shop" />
          {customerLocation ? (
            <Marker coordinate={customerLocation} anchor={{ x: 0.5, y: 0.5 }} title="Customer">
              <Box style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#2563EB', borderWidth: 3, borderColor: '#fff' }} />
            </Marker>
          ) : null}
        </MapView>

        {!customerLocation ? (
          <Box className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center">
            <I icon={Navigation} size={24} color="#9ca3af" className="mb-2" />
            <Txt className="text-sm font-black text-gray-600">Waiting for customer&apos;s GPS...</Txt>
            <Txt className="text-xs text-gray-500 mt-1">They will appear here once they start the trip</Txt>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default CustomerDropoffTracker;
