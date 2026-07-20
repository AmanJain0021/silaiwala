import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

const requestRoute = (directionsService, request) =>
  new Promise((resolve) => {
    const tryModes = [
      window.google.maps.TravelMode.TWO_WHEELER,
      window.google.maps.TravelMode.DRIVING,
    ].filter(Boolean);

    const attempt = (index) => {
      if (index >= tryModes.length) {
        resolve({ ok: false, status: 'NO_MODE' });
        return;
      }
      directionsService.route(
        { ...request, travelMode: tryModes[index] },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve({ ok: true, result, status });
          } else {
            attempt(index + 1);
          }
        }
      );
    };
    attempt(0);
  });

/**
 * DeliveryBoyLiveMap - Shows the delivery boy's live location and route to destination
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
  onRouteCalculated,
}) => {
  const [directions, setDirections] = useState(null);
  const [previewDirections, setPreviewDirections] = useState(null);
  const [routeEndLocation, setRouteEndLocation] = useState(null);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  onRouteCalculatedRef.current = onRouteCalculated;

  const activeLocation = currentLocation?.lat
    ? currentLocation
    : riderLocation?.lat
      ? riderLocation
      : fallbackOrigin;

  const runNavRoute = useCallback(async () => {
    if (!isLoaded || !window.google?.maps?.DirectionsService) return;
    if (!activeLocation?.lat || !activeLocation?.lng) return;
    if (!destinationAddress && !(destination?.lat && destination?.lng)) return;

    const directionsService = new window.google.maps.DirectionsService();
    const routeDestination =
      destination?.lat && destination?.lng
        ? { lat: Number(destination.lat), lng: Number(destination.lng) }
        : destinationAddress;

    const { ok, result } = await requestRoute(directionsService, {
      origin: { lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) },
      destination: routeDestination,
    });

    if (ok && result?.routes?.[0]?.legs?.[0]) {
      setDirections(result);
      const leg = result.routes[0].legs[0];
      setRouteEndLocation({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });
      onRouteCalculatedRef.current?.({
        distance: leg.distance.text,
        duration: leg.duration.text,
        distanceValue: leg.distance.value,
      });
    } else {
      setDirections(null);
      onRouteCalculatedRef.current?.({ distance: 'Unknown', duration: 'Unknown', distanceValue: -1 });
    }
  }, [
    activeLocation?.lat,
    activeLocation?.lng,
    destination?.lat,
    destination?.lng,
    destinationAddress,
    isLoaded,
  ]);

  useEffect(() => {
    runNavRoute();
  }, [runNavRoute]);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.DirectionsService || !previewRoute) {
      setPreviewDirections(null);
      return;
    }

    const { origin, destination: dest, originAddress, destAddress } = previewRoute;
    const hasOrigin = (origin?.lat && origin?.lng) || originAddress;
    const hasDest = (dest?.lat && dest?.lng) || destAddress;
    if (!hasOrigin || !hasDest) return;

    const directionsService = new window.google.maps.DirectionsService();
    const o = origin?.lat && origin?.lng ? { lat: Number(origin.lat), lng: Number(origin.lng) } : originAddress;
    const d = dest?.lat && dest?.lng ? { lat: Number(dest.lat), lng: Number(dest.lng) } : destAddress;

    requestRoute(directionsService, { origin: o, destination: d }).then(({ ok, result }) => {
      if (ok) setPreviewDirections(result);
    });
  }, [
    isLoaded,
    previewRoute?.origin?.lat,
    previewRoute?.origin?.lng,
    previewRoute?.destination?.lat,
    previewRoute?.destination?.lng,
    previewRoute?.originAddress,
    previewRoute?.destAddress,
  ]);

  if (!isLoaded) {
    return (
      <div style={{ height }} className="bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-xs text-slate-400 font-bold">Loading Map...</p>
      </div>
    );
  }

  const center = activeLocation?.lat
    ? activeLocation
    : destination?.lat
      ? { lat: Number(destination.lat), lng: Number(destination.lng) }
      : defaultCenter;

  const markerDest =
    routeEndLocation ||
    (destination?.lat ? { lat: Number(destination.lat), lng: Number(destination.lng) } : null);

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-slate-100 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {previewDirections && (
          <DirectionsRenderer
            directions={previewDirections}
            options={{
              suppressMarkers: true,
              preserveViewport: !directions,
              polylineOptions: {
                strokeColor: '#94A3B8',
                strokeWeight: 4,
                strokeOpacity: 0.45,
              },
            }}
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#2563EB',
                strokeWeight: 5,
                strokeOpacity: 0.85,
              },
            }}
          />
        )}

        {markerDest && (
          <Marker position={markerDest} label={{ text: '📍', fontSize: '24px' }} />
        )}

        {activeLocation?.lat && (
          <Marker
            position={{ lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
              scaledSize: window.google ? new window.google.maps.Size(40, 40) : null,
              anchor: window.google ? new window.google.maps.Point(20, 20) : null,
            }}
            zIndex={100}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default DeliveryBoyLiveMap;
