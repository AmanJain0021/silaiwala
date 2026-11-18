// Port of shared/hooks/useUnifiedLocation.js (expo-location instead of navigator.geolocation)
import { useState, useCallback, useEffect, useRef } from 'react';
import storage from '../../lib/storage';
import { API_URL } from '../../lib/config';
import { getCurrentPosition, watchPosition } from '../../lib/location';
import { reverseGeocode } from '../../utils/reverseGeocode';

export const useUnifiedLocation = ({ autoDetect = false, fetchAddress = true, enableTracking = false, onLocationUpdate = null } = {}) => {
  const [location, setLocation] = useState({ lat: null, lng: null, address: null, city: null, state: null, pincode: null, street: null, raw: null, isAddressLoading: false });
  const [isLocating, setIsLocating] = useState(autoDetect || enableTracking);
  const [error, setError] = useState(null);
  const stopWatchRef = useRef(null);
  const lastGeocode = useRef({ lat: null, lng: null, addressData: null });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const getManualLocation = () => {
    try {
      const stored = storage.getItem('manual_location');
      return stored ? JSON.parse(stored) : null;
    } catch (_) { return null; }
  };

  const fetchAddressData = async (latitude, longitude) => {
    try {
      const response = await fetch(`${API_URL}/distance/geocode?lat=${latitude}&lng=${longitude}`);
      const result = await response.json();
      if (result.success && result.data) return result.data;
      throw new Error('No address');
    } catch (_) {
      try {
        const geo = await reverseGeocode(latitude, longitude);
        if (geo?.formattedAddress) return { address: geo.formattedAddress, city: geo.city, state: geo.state, pincode: geo.pincode, street: geo.area, raw: geo };
      } catch (__) { /* none */ }
      return null;
    }
  };

  const processPosition = useCallback(async (position) => {
    const { latitude, longitude } = position.coords;
    let addressData = {};
    if (mounted.current) setLocation((p) => ({ ...p, lat: latitude, lng: longitude, isAddressLoading: fetchAddress }));
    if (typeof onLocationUpdate === 'function') onLocationUpdate(latitude, longitude);
    if (fetchAddress) {
      const sig = !lastGeocode.current.lat || Math.abs(lastGeocode.current.lat - latitude) > 0.0005 || Math.abs(lastGeocode.current.lng - longitude) > 0.0005;
      if (sig) {
        const data = await fetchAddressData(latitude, longitude);
        if (data) {
          addressData = data;
          lastGeocode.current = { lat: latitude, lng: longitude, addressData: data };
        }
      } else addressData = lastGeocode.current.addressData || {};
      if (mounted.current) setLocation((p) => ({ ...p, ...addressData, isAddressLoading: false }));
    }
    return { latitude, longitude, ...addressData };
  }, [fetchAddress, onLocationUpdate]);

  const detectLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const manual = getManualLocation();
      const position = manual
        ? { coords: { latitude: manual.latitude, longitude: manual.longitude, accuracy: 1 } }
        : await getCurrentPosition({ timeout: 6000 }).catch(() => getCurrentPosition({ timeout: 10000, highAccuracy: false }));
      const data = await processPosition(position);
      if (mounted.current) setIsLocating(false);
      return data;
    } catch (err) {
      const msg = err?.code === 'timeout' ? 'Location request timed out.' : err?.message || 'Location access denied.';
      if (mounted.current) { setError(msg); setIsLocating(false); }
      throw new Error(msg);
    }
  }, [processPosition]);

  const stopTracking = useCallback(() => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
    if (mounted.current) setIsLocating(false);
  }, []);

  const startTracking = useCallback(() => {
    setIsLocating(true);
    setError(null);
    const manual = getManualLocation();
    if (manual) {
      processPosition({ coords: { latitude: manual.latitude, longitude: manual.longitude, accuracy: 1 } }).then(() => mounted.current && setIsLocating(false));
      return;
    }
    stopWatchRef.current?.();
    stopWatchRef.current = watchPosition(
      async (pos) => { await processPosition(pos); if (mounted.current) setIsLocating(false); },
      (err) => { if (mounted.current) { setError(err?.message || 'Location access denied.'); setIsLocating(false); } }
    );
  }, [processPosition]);

  useEffect(() => {
    if (autoDetect && !enableTracking) detectLocation().catch(() => {});
    else if (enableTracking) startTracking();
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetect, enableTracking]);

  return { location, isLocating, error, detectLocation, startTracking, stopTracking };
};

export default useUnifiedLocation;
