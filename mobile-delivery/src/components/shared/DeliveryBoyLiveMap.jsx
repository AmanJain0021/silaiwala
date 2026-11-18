// Port of shared/components/DeliveryBoyLiveMap.jsx — react-native-maps + Directions REST (road route, markers, status bar)
import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';
import { Clock, Ruler, Bike } from 'lucide-react-native';
import { getDirections } from '../../lib/directions';
import { Box, Txt, I, Img } from '../ui/primitives';
import Spin from '../ui/Spin';

const defaultCenter = { lat: 28.6139, lng: 77.209 };
const RIDER_BIKE_ICON = 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png';
const MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] },
];

export const toValidCoord = (loc) => {
  if (!loc) return null;
  const lat = Number(loc.lat ?? loc.latitude);
  const lng = Number(loc.lng ?? loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
};
const ll = (c) => ({ latitude: c.lat, longitude: c.lng });

export const DestinationPin = () => (
  <Svg width={36} height={42} viewBox="0 0 42 50">
    <Path d="M21 2 C11 2 3 10 3 20 C3 33 21 48 21 48 C21 48 39 33 39 20 C39 10 31 2 21 2 Z" fill="#EF4444" stroke="#FFFFFF" strokeWidth={2.5} />
    <Circle cx="21" cy="19" r="7" fill="#FFFFFF" />
    <Circle cx="21" cy="19" r="4" fill="#EF4444" />
  </Svg>
);
export const ExecutiveMarker = () => (
  <Svg width={44} height={44} viewBox="0 0 48 48">
    <Circle cx="24" cy="24" r="22" fill="#843D9B" fillOpacity={0.25} />
    <Circle cx="24" cy="24" r="16" fill="#843D9B" stroke="#FFFFFF" strokeWidth={2.5} />
    <Path d="M18 24 L30 24 M21 21 L21 24 M24 20 L24 24 M27 21 L27 24" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const Pulse = () => {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 0.4, duration: 800, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true })]));
    l.start();
    return () => l.stop();
  }, [v]);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', opacity: v }} />;
};

const DeliveryBoyLiveMap = ({ currentLocation, riderLocation, fallbackOrigin, destination, destinationAddress, previewRoute, isLoaded = true, height = 400, trackingType = 'delivery', onRouteCalculated }) => {
  const [route, setRoute] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const mapRef = useRef(null);
  const cbRef = useRef(onRouteCalculated);
  cbRef.current = onRouteCalculated;

  const rawOrigin = currentLocation?.lat || currentLocation?.latitude ? currentLocation : riderLocation?.lat || riderLocation?.latitude ? riderLocation : fallbackOrigin;
  const activeOrigin = toValidCoord(rawOrigin);
  const activeDest = toValidCoord(destination);

  useEffect(() => {
    let alive = true;
    if (!activeOrigin || (!activeDest && !destinationAddress)) return undefined;
    setIsCalculatingRoute(true);
    getDirections(activeOrigin, activeDest || destinationAddress).then((r) => {
      if (!alive) return;
      setIsCalculatingRoute(false);
      setRoute(r);
      cbRef.current?.(r ? { distance: r.distance, duration: r.duration, distanceValue: r.distanceValue } : { distance: 'Calculating...', duration: '', distanceValue: -1 });
    });
    return () => { alive = false; };
  }, [activeOrigin?.lat, activeOrigin?.lng, activeDest?.lat, activeDest?.lng, destinationAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    if (!previewRoute) { setPreview(null); return undefined; }
    const o = toValidCoord(previewRoute.origin) || previewRoute.originAddress;
    const d = toValidCoord(previewRoute.destination) || previewRoute.destAddress;
    if (!o || !d) return undefined;
    getDirections(o, d).then((r) => { if (alive) setPreview(r); });
    return () => { alive = false; };
  }, [previewRoute]);

  const markerDest = route?.endLocation || activeDest;

  useEffect(() => {
    const pts = route?.coords?.length ? route.coords : preview?.coords?.length ? preview.coords : [activeOrigin, markerDest].filter(Boolean).map(ll);
    if (!mapRef.current || pts.length < 2) return;
    mapRef.current.fitToCoordinates(pts, { edgePadding: { top: 70, bottom: 70, left: 70, right: 70 }, animated: true });
  }, [route, preview, activeOrigin?.lat, activeOrigin?.lng, markerDest?.lat, markerDest?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = typeof height === 'string' ? parseInt(height, 10) || 400 : height;
  if (!isLoaded) {
    return (
      <Box style={{ height: h }} className="bg-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
        <Spin size={28} color="#843D9B" />
        <Txt className="text-xs font-bold text-slate-500">Loading Navigation Map...</Txt>
      </Box>
    );
  }
  const center = activeOrigin || activeDest || defaultCenter;

  return (
    <Box style={{ height: h }} className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative bg-slate-50">
      <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={{ flex: 1 }} customMapStyle={MAP_STYLE} toolbarEnabled={false} zoomControlEnabled
        initialRegion={{ ...ll(center), latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
        {preview?.coords && <Polyline coordinates={preview.coords} strokeColor="rgba(148,163,184,0.5)" strokeWidth={4} />}
        {route?.coords && <Polyline coordinates={route.coords} strokeColor="rgba(59,7,100,0.22)" strokeWidth={9} zIndex={1} />}
        {route?.coords && <Polyline coordinates={route.coords} strokeColor="#843D9B" strokeWidth={5.5} zIndex={2} />}
        {markerDest && (
          <Marker coordinate={ll(markerDest)} anchor={{ x: 0.5, y: 1 }} zIndex={50} tracksViewChanges={false}>
            <DestinationPin />
          </Marker>
        )}
        {activeOrigin && (
          <Marker coordinate={ll(activeOrigin)} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
            {trackingType === 'measurement' ? <ExecutiveMarker /> : <Img src={RIDER_BIKE_ICON} style={{ width: 38, height: 38 }} contentFit="contain" />}
          </Marker>
        )}
      </MapView>
      <View pointerEvents="none" style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
        <Box className="flex items-center justify-between">
          <Box className="bg-white/95 px-3.5 py-2 rounded-2xl shadow-lg border border-purple-100 flex items-center gap-2.5 flex-shrink">
            <Box className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center">
              <I icon={trackingType === 'measurement' ? Ruler : Bike} size={15} color="#843D9B" />
            </Box>
            <Box className="flex-shrink">
              <Box className="flex items-center gap-1.5">
                <Pulse />
                <Txt className="text-[10px] font-black uppercase tracking-wider text-gray-800">{trackingType === 'measurement' ? 'Executive Driving Route' : 'Live Delivery Route'}</Txt>
              </Box>
              <Txt className="text-[11px] font-semibold text-gray-500 leading-tight">
                {isCalculatingRoute ? 'Routing via road...' : route ? `${route.duration} (${route.distance}) via fastest road` : 'Fastest road navigation'}
              </Txt>
            </Box>
          </Box>
          {!!route?.duration && (
            <Box className="bg-[#843D9B] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
              <I icon={Clock} size={13} color="#fff" />
              <Txt className="text-white font-black text-xs">{route.duration}</Txt>
            </Box>
          )}
        </Box>
      </View>
    </Box>
  );
};

export default DeliveryBoyLiveMap;
