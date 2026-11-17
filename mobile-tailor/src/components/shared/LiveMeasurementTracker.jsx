// Port of shared/components/LiveMeasurementTracker.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../lib/nav';
import { Linking } from 'react-native';
import { GOOGLE_MAPS_API_KEY, API_URL } from '../../lib/config';
import React, { useState, useEffect, useMemo } from "react";
import { Phone, Calendar, Ruler, User, Navigation, Clock, MapPin, CheckCircle2 } from "lucide-react-native";
import DeliveryBoyLiveMap from "./DeliveryBoyLiveMap";
import { Box, Txt, I, Img, Btn, Scroll } from '../ui/primitives';
const toCoord = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln) || la === 0 && ln === 0) return null;
  return {
    lat: la,
    lng: ln
  };
};
const LiveMeasurementTracker = ({
  order,
  socket
}) => {
  const navigate = useNavigate();
  const mReq = order?.measurementRequestInfo;
  const execUser = order?.measurementExecutive || mReq?.executive;
  const [execLocation, setExecLocation] = useState(() => {
    if (mReq?.executiveLocation?.latitude && mReq?.executiveLocation?.longitude) {
      return {
        lat: Number(mReq.executiveLocation.latitude),
        lng: Number(mReq.executiveLocation.longitude)
      };
    }
    return null;
  });
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const isLoaded = true;
  const loadError = null;
  useEffect(() => {
    if (!socket || !order) return;
    const handleLocationUpdate = data => {
      const oid = order._id || order.id;
      if (String(data.orderId) === String(oid)) {
        if (data.currentLocation?.latitude && data.currentLocation?.longitude) {
          setExecLocation({
            lat: Number(data.currentLocation.latitude),
            lng: Number(data.currentLocation.longitude)
          });
        }
        if (data.eta) setEta(data.eta);
        if (data.distanceRemaining != null) setDistance(data.distanceRemaining);
      }
    };
    socket.on('locationUpdated', handleLocationUpdate);
    return () => {
      socket.off('locationUpdated', handleLocationUpdate);
    };
  }, [socket, order]);

  // Destination (Customer Home Address Coordinates)
  const customerCoords = useMemo(() => {
    return toCoord(order.customerLatitude, order.customerLongitude) || toCoord(order.deliveryAddress?.location?.coordinates?.[1], order.deliveryAddress?.location?.coordinates?.[0]) || toCoord(mReq?.customerLocation?.coordinates?.[1], mReq?.customerLocation?.coordinates?.[0]) || toCoord(order.latitude, order.longitude);
  }, [order, mReq]);
  const customerAddr = useMemo(() => {
    return order.deliveryAddress?.street || [order.deliveryAddress?.city, order.deliveryAddress?.state].filter(Boolean).join(', ') || order.address || `${mReq?.customerAddress?.street || ''}, ${mReq?.customerAddress?.city || ''}`;
  }, [order, mReq]);
  if (!order.isMeasurementHome || !execUser) {
    return null;
  }

  // Fallback origin if GPS is not yet received
  const fallbackExecOrigin = execLocation || (customerCoords ? {
    lat: customerCoords.lat + 0.015,
    lng: customerCoords.lng + 0.015
  } : {
    lat: 28.6139,
    lng: 77.2090
  });
  return <Box className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <Box className="flex items-center justify-between border-b border-gray-100 pb-3">
        <Txt className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 flex items-center gap-1.5">
          <Txt className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          Measurement Executive On The Way
        </Txt>
        <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Home Visit
        </Txt>
      </Box>

      {/* Scheduled slot pill if available */}
      {(order.scheduledDate || order.scheduledTimeSlot) && <Box className="flex items-center gap-2 p-2.5 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs font-semibold text-gray-800">
          <I icon={Calendar} size={14} className="text-[#843D9B] shrink-0" />
          <Txt>
            Scheduled Slot: <Txt className="text-[#843D9B] font-bold">{order.scheduledDate || 'Today'}</Txt>
            {order.scheduledTimeSlot && order.scheduledTimeSlot !== 'ASAP' && ` (${order.scheduledTimeSlot})`}
            {order.scheduledTimeSlot === 'ASAP' && ' (ASAP)'}
          </Txt>
        </Box>}

      {/* Live Map with Real Driving Polyline */}
      <Box className="w-full h-72 rounded-2xl overflow-hidden relative border border-gray-100 shadow-inner">
        <DeliveryBoyLiveMap currentLocation={execLocation} fallbackOrigin={fallbackExecOrigin} destination={customerCoords} destinationAddress={customerAddr} isLoaded={isLoaded} height="100%" trackingType="measurement" onRouteCalculated={data => {
        if (data?.distanceValue !== -1) {
          if (data.distance) setDistance(data.distance);
          if (data.duration) setEta(data.duration);
        }
      }} />
      </Box>

      {/* Executive Contact & Profile Card */}
      <Box className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
        <Box className="flex items-center gap-3 min-w-0">
          <Box className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#843D9B] font-black text-xl overflow-hidden shrink-0 shadow-sm">
            {execUser?.profileImage ? <Img src={execUser.profileImage.startsWith('http') ? execUser.profileImage : `${API_URL || ''}${execUser.profileImage}`} alt="Executive" className="w-full h-full object-cover" /> : <I icon={User} size={22} className="text-[#843D9B]" />}
          </Box>

          <Box className="min-w-0">
            <Txt className="text-sm font-black text-gray-900 truncate">
              {execUser?.name || 'Measurement Executive'}
            </Txt>
            <Txt className="text-[11px] text-gray-500 font-medium">Custom Tailoring Specialist</Txt>
          </Box>
        </Box>

        {execUser?.phoneNumber && <Btn onPress={() => Linking.openURL(`tel:${execUser.phoneNumber}`)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#843D9B] hover:bg-[#723287] px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 no-underline shrink-0">
            <I icon={Phone} size={13} />
            <Txt>Call</Txt>
          </Btn>}
      </Box>
    </Box>;
};
export default LiveMeasurementTracker;
