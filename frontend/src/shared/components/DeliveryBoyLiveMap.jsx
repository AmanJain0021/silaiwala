import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { Navigation, Clock, MapPin, Loader2, Bike, Ruler } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

const toValidCoord = (loc) => {
  if (!loc) return null;
  const lat = Number(loc.lat ?? loc.latitude);
  const lng = Number(loc.lng ?? loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return null;
  }
  return { lat, lng };
};

const RIDER_BIKE_ICON = 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png';

const EXECUTIVE_MARKER_SVG = `data:image/svg+xml;utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#843D9B" fill-opacity="0.25"/>
  <circle cx="24" cy="24" r="16" fill="#843D9B" stroke="#FFFFFF" stroke-width="2.5"/>
  <path d="M18 24 L30 24 M21 21 L21 24 M24 20 L24 24 M27 21 L27 24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
</svg>
`)}`;

const DESTINATION_PIN_SVG = `data:image/svg+xml;utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 42 50">
  <defs>
    <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path d="M21 2 C11 2 3 10 3 20 C3 33 21 48 21 48 C21 48 39 33 39 20 C39 10 31 2 21 2 Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow)"/>
  <circle cx="21" cy="19" r="7" fill="#FFFFFF"/>
  <circle cx="21" cy="19" r="4" fill="#EF4444"/>
</svg>
`)}`;

/**
 * DeliveryBoyLiveMap - Renders true road-following Google Maps DRIVING route
 * (Zomato/Swiggy style) between active partner/executive and destination.
 */
