import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF, Polyline, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi

/**
 * TrackingMap - Shows rider, vendor, and customer locations on a Google Map
 */
const TrackingMap = ({
  riderLocation,
  vendorLocation,
  customerLocation,
  isLoaded,
  height = '300px',
  zoom = 14,
  rounded = true,
  status,
}) => {
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (isLoaded && window.google) {
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
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
            destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, reqStatus) => {
            if (reqStatus === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.warn('TrackingMap Directions error:', reqStatus);
              setDirections(null);
            }
          }
        );
      }
    }
  }, [riderLocation?.lat, riderLocation?.lng, vendorLocation?.lat, customerLocation?.lat, status, isLoaded]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (directions?.routes?.[0]?.bounds) {
      mapRef.current.fitBounds(directions.routes[0].bounds, {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      });
      return;
    }

    [riderLocation, vendorLocation, customerLocation].forEach((loc) => {
      if (loc?.lat && loc?.lng) {
        bounds.extend({ lat: Number(loc.lat), lng: Number(loc.lng) });
        hasPoints = true;
      }
    });

    if (hasPoints) {
      try {
        mapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      } catch {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [directions, riderLocation?.lat, riderLocation?.lng, vendorLocation?.lat, customerLocation?.lat]);

  if (!isLoaded) {
    return (
      <div style={{ height }} className={`bg-slate-100 flex items-center justify-center ${rounded ? 'rounded-2xl' : ''}`}>
        <p className="text-xs text-slate-400 font-bold">Loading Map...</p>
      </div>
    );
  }

  const center = riderLocation?.lat
    ? riderLocation
    : vendorLocation?.lat
      ? vendorLocation
      : customerLocation?.lat
        ? customerLocation
        : defaultCenter;

  const path = [
    vendorLocation?.lat ? vendorLocation : null,
    riderLocation?.lat ? riderLocation : null,
    customerLocation?.lat ? customerLocation : null,
  ].filter(Boolean);

  return (
    <div style={{ height }} className={`overflow-hidden ${rounded ? 'rounded-2xl border border-slate-100' : 'h-full w-full'}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={(map) => { mapRef.current = map; }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google ? window.google.maps.ControlPosition.LEFT_CENTER : 4,
          },
          padding: { top: 20, bottom: 280, left: 10, right: 10 },
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {riderLocation?.lat && (
          <MarkerF
            position={riderLocation}
            label={{ text: '🏍️', fontSize: '24px' }}
          />
        )}
        {vendorLocation?.lat && (
          <MarkerF
            position={vendorLocation}
            label={{ text: '🏪', fontSize: '20px' }}
          />
        )}
        {customerLocation?.lat && (
          <MarkerF
            position={customerLocation}
            label={{ text: '📍', fontSize: '20px' }}
          />
        )}
        {directions?.routes?.[0]?.overview_path && (
          <Polyline
            path={directions.routes[0].overview_path}
            options={{
              strokeColor: '#3B0764',
              strokeOpacity: 0.2,
              strokeWeight: 9,
              zIndex: 1,
            }}
          />
        )}
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
      </GoogleMap>
    </div>
  );
};

export default TrackingMap;
