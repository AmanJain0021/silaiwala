import { ArrowLeft as FiArrowLeft, Navigation as FiNavigation, Package as FiPackage, MapPin as FiMapPin } from 'lucide-react-native';
// Port of modules/delivery/pages/LiveTracking.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../lib/storage';
import { watchPosition } from '../lib/location';
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from '../lib/nav';
import { useDeliveryAuthStore } from "../store/deliveryStore";
import { useDeliveryTracking } from "../shared/hooks/useDeliveryTracking";
import { getToken } from "../lib/auth";
import { API_URL } from "../lib/config";
import { useDistanceTracker } from "../shared/hooks/useDistanceTracker";
import DeliveryBoyLiveMap from "../components/shared/DeliveryBoyLiveMap";
import PageTransition from "../components/shared/PageTransition";
import toast from '../lib/toast';
import { Box, Btn, Txt, Scroll, I } from '../components/ui/primitives';
const LiveTracking = () => {
  const outletCtx = useOutletContext();
  const localIsLoaded = true; // native Google Maps SDK (key in app config) is always available
  const isLoaded = outletCtx?.isLoaded !== undefined ? outletCtx.isLoaded : localIsLoaded;
  const navigate = useNavigate();
  const {
    orderId
  } = useParams();
  const {
    deliveryBoy,
    updateLocation
  } = useDeliveryAuthStore();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [settings, setSettings] = useState(null);

  // Start location tracking
  useDeliveryTracking(deliveryBoy?.id, orderDetails ? [orderDetails] : []);
  const handleRouteCalculated = routeData => {
    if (routeData && routeData.distanceValue) {
      setRouteDistance(routeData.distanceValue);
    }
    if (currentLocation?.lat && currentLocation?.lng) {
      updateLocation(currentLocation.lat, currentLocation.lng, routeData.duration, routeData.distanceValue);
    }
  };
  const isTracking = !!currentLocation;

  // Calculate total distance in km from route calculation
  const totalDistance = routeDistance ? routeDistance / 1000 : 0;
  const baseFee = settings?.deliveryRates?.baseFee || 40;
  const perKmRate = settings?.deliveryRates?.perKmRate || 10;
  const earnings = Math.round(baseFee + totalDistance * perKmRate);
  const path = []; // Mock path length if needed, or track locations

  // Get current location and update distance tracker
  useEffect(() => {
    const manualLocStr = storage.getItem('manual_location');
    if (manualLocStr) {
      try {
        const manualLoc = JSON.parse(manualLocStr);
        setCurrentLocation({
          lat: manualLoc.latitude,
          lng: manualLoc.longitude
        });
        return; // Skip watch if using manual location
      } catch (e) {
        console.error(e);
      }
    }
    // web: navigator.geolocation.watchPosition (high accuracy); native: expo-location foreground watch
    const stop = watchPosition(position => {
      const { latitude: lat, longitude: lng } = position.coords;
      setCurrentLocation({ lat, lng });
    }, error => {
      console.error('Location error:', error);
      toast.error('Failed to get location');
    });
    return () => stop();
  }, [isTracking, orderDetails]);

  // Fetch admin settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/cms/settings`);
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/deliveries/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
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
          if (lat && lng) setDestination({
            lat,
            lng
          });
        } else {
          const lat = isFabricPickup ? orderData?.vendorLatitude : orderData?.latitude;
          const lng = isFabricPickup ? orderData?.vendorLongitude : orderData?.longitude;
          if (lat && lng) setDestination({
            lat,
            lng
          });
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
  return <PageTransition>
      <Screen className="bg-gray-50"><Box className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <Box className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <Btn onPress={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <I icon={FiArrowLeft} className="text-xl text-gray-700" />
          </Btn>
          <Txt className="text-lg font-bold text-gray-900">Live Tracking</Txt>
          <Box className="w-10" />
        </Box>

        {/* Map Container */}
        <Box className="flex-1 p-4">
          <DeliveryBoyLiveMap currentLocation={currentLocation} destination={destination} path={path} distanceTraveled={totalDistance} earnings={earnings} orderDetails={orderDetails ? {
          orderId: orderDetails.orderId,
          customerName: orderDetails.customer?.name || orderDetails.customer || 'Customer',
          status: orderDetails.status
        } : null} isLoaded={isLoaded} onRouteCalculated={handleRouteCalculated} />
        </Box>

        {/* Bottom Stats Bar */}
        <Box className="bg-white border-t border-gray-200 p-4 space-y-3">
          {/* Quick Stats */}
          <Box className="grid grid-cols-3 gap-3">
            <Box className="text-center">
              <Box className="text-2xl font-bold text-indigo-600">
                {totalDistance.toFixed(2)}
              </Box>
              <Box className="text-xs text-gray-500 font-medium">KM Traveled</Box>
            </Box>
            <Box className="text-center">
              <Box className="text-2xl font-bold text-emerald-600">
                ₹{earnings}
              </Box>
              <Box className="text-xs text-gray-500 font-medium">Trip Earnings</Box>
            </Box>
            <Box className="text-center">
              <Box className="text-2xl font-bold text-primary">
                {path.length}
              </Box>
              <Box className="text-xs text-gray-500 font-medium">Checkpoints</Box>
            </Box>
          </Box>

          {/* Status Indicator */}
          {isTracking && <Box className="flex items-center justify-center gap-2 text-sm">
              <Box className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Txt className="text-gray-600 font-medium">
                Live tracking active
              </Txt>
            </Box>}
        </Box>
      </Box></Screen>
    </PageTransition>;
};
export default LiveTracking;
