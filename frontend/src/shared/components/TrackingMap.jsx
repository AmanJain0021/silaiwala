import React from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

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
}) => {
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
          <Marker
            position={riderLocation}
            label={{ text: '🛵', fontSize: '24px' }}
          />
        )}
        {vendorLocation?.lat && (
          <Marker
            position={vendorLocation}
            label={{ text: '🏪', fontSize: '20px' }}
          />
        )}
        {customerLocation?.lat && (
          <Marker
            position={customerLocation}
            label={{ text: '📍', fontSize: '20px' }}
          />
        )}
        {path.length >= 2 && (
          <Polyline
            path={path}
            options={{
              strokeColor: '#2D2F6E',
              strokeWeight: 3,
              strokeOpacity: 0.7,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default TrackingMap;
