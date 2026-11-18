// Port of shared/hooks/useDistanceTracker.js (converted with scripts/web2rn.js, then reviewed)
import { useState, useEffect, useRef } from "react";
import { Scroll } from '../../components/ui/primitives';

/**
 * useDistanceTracker - Tracks cumulative distance traveled during a delivery.
 * @param {object} currentLocation - { lat, lng }
 * @returns {{ distance: number, resetDistance: Function }}
 */
export const useDistanceTracker = currentLocation => {
  const [distance, setDistance] = useState(0);
  const lastLocationRef = useRef(null);
  const toRad = deg => deg * Math.PI / 180;
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // metres
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  useEffect(() => {
    if (!currentLocation?.lat || !currentLocation?.lng) return;
    if (lastLocationRef.current) {
      const d = haversine(lastLocationRef.current.lat, lastLocationRef.current.lng, currentLocation.lat, currentLocation.lng);
      if (d > 5) {
        // Only count if moved > 5 metres (noise filter)
        setDistance(prev => prev + d);
      }
    }
    lastLocationRef.current = {
      ...currentLocation
    };
  }, [currentLocation?.lat, currentLocation?.lng]);
  const resetDistance = () => {
    setDistance(0);
    lastLocationRef.current = null;
  };
  return {
    distance,
    resetDistance
  };
};
export default useDistanceTracker;