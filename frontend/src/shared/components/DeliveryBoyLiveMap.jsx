import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

/**
 * DeliveryBoyLiveMap - Shows the delivery boy's live location and route to destination
 */
const DeliveryBoyLiveMap = ({
  currentLocation,
  riderLocation, // keeping for backwards compatibility if passed
  destination,
  isLoaded,
  height = '400px',
  onRouteCalculated
}) => {
  const [directions, setDirections] = useState(null);

  const activeLocation = currentLocation || riderLocation;

  useEffect(() => {
    if (activeLocation?.lat && activeLocation?.lng && destination?.lat && destination?.lng && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) },
          destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            if (onRouteCalculated && result.routes[0]?.legs[0]) {
              onRouteCalculated({
                distance: result.routes[0].legs[0].distance.text,
                duration: result.routes[0].legs[0].duration.text,
                distanceValue: result.routes[0].legs[0].distance.value // in meters
              });
            }
          } else {
            console.error('Error fetching directions:', result);
          }
        }
      );
    }
  }, [activeLocation?.lat, activeLocation?.lng, destination?.lat, destination?.lng]);

  if (!isLoaded) {
    return (
      <div style={{ height }} className="bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-xs text-slate-400 font-bold">Loading Map...</p>
      </div>
    );
  }

  const center = activeLocation?.lat ? activeLocation : defaultCenter;

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-slate-100 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#2563EB', // Blue line
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
        
        {/* Destination Marker */}
        {destination?.lat && (
          <Marker
            position={{ lat: Number(destination.lat), lng: Number(destination.lng) }}
            label={{ text: '📍', fontSize: '24px' }}
          />
        )}

        {/* Delivery Partner Marker (Bike Icon) */}
        {activeLocation?.lat && (
          <Marker
            position={{ lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Custom bike icon
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
