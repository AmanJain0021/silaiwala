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
  destinationAddress, // Added to support string addresses
  isLoaded,
  height = '400px',
  onRouteCalculated
}) => {
  const [directions, setDirections] = useState(null);
  const [routeEndLocation, setRouteEndLocation] = useState(null);

  const activeLocation = currentLocation || riderLocation;

  useEffect(() => {
    // We need activeLocation, and EITHER destination coordinates OR a destination address
    if (activeLocation?.lat && activeLocation?.lng && (destinationAddress || (destination?.lat && destination?.lng)) && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      // Use coordinates if provided, otherwise fallback to string address
      const routeDestination = (destination?.lat && destination?.lng)
          ? { lat: Number(destination.lat), lng: Number(destination.lng) }
          : destinationAddress;

      directionsService.route(
        {
          origin: { lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) },
          destination: routeDestination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            if (result.routes[0]?.legs[0]) {
              const leg = result.routes[0].legs[0];
              // Save the geocoded end location for the marker
              setRouteEndLocation({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });
              
              if (onRouteCalculated) {
                onRouteCalculated({
                  distance: leg.distance.text,
                  duration: leg.duration.text,
                  distanceValue: leg.distance.value // in meters
                });
              }
            }
          } else {
            console.error('Error fetching directions:', status, result);
            // If route calculation fails (e.g., address not found), pass a fallback so UI doesn't get stuck
            if (onRouteCalculated) {
              onRouteCalculated({
                distance: 'Unknown',
                duration: 'Unknown',
                distanceValue: -1 // use -1 to indicate error
              });
            }
          }
        }
      );
    }
  }, [activeLocation?.lat, activeLocation?.lng, destination?.lat, destination?.lng, destinationAddress, isLoaded]);

  if (!isLoaded) {
    return (
      <div style={{ height }} className="bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-xs text-slate-400 font-bold">Loading Map...</p>
      </div>
    );
  }

  const center = activeLocation?.lat ? activeLocation : (destination?.lat ? { lat: Number(destination.lat), lng: Number(destination.lng) } : defaultCenter);
  
  // Use the actual geocoded route end location, or fallback to the provided coordinates
  const markerDest = routeEndLocation || (destination?.lat ? { lat: Number(destination.lat), lng: Number(destination.lng) } : null);

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
        {markerDest && (
          <Marker
            position={markerDest}
            label={{ text: '📍', fontSize: '24px' }}
          />
        )}

        {/* Delivery Partner Marker (Bike Icon) */}
        {activeLocation?.lat && (
          <Marker
            position={{ lat: Number(activeLocation.lat), lng: Number(activeLocation.lng) }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Motorcycle/scooter delivery icon
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
