import React, { useState, useEffect, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Phone, Clock, MapPin, Navigation, Bike, Loader2 } from 'lucide-react';
import DeliveryBoyLiveMap from './DeliveryBoyLiveMap';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const toCoord = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln) || la === 0 || ln === 0) return null;
  return { lat: la, lng: ln };
};

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
    if (!socket || !order) return;

    const handleLocationUpdate = (data) => {
      const oid = order._id || order.id;
      if (String(data.orderId) === String(oid)) {
        setRiderLocation({
          lat: data.currentLocation.latitude,
          lng: data.currentLocation.longitude,
        });
        setLastUpdated(data.timestamp || new Date());
        if (data.eta) setEta(data.eta);
        if (data.distanceRemaining != null) setDistance(data.distanceRemaining);
      }
    };

    const handleDeliveryCompleted = (data) => {
      const oid = order._id || order.id;
      if (String(data.orderId) === String(oid)) setIsCompleted(true);
    };

    socket.on('locationUpdated', handleLocationUpdate);
    socket.on('delivery_completed', handleDeliveryCompleted);

    return () => {
      socket.off('locationUpdated', handleLocationUpdate);
      socket.off('delivery_completed', handleDeliveryCompleted);
    };
  }, [socket, order]);

  const { customer, tailor, destination, fallbackOrigin, destinationAddress, journeyLabel } = useMemo(() => {
    const customerCoords =
      toCoord(order.customerLatitude, order.customerLongitude) ||
      toCoord(
        order.deliveryAddress?.location?.coordinates?.[1],
        order.deliveryAddress?.location?.coordinates?.[0]
      ) ||
      toCoord(order.latitude, order.longitude);

    const tailorCoords =
      toCoord(order.vendorLatitude, order.vendorLongitude) ||
      toCoord(order.tailor?.location?.coordinates?.[1], order.tailor?.location?.coordinates?.[0]);

    const customerAddr =
      order.deliveryAddress?.street ||
      [order.deliveryAddress?.city, order.deliveryAddress?.state].filter(Boolean).join(', ') ||
      order.address ||
      null;
    const tailorAddr =
      order.tailor?.location?.address ||
      order.vendorAddress ||
      order.tailor?.shopName ||
      null;

    const status = order.status;
    const pickupStage = order.pickupDeliveryStatus;
    const dropoffStage = order.dropoffDeliveryStatus;

    // Fabric C→T: to customer until picked up, then to tailor
    const isFabricToCustomer =
      status === 'fabric-ready-for-pickup' ||
      (['accepted', 'reached-pickup'].includes(pickupStage) &&
        ['fabric-ready-for-pickup', 'accepted', 'pending', 'pickup-assigned'].includes(status));

    const isFabricToTailor =
      status === 'fabric-picked-up' ||
      (['picked-up', 'reached-dropoff'].includes(pickupStage) &&
        ['fabric-picked-up', 'fabric-ready-for-pickup'].includes(status));

    // Final T→C: to tailor until garment picked, then to customer
    const isFinalToTailor =
      ['ready', 'ready-for-delivery', 'ready-for-pickup'].includes(status) ||
      (['accepted', 'reached-pickup'].includes(dropoffStage) &&
        !['out-for-delivery', 'delivered'].includes(status));

    const isFinalToCustomer =
      status === 'out-for-delivery' ||
      ['picked-up', 'reached-dropoff', 'out-for-delivery'].includes(dropoffStage);

    let dest = null;
    let origin = null;
    let addr = null;
    let label = 'Live Tracking';

    if (isFabricToCustomer) {
      dest = customerCoords;
      addr = customerAddr;
      label = 'Heading to pickup';
    } else if (isFabricToTailor) {
      dest = tailorCoords;
      origin = customerCoords;
      addr = tailorAddr;
      label = 'Delivering fabric to tailor';
    } else if (isFinalToTailor) {
      dest = tailorCoords;
      addr = tailorAddr;
      label = 'Heading to tailor pickup';
    } else if (isFinalToCustomer) {
      dest = customerCoords;
      origin = tailorCoords;
      addr = customerAddr;
      label = 'Delivering to customer';
    } else if (customerCoords || tailorCoords) {
      // Fallback: prefer customer for unknown final-ish states
      dest = isFinalToCustomer || status === 'delivered' ? customerCoords : (tailorCoords || customerCoords);
      addr = dest === customerCoords ? customerAddr : tailorAddr;
    }

    return {
      customer: customerCoords,
      tailor: tailorCoords,
      destination: dest,
      fallbackOrigin: origin,
      destinationAddress: addr,
      journeyLabel: label,
    };
  }, [order]);

  const isPickupPhase =
    order.status === 'fabric-ready-for-pickup' ||
    order.status === 'fabric-picked-up' ||
    ['accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'].includes(order.pickupDeliveryStatus);

  const isTailorDelivery = order.deliveryMethod === 'tailor';

  const rider = isTailorDelivery
    ? order.tailor
    : isPickupPhase
      ? order.pickupPartner
      : order.dropoffPartner || order.deliveryPartner;

  const riderStatus = isTailorDelivery
    ? 'accepted'
    : isPickupPhase
      ? order.pickupDeliveryStatus
      : order.dropoffDeliveryStatus;

  const isCustomerDelivering =
    order.fabricDeliveryPreference === 'customer' && order.status === 'accepted';

  if (isCompleted || ['delivered', 'product-delivered', 'order-completed', 'fabric-received'].includes(order.status)) {
    return null;
  }

  const isSearching =
    !isTailorDelivery &&
    (forceSearching ||
      riderStatus === 'assigned' ||
      riderStatus === 'pending' ||
      (!riderStatus && !isCustomerDelivering));

  if (!rider && !isSearching && !isCustomerDelivering) return null;

  if (isSearching && !isCustomerDelivering) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
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
                ? 'Assigning the nearest partner to pick up your fabric from your address.'
                : 'Assigning the nearest partner to deliver your finished garment.'}
            </p>
          </div>

          <div className="w-full max-w-[180px] h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-primary to-[#4f46e5] rounded-full animate-[loading-slide_1.5s_infinite_ease-in-out]" />
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes loading-slide {
            0% { left: -30%; width: 30%; }
            50% { left: 35%; width: 40%; }
            100% { left: 100%; width: 30%; }
          }
        `,
          }}
        />
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
        {isCustomerDelivering ? 'Customer Live Tracking' : journeyLabel}
      </h3>

      <div className="w-full h-64 rounded-xl overflow-hidden relative border border-gray-100">
        <DeliveryBoyLiveMap
          currentLocation={riderLocation}
          fallbackOrigin={fallbackOrigin || (!riderLocation ? (isPickupPhase ? customer : tailor) : null)}
          destination={destination}
          destinationAddress={destinationAddress}
          isLoaded={isLoaded}
          height="100%"
          onRouteCalculated={(data) => {
            if (data?.distanceValue !== -1) {
              if (data.distance) setDistance(data.distanceValue ?? data.distance);
              if (data.duration) setEta(data.duration);
            }
          }}
        />

        {(distance || eta) && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100/50 flex gap-4">
            {distance != null && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                <span className="text-xs font-bold text-gray-800">
                  {typeof distance === 'number' ? (distance / 1000).toFixed(1) + ' km' : distance}
                </span>
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

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#843D9B]/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#843D9B]">
              {isCustomerDelivering
                ? order.customer?.name?.charAt(0) || 'C'
                : isTailorDelivery
                  ? order.tailor?.shopName?.charAt(0) || 'T'
                  : rider?.name?.charAt(0) || 'R'}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {isCustomerDelivering
                ? order.customer?.name || 'Customer'
                : isTailorDelivery
                  ? order.tailor?.shopName || 'Artisan Tailor'
                  : rider?.name || 'Delivery Partner'}
            </h4>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                {isCustomerDelivering
                  ? 'Self Delivery'
                  : isTailorDelivery
                    ? 'Tailor Delivering'
                    : rider?.vehicleNumber || 'Vehicle'}
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
            href={`tel:${isCustomerDelivering ? order.customer?.phoneNumber : rider?.phoneNumber || rider?.phone}`}
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