const DeliveryBoyLiveMap = ({
  currentLocation,
  riderLocation,
  fallbackOrigin,
  destination,
  destinationAddress,
  previewRoute,
  isLoaded,
  height = '400px',
  trackingType = 'delivery', // 'delivery' | 'measurement'
  onRouteCalculated,
}) => {
  const [directions, setDirections] = useState(null);
  const [previewDirections, setPreviewDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeEndLocation, setRouteEndLocation] = useState(null);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  onRouteCalculatedRef.current = onRouteCalculated;
  const mapRef = useRef(null);

  // Normalize origin location
  const rawOrigin = currentLocation?.lat || currentLocation?.latitude
    ? currentLocation
    : riderLocation?.lat || riderLocation?.latitude
      ? riderLocation
      : fallbackOrigin;

  const activeOrigin = toValidCoord(rawOrigin);
  const activeDest = toValidCoord(destination);

  const runNavRoute = useCallback(async () => {
    if (!isLoaded || !window.google?.maps?.DirectionsService) return;
    if (!activeOrigin) return;
    if (!activeDest && !destinationAddress) return;

    setIsCalculatingRoute(true);
    const directionsService = new window.google.maps.DirectionsService();
    const routeDestination = activeDest
      ? { lat: activeDest.lat, lng: activeDest.lng }
      : destinationAddress;

    try {
      directionsService.route(
        {
          origin: { lat: activeOrigin.lat, lng: activeOrigin.lng },
          destination: routeDestination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          setIsCalculatingRoute(false);
          if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
            setDirections(result);
            const leg = result.routes[0].legs[0];
            const endLoc = { lat: leg.end_location.lat(), lng: leg.end_location.lng() };
            setRouteEndLocation(endLoc);

            const info = {
              distance: leg.distance.text,
              duration: leg.duration.text,
              distanceValue: leg.distance.value,
            };
            setRouteInfo(info);
            onRouteCalculatedRef.current?.(info);
          } else {
            console.warn('Driving directions could not be calculated:', status);
            // Do not render hawa-mai straight line; keep clean map with markers
            setDirections(null);
            onRouteCalculatedRef.current?.({ distance: 'Calculating...', duration: '', distanceValue: -1 });
          }
        }
      );
    } catch (err) {
      console.error('DirectionsService error:', err);
      setIsCalculatingRoute(false);
    }
  }, [
    activeOrigin?.lat,
    activeOrigin?.lng,
    activeDest?.lat,
    activeDest?.lng,
    destinationAddress,
    isLoaded,
  ]);

  useEffect(() => {
    runNavRoute();
  }, [runNavRoute]);

  // Preview route for prior stages (if supplied)
  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.DirectionsService || !previewRoute) {
      setPreviewDirections(null);
      return;
    }

    const { origin, destination: dest, originAddress, destAddress } = previewRoute;
    const o = toValidCoord(origin) || originAddress;
    const d = toValidCoord(dest) || destAddress;
    if (!o || !d) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: o,
        destination: d,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setPreviewDirections(result);
        }
      }
    );
  }, [isLoaded, previewRoute]);

  const markerDest = routeEndLocation || activeDest;

  // Fit bounds cleanly with comfortable padding
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    if (directions?.routes?.[0]?.bounds) {
      mapRef.current.fitBounds(directions.routes[0].bounds, {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
      });
      return;
    }

    if (previewDirections?.routes?.[0]?.bounds) {
      mapRef.current.fitBounds(previewDirections.routes[0].bounds, {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
      });
      return;
    }

    if (activeOrigin && markerDest) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: activeOrigin.lat, lng: activeOrigin.lng });
      bounds.extend({ lat: markerDest.lat, lng: markerDest.lng });
      mapRef.current.fitBounds(bounds, {
        top: 70,
        bottom: 70,
        left: 70,
        right: 70,
      });
    }
  }, [directions, previewDirections, activeOrigin?.lat, activeOrigin?.lng, markerDest?.lat, markerDest?.lng]);

  if (!isLoaded) {
    return (
      <div style={{ height }} className="bg-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
        <Loader2 className="w-7 h-7 text-[#843D9B] animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Navigation Map...</p>
      </div>
    );
  }

  const center = activeOrigin || activeDest || defaultCenter;

  return (
    <div style={{ height }} className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative bg-slate-50">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={(map) => { mapRef.current = map; }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ lightness: 20 }]
            }
          ],
        }}
      >
        {/* Preview directions (grey subtle path) */}
        {previewDirections && (
          <DirectionsRenderer
            directions={previewDirections}
            options={{
              suppressMarkers: true,
              preserveViewport: !directions,
              polylineOptions: {
                strokeColor: '#94A3B8',
                strokeWeight: 4,
                strokeOpacity: 0.5,
              },
            }}
          />
        )}

        {/* Casing / Shadow line for active route (Zomato-style depth) */}
        {directions?.routes?.[0]?.overview_path && (
          <Polyline
            path={directions.routes[0].overview_path}
            options={{
              strokeColor: '#3B0764',
              strokeOpacity: 0.22,
              strokeWeight: 9,
              zIndex: 1,
            }}
          />
        )}

        {/* Primary Active Driving Polyline */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: false,
              polylineOptions: {
                strokeColor: '#843D9B',
                strokeWeight: 5.5,
                strokeOpacity: 1,
                zIndex: 2,
              },
            }}
          />
        )}

        {/* Destination Pin (Custom Styled) */}
        {markerDest && (
          <Marker
            position={markerDest}
            icon={window.google ? {
              url: DESTINATION_PIN_SVG,
              scaledSize: new window.google.maps.Size(36, 42),
              anchor: new window.google.maps.Point(18, 42),
            } : undefined}
            zIndex={50}
          />
        )}

        {/* Active Origin / Moving Partner Marker */}
        {activeOrigin && (
          <Marker
            position={activeOrigin}
            icon={window.google ? {
              url: trackingType === 'measurement' ? EXECUTIVE_MARKER_SVG : RIDER_BIKE_ICON,
              scaledSize: trackingType === 'measurement'
                ? new window.google.maps.Size(44, 44)
                : new window.google.maps.Size(38, 38),
              anchor: trackingType === 'measurement'
                ? new window.google.maps.Point(22, 22)
                : new window.google.maps.Point(19, 19),
            } : undefined}
            zIndex={100}
          />
        )}
      </GoogleMap>

      {/* Floating Zomato-Style Live Route Status Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-purple-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold">
            {trackingType === 'measurement' ? <Ruler size={15} /> : <Bike size={15} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-800">
                {trackingType === 'measurement' ? 'Executive Driving Route' : 'Live Delivery Route'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 leading-tight">
              {isCalculatingRoute
                ? 'Routing via road...'
                : routeInfo
                  ? `${routeInfo.duration} (${routeInfo.distance}) via fastest road`
                  : 'Fastest road navigation'}
            </p>
          </div>
        </div>

        {routeInfo?.duration && (
          <div className="bg-[#843D9B] text-white px-3 py-1.5 rounded-xl shadow-lg font-black text-xs flex items-center gap-1.5">
            <Clock size={13} />
            <span>{routeInfo.duration}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryBoyLiveMap;
