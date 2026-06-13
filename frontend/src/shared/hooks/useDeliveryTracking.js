import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeliveryAuthStore } from '../../modules/delivery/store/deliveryStore';

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
  const [location, setLocation] = useState(() => {
    if (deliveryBoy?.location?.coordinates?.length === 2) {
      return { 
        lat: deliveryBoy.location.coordinates[1], 
        lng: deliveryBoy.location.coordinates[0] 
      };
    }
    return { lat: null, lng: null };
  });

  const watchIdRef = useRef(null);

  const handlePosition = useCallback((position) => {
    const { latitude, longitude } = position.coords;
    setLocation({ lat: latitude, lng: longitude });

    // Sync location to backend if rider is active
    if (riderId && typeof updateLocation === 'function') {
      updateLocation(latitude, longitude);
    }
  }, [riderId, updateLocation]);

  useEffect(() => {
    if (!riderId || !navigator.geolocation) return;

    // Get initial position quickly, fallback to standard accuracy if needed
    navigator.geolocation.getCurrentPosition(
      handlePosition, 
      (err) => {
        console.warn('[useDeliveryTracking] High accuracy position failed:', err.message);
        // If high accuracy fails or times out, immediately fallback to standard accuracy
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          (fallbackErr) => {
            console.error('[useDeliveryTracking] Fallback position also failed:', fallbackErr.message);
            // If both fail, we rely on the DB initialization and the ongoing watchPosition
          }, 
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }, 
      { enableHighAccuracy: true, timeout: 5000 } // Short timeout for rapid UX
    );

    // Watch for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        console.warn('[useDeliveryTracking] Watch error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [riderId, handlePosition]);

  return location;
};

export default useDeliveryTracking;
