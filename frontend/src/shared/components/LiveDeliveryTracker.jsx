import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Phone, Clock, MapPin, Navigation, Bike, Loader2 } from 'lucide-react';
import DeliveryBoyLiveMap from './DeliveryBoyLiveMap';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const LiveDeliveryTracker = ({ order, socket, forceSearching = false }) => {
  const [riderLocation, setRiderLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
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

    const handleDeliveryCompleted = (data) => {
      if (data.orderId === order._id || data.orderId === order.id) {
        setIsCompleted(true);
      }
    };

    socket.on('locationUpdated', handleLocationUpdate);
    socket.on('delivery_completed', handleDeliveryCompleted);

    return () => {
      socket.off('locationUpdated', handleLocationUpdate);
      socket.off('delivery_completed', handleDeliveryCompleted);
    };
  }, [socket, order]);

  // Determine Destination based on Order phase
  const isDropoffPhase = ['ready', 'ready-for-delivery', 'ready-for-pickup', 'out-for-delivery', 'delivered'].includes(order.status);
  const isPickupPhase = !isDropoffPhase && (['fabric-ready-for-pickup', 'fabric-picked-up', 'pickup-assigned'].includes(order.status) || 
                        ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus));

  const isTailorDelivery = order.deliveryMethod === 'tailor';

  let destination = null;
  if (isPickupPhase && order.vendorLatitude && order.vendorLongitude) {
    destination = { lat: Number(order.vendorLatitude), lng: Number(order.vendorLongitude) };
  } else if (!isPickupPhase && order.customerLatitude && order.customerLongitude) {
    destination = { lat: Number(order.customerLatitude), lng: Number(order.customerLongitude) };
  }

  const rider = isTailorDelivery 
    ? order.tailor 
    : (isPickupPhase ? order.pickupPartner : (order.dropoffPartner || order.deliveryPartner));
  const riderStatus = isTailorDelivery 
    ? 'accepted' 
    : (isPickupPhase ? order.pickupDeliveryStatus : order.dropoffDeliveryStatus);

  console.log("LiveDeliveryTracker rider logic:", {
    isPickupPhase,
    isTailorDelivery,
    status: order.status,
    pickupDeliveryStatus: order.pickupDeliveryStatus,
    dropoffDeliveryStatus: order.dropoffDeliveryStatus,
    pickupPartner: order.pickupPartner,
    dropoffPartner: order.dropoffPartner,
    deliveryPartner: order.deliveryPartner,
    rider,
    riderStatus,
    forceSearching
  });

  const isCustomerDelivering = order.fabricDeliveryPreference === 'customer' && order.status === 'accepted';

  // If order is completed or delivered, hide the live map tracking
  if (isCompleted || ['delivered', 'product-delivered', 'order-completed'].includes(order.status)) {
    return null;
  }

  // Show searching animation only when rider is assigned but hasn't accepted yet, or forced searching
  const isSearching = !isTailorDelivery && (forceSearching || riderStatus === 'assigned' || riderStatus === 'pending' || (!riderStatus && !isCustomerDelivering));

  // If no rider is assigned at all AND we are not searching AND it's not customer self-delivering — don't render anything
  if (!rider && !isSearching && !isCustomerDelivering) return null;

  if (isSearching && !isCustomerDelivering) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
        {/* Radar/Pulse circles in background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-40 h-40 bg-indigo-50/40 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
          <div className="absolute w-24 h-24 bg-indigo-50/60 rounded-full animate-ping opacity-50" style={{ animationDuration: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-[#4f46e5] rounded-full flex items-center justify-center shadow-lg relative z-20">
            <Bike className="text-white w-8 h-8 animate-bounce" />
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow border border-gray-100">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 tracking-tight">Searching for Delivery Partner</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
              {isPickupPhase 
                ? "Assigning the nearest partner to pick up your fabric from your address." 
                : "Assigning the nearest partner to deliver your finished garment."
              }
            </p>
          </div>

          {/* Premium loading bar */}
          <div className="w-full max-w-[180px] h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-primary to-[#4f46e5] rounded-full animate-[loading-slide_1.5s_infinite_ease-in-out]" />
          </div>
        </div>

        {/* Custom CSS Animation for loading slider */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading-slide {
            0% { left: -30%; width: 30%; }
            50% { left: 35%; width: 40%; }
            100% { left: 100%; width: 30%; }

          }
          .animate-\\[loading-slide_1\\.5s_infinite_ease-in-out\\] {
            animation: loading-slide 1.5s infinite ease-in-out;
          }
        `}} />
      </div>
    );
  }

  if (isCustomerDelivering && !riderLocation) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <Navigation className="text-white w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 tracking-tight">Waiting for Customer</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
            The customer has opted to deliver the fabric themselves. Waiting for them to start their journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Navigation size={16} className="text-[#843D9B]" />
        {isCustomerDelivering ? 'Customer Live Tracking' : 'Live Tracking'}
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
                <span className="text-xs font-bold text-gray-800">{typeof distance === 'number' ? (distance / 1000).toFixed(1) + ' km' : distance}</span>
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
          <div className="w-12 h-12 bg-[#843D9B]/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#843D9B]">
              {isCustomerDelivering 
                ? (order.customer?.name?.charAt(0) || 'C') 
                : (isTailorDelivery ? (order.tailor?.shopName?.charAt(0) || order.tailor?.name?.charAt(0) || 'T') : (rider?.name?.charAt(0) || 'R'))}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {isCustomerDelivering 
                ? (order.customer?.name || 'Customer') 
                : (isTailorDelivery ? (order.tailor?.shopName || order.tailor?.name || 'Artisan Tailor') : (rider?.name || 'Delivery Partner'))}
            </h4>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                {isCustomerDelivering 
                  ? 'Self Delivery' 
                  : (isTailorDelivery ? 'Tailor Delivering' : (rider?.vehicleNumber || 'Vehicle'))}
              </span>
              {!isCustomerDelivering && !isTailorDelivery && (
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                  ★ {rider?.rating || '4.5'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {(!isCustomerDelivering || order.customer?.phoneNumber) && (
          <a 
            href={`tel:${isCustomerDelivering ? order.customer?.phoneNumber : (rider?.phoneNumber || rider?.phone)}`}
            className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 hover:text-green-700 transition-colors shadow-sm"
          >
            <Phone size={18} fill="currentColor" />
          </a>
        )}
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
