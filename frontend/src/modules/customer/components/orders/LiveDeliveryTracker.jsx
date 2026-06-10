import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Phone, Clock, MapPin, Navigation } from 'lucide-react';
import DeliveryBoyLiveMap from '../../../../shared/components/DeliveryBoyLiveMap';

const LiveDeliveryTracker = ({ order, socket }) => {
  const [riderLocation, setRiderLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      if (data.orderId === order._id || data.orderId === order.id) {
        setRiderLocation({ lat: data.currentLocation.latitude, lng: data.currentLocation.longitude });
        setLastUpdated(data.timestamp || new Date());
        if (data.eta) setEta(data.eta);
        if (data.distanceRemaining) setDistance(data.distanceRemaining);
      }
    };

    socket.on('locationUpdated', handleLocationUpdate);

    return () => {
      socket.off('locationUpdated', handleLocationUpdate);
    };
  }, [socket, order]);

  // Determine Destination based on Order phase
  const isPickupPhase = ['fabric-ready-for-pickup', 'fabric-picked-up'].includes(order.status) || 
                        ['assigned', 'accepted', 'reached-pickup', 'picked-up'].includes(order.pickupDeliveryStatus);

  const destinationCoords = isPickupPhase 
    ? order.pickupLocation?.coordinates || order.deliveryAddress?.location?.coordinates
    : order.dropoffLocation?.coordinates || order.deliveryAddress?.location?.coordinates;

  let destination = null;
  if (Array.isArray(destinationCoords) && destinationCoords.length === 2) {
    destination = { lat: destinationCoords[1], lng: destinationCoords[0] };
  }

  const rider = isPickupPhase ? order.pickupPartner : order.deliveryPartner;

  if (!rider) return null; // No rider assigned yet

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Navigation size={16} className="text-[#2D2F6E]" />
        Live Tracking
      </h3>

      {/* Map Section */}
      <div className="w-full h-64 rounded-xl overflow-hidden relative border border-gray-100">
        <DeliveryBoyLiveMap 
          currentLocation={riderLocation}
          destination={destination}
          isLoaded={isLoaded}
          height="100%"
        />
        
        {/* Distance/ETA Overlay */}
        {(distance || eta) && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100/50 flex gap-4">
            {distance && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                <span className="text-xs font-bold text-gray-800">{(distance / 1000).toFixed(1)} km</span>
              </div>
            )}
            {eta && (
              <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                <Clock size={14} className="text-primary" />
                <span className="text-xs font-bold text-gray-800">{eta}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rider Info Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2D2F6E]/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#2D2F6E]">{rider.name?.charAt(0) || 'R'}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{rider.name || 'Delivery Partner'}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                {rider.vehicleNumber || 'Vehicle'}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                ★ {rider.rating || '4.5'}
              </span>
            </div>
          </div>
        </div>
        
        <a 
          href={`tel:${rider.phoneNumber || rider.phone}`}
          className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 hover:text-green-700 transition-colors shadow-sm"
        >
          <Phone size={18} fill="currentColor" />
        </a>
      </div>
      
      {lastUpdated && (
        <p className="text-[10px] text-center text-gray-400 font-medium pt-2">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LiveDeliveryTracker;
