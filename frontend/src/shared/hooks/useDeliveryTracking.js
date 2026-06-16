import { useState, useCallback } from 'react';
import { useDeliveryAuthStore } from '../../modules/delivery/store/deliveryStore';
import useUnifiedLocation from './useUnifiedLocation';

/**
 * useDeliveryTracking - Tracks rider's live GPS location and syncs with backend.
 * @param {string} riderId - The delivery partner's ID
 * @param {Array} activeTasks - Array of active order objects (optional)
 * @returns {{ lat: number|null, lng: number|null }} - Current location
 */
export const useDeliveryTracking = (riderId, activeTasks = []) => {
  const deliveryBoy = useDeliveryAuthStore?.getState?.()?.deliveryBoy;
  const updateLocation = useDeliveryAuthStore?.getState?.()?.updateLocation;

  // Initialize with DB location as an immediate fallback to prevent map hangs
  const [initialLoc] = useState(() => {
    if (deliveryBoy?.location?.coordinates?.length === 2) {
      return { 
        lat: deliveryBoy.location.coordinates[1], 
        lng: deliveryBoy.location.coordinates[0] 
      };
    }
    return { lat: null, lng: null };
  });

  const handleLocationUpdate = useCallback((latitude, longitude) => {
    // Sync location to backend if rider is active
    if (riderId && typeof updateLocation === 'function') {
      updateLocation(latitude, longitude);
    }
  }, [riderId, updateLocation]);

  const { location } = useUnifiedLocation({
      autoDetect: false,
      fetchAddress: false, // For high-frequency continuous tracking, we don't reverse geocode every tick
      enableTracking: !!riderId, // Start watchPosition immediately if rider ID is valid
      onLocationUpdate: handleLocationUpdate
  });

  return {
      lat: location.lat || initialLoc.lat,
      lng: location.lng || initialLoc.lng
  };
};

export default useDeliveryTracking;
