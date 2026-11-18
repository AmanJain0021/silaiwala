// Port of shared/components/TrackingMap.jsx: Google Maps JS -> react-native-maps (Google provider).
// Same behaviour: rider / vendor / customer markers (emoji labels), a driving route from the rider to the
// vendor (pickup phase) or the customer (delivery phase), route shadow + brand line, fit to all points.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getDirections } from '../../lib/directions';
import { Box, Txt } from '../ui/primitives';

const DEFAULT_CENTER = { latitude: 28.6139, longitude: 77.209 }; // Delhi
const HIDE_POI = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
const toLL = (p) => (p?.lat != null && p?.lng != null ? { latitude: Number(p.lat), longitude: Number(p.lng) } : null);
const toPx = (h) => (typeof h === 'number' ? h : /^\d+px$/.test(String(h)) ? parseInt(h, 10) : undefined);

const EmojiPin = ({ coordinate, emoji, size }) => (
  <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
    <View><Text style={{ fontSize: size }}>{emoji}</Text></View>
  </Marker>
);

const TrackingMap = ({ riderLocation, vendorLocation, customerLocation, isLoaded = true, height = '300px', zoom = 14, rounded = true, status }) => {
  const [route, setRoute] = useState(null);
  const mapRef = useRef(null);
  const rider = toLL(riderLocation);
  const vendor = toLL(vendorLocation);
  const customer = toLL(customerLocation);

  useEffect(() => {
    let cancelled = false;
    const isDeliveryPhase = ['picked_up', 'picked-up', 'out_for_delivery', 'out-for-delivery'].includes(status);
    let origin = null;
    let destination = null;
    if (riderLocation?.lat) {
      origin = riderLocation;
      destination = isDeliveryPhase ? customerLocation : (vendorLocation || customerLocation);
    } else if (vendorLocation?.lat && customerLocation?.lat) {
      origin = vendorLocation;
      destination = customerLocation;
    }
    if (origin?.lat && destination?.lat) {
      getDirections({ lat: Number(origin.lat), lng: Number(origin.lng) }, { lat: Number(destination.lat), lng: Number(destination.lng) })
        .then((r) => { if (!cancelled) setRoute(r); });
    } else {
      setRoute(null);
    }
    return () => { cancelled = true; };
  }, [riderLocation?.lat, riderLocation?.lng, vendorLocation?.lat, customerLocation?.lat, status]);

  const fitPoints = useMemo(() => {
    if (route?.coords?.length) return route.coords;
    return [rider, vendor, customer].filter(Boolean);
  }, [route, rider?.latitude, rider?.longitude, vendor?.latitude, customer?.latitude]);

  useEffect(() => {
    if (!mapRef.current || fitPoints.length === 0) return;
    if (fitPoints.length === 1) {
      mapRef.current.animateCamera({ center: fitPoints[0], zoom }, { duration: 300 });
      return;
    }
    mapRef.current.fitToCoordinates(fitPoints, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
  }, [fitPoints, zoom]);

  const h = toPx(height);
  const wrapStyle = h ? { height: h } : { flex: 1 };
  if (!isLoaded) {
    return (
      <Box className={`bg-slate-100 flex items-center justify-center ${rounded ? 'rounded-2xl' : ''}`} style={wrapStyle}>
        <Txt className="text-xs text-slate-400 font-bold">Loading Map...</Txt>
      </Box>
    );
  }
  const center = rider || vendor || customer || DEFAULT_CENTER;
  return (
    <Box className={`overflow-hidden ${rounded ? 'rounded-2xl border border-slate-100' : 'h-full w-full'}`} style={wrapStyle}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialCamera={{ center, zoom, heading: 0, pitch: 0 }}
        customMapStyle={HIDE_POI}
        toolbarEnabled={false}
        zoomControlEnabled
      >
        {rider ? <EmojiPin coordinate={rider} emoji="🏍️" size={24} /> : null}
        {vendor ? <EmojiPin coordinate={vendor} emoji="🏪" size={20} /> : null}
        {customer ? <EmojiPin coordinate={customer} emoji="📍" size={20} /> : null}
        {route?.coords?.length ? <Polyline coordinates={route.coords} strokeColor="rgba(59,7,100,0.2)" strokeWidth={9} zIndex={1} /> : null}
        {route?.coords?.length ? <Polyline coordinates={route.coords} strokeColor="#843D9B" strokeWidth={5.5} zIndex={2} /> : null}
      </MapView>
    </Box>
  );
};

export default TrackingMap;
