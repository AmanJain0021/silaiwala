import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { FiArrowLeft, FiNavigation, FiPackage, FiMapPin } from 'react-icons/fi';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { useDeliveryTracking } from '../../../shared/hooks/useDeliveryTracking';
import { useDistanceTracker } from '../../../shared/hooks/useDistanceTracker';
import DeliveryBoyLiveMap from '../../../shared/components/DeliveryBoyLiveMap';
import PageTransition from '../../../shared/components/PageTransition';
import toast from 'react-hot-toast';

import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const LiveTracking = () => {
  const outletCtx = useOutletContext();
  const { isLoaded: localIsLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      libraries: GOOGLE_MAPS_LIBRARIES
  });
  const isLoaded = outletCtx?.isLoaded !== undefined ? outletCtx.isLoaded : localIsLoaded;

  const navigate = useNavigate();
  const { orderId } = useParams();
  const { deliveryBoy, updateLocation } = useDeliveryAuthStore();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [destination, setDestination] = useState(null);

  // Start location tracking
  useDeliveryTracking(deliveryBoy?.id, orderDetails ? [orderDetails] : []);

  const handleRouteCalculated = (routeData) => {
    if (currentLocation?.lat && currentLocation?.lng) {
      updateLocation(currentLocation.lat, currentLocation.lng, routeData.duration, routeData.distanceValue);
    }
  };

  // Start distance tracking
  const { distance } = useDistanceTracker(currentLocation);
  const isTracking = !!currentLocation;
  
  // Calculate total distance in km
  const totalDistance = distance ? distance / 1000 : 0;
  const earnings = Math.round(totalDistance * 10); // Example: Rs 10 per km
  const path = []; // Mock path length if needed, or track locations

  // Get current location and update distance tracker
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const newLocation = { lat, lng };
        
        setCurrentLocation(newLocation);
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, orderDetails]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/deliveries/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('deliveryToken')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch order');

        const data = await response.json();
        const orderData = data.data || data.order;
        setOrderDetails(orderData);

        // Determine phase and destination based on order data
        const isFabricPickup = orderData?.taskType === 'fabric-pickup';
        const s = String(orderData?.status || '').toLowerCase();
        
        let phase = 'pickup';
        if (['picked-up', 'picked_up', 'fabric-picked-up', 'out-for-delivery', 'out_for_delivery', 'shipped'].includes(s)) {
            phase = 'delivery';
        }

        // Set destination based on phase
        if (phase === 'pickup') {
            const lat = isFabricPickup ? orderData?.latitude : orderData?.vendorLatitude;
            const lng = isFabricPickup ? orderData?.longitude : orderData?.vendorLongitude;
            if (lat && lng) setDestination({ lat, lng });
        } else {
            const lat = isFabricPickup ? orderData?.vendorLatitude : orderData?.latitude;
            const lng = isFabricPickup ? orderData?.vendorLongitude : orderData?.longitude;
            if (lat && lng) setDestination({ lat, lng });
        }
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('Failed to load order details');
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  return (
    <PageTransition>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Live Tracking</h1>
          <div className="w-10" />
        </div>

        {/* Map Container */}
        <div className="flex-1 p-4">
          <DeliveryBoyLiveMap 
            currentLocation={currentLocation}
            destination={destination}
            path={path}
            distanceTraveled={totalDistance}
            earnings={earnings}
            orderDetails={orderDetails ? {
              orderId: orderDetails.orderId,
              customerName: orderDetails.customer?.name || orderDetails.customer || 'Customer',
              status: orderDetails.status
            } : null}
            isLoaded={isLoaded}
            onRouteCalculated={handleRouteCalculated}
          />
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-t border-gray-200 p-4 space-y-3"
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {totalDistance.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 font-medium">KM Traveled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                ₹{earnings}
              </div>
              <div className="text-xs text-gray-500 font-medium">Trip Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {path.length}
              </div>
              <div className="text-xs text-gray-500 font-medium">Checkpoints</div>
            </div>
          </div>

          {/* Status Indicator */}
          {isTracking && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600 font-medium">
                Live tracking active
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default LiveTracking;
