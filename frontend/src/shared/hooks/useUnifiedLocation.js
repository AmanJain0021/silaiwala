import { useState, useCallback, useEffect, useRef } from 'react';

export const useUnifiedLocation = ({
    autoDetect = false,
    fetchAddress = true,
    enableTracking = false,
    onLocationUpdate = null,
} = {}) => {
    const [location, setLocation] = useState({
        lat: null,
        lng: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        street: null,
        raw: null,
        isAddressLoading: false,
    });
    const [isLocating, setIsLocating] = useState(autoDetect || enableTracking);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);

    const getErrorMessage = (err) => {
        let errMsg = "Location access denied.";
        if (err.code === 2) errMsg = "Position unavailable.";
        if (err.code === 3) errMsg = "Location request timed out.";
        return err.message || errMsg;
    };

    const getManualLocation = () => {
        try {
            const stored = localStorage.getItem('manual_location');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to parse manual location', e);
        }
        return null;
    };

    const fetchAddressData = async (latitude, longitude) => {
        try {
            const { API_URL } = await import('../../config/constants');
            console.log('📍 [useUnifiedLocation] Fetching address for coords:', { latitude, longitude });
            const response = await fetch(`${API_URL}/distance/geocode?lat=${latitude}&lng=${longitude}`);
            const result = await response.json();
            console.log('🗺️ [useUnifiedLocation] Geocode API Response:', result);

            if (result.success && result.data) {
                return result.data;
            } else {
                throw new Error("No address found from Backend Geocoding API.");
            }
        } catch (err) {
            console.error("Google Geocoding failed:", err);
            return null;
        }
    };

    const processPosition = async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`🧭 [useUnifiedLocation] Raw GPS Position acquired:`, { latitude, longitude, accuracy: position.coords.accuracy });
        
        let addressData = {};
        
        // Immediate coords update to unblock UI
        setLocation(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            isAddressLoading: fetchAddress
        }));

        if (typeof onLocationUpdate === 'function') {
            onLocationUpdate(latitude, longitude);
        }

        // Fetch address only if required
        if (fetchAddress) {
            const data = await fetchAddressData(latitude, longitude);
            if (data) {
                addressData = data;
                setLocation(prev => ({
                    ...prev,
                    ...addressData,
                    isAddressLoading: false
                }));
            } else {
                setLocation(prev => ({
                    ...prev,
                    isAddressLoading: false
                }));
            }
        }
        
        return { latitude, longitude, ...addressData };
    };

    const detectLocation = useCallback(() => {
        setIsLocating(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const manualLoc = getManualLocation();
            if (manualLoc) {
                // Mock Geolocation position object
                const position = {
                    coords: {
                        latitude: manualLoc.latitude,
                        longitude: manualLoc.longitude,
                        accuracy: 1
                    }
                };
                processPosition(position).then(locData => {
                    setIsLocating(false);
                    resolve(locData);
                }).catch(err => {
                    setError(err.message);
                    setIsLocating(false);
                    reject(err);
                });
                return;
            }

            if (!("geolocation" in navigator)) {
                const err = new Error("Geolocation is not supported by your browser.");
                setError(err.message);
                setIsLocating(false);
                reject(err);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const locData = await processPosition(position);
                        setIsLocating(false);
                        resolve(locData);
                    } catch (err) {
                        setError(err.message);
                        setIsLocating(false);
                        reject(err);
                    }
                },
                (err) => {
                    console.warn('[useUnifiedLocation] High accuracy detectLocation failed:', err.message);
                    navigator.geolocation.getCurrentPosition(
                        async (fallbackPos) => {
                            try {
                                const locData = await processPosition(fallbackPos);
                                setIsLocating(false);
                                resolve(locData);
                            } catch (fallbackProcessErr) {
                                setError(fallbackProcessErr.message);
                                setIsLocating(false);
                                reject(fallbackProcessErr);
                            }
                        },
                        (fallbackErr) => {
                            const errMsg = getErrorMessage(fallbackErr);
                            setError(errMsg);
                            setIsLocating(false);
                            reject(new Error(errMsg));
                        },
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
                    );
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        });
    }, [fetchAddress, onLocationUpdate]);

    const startTracking = useCallback(() => {
        const manualLoc = getManualLocation();
        if (!("geolocation" in navigator) && !manualLoc) {
            setError("Geolocation is not supported");
            return;
        }
        
        setIsLocating(true);
        setError(null);

        if (manualLoc) {
            // Mock single resolution for tracking if manual override is used
            const position = {
                coords: {
                    latitude: manualLoc.latitude,
                    longitude: manualLoc.longitude,
                    accuracy: 1
                }
            };
            processPosition(position).then(() => {
                setIsLocating(false);
            });
            // Manual location is static, so no need for watchPosition
            return;
        }

        // Quick fallback strategy for initial position
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                await processPosition(position);
                setIsLocating(false);
            },
            (err) => {
                console.warn('[useUnifiedLocation] High accuracy position failed:', err.message);
                navigator.geolocation.getCurrentPosition(
                    async (fallbackPos) => {
                        await processPosition(fallbackPos);
                        setIsLocating(false);
                    },
                    (fallbackErr) => {
                        console.error('[useUnifiedLocation] Fallback position also failed:', fallbackErr.message);
                        setError(getErrorMessage(fallbackErr));
                        setIsLocating(false);
                    },
                    { enableHighAccuracy: false, timeout: 5000 }
                );
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        // Live continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                await processPosition(position);
            },
            (err) => {
                console.warn('[useUnifiedLocation] Watch error:', err.message);
                setError(getErrorMessage(err));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 10000,
            }
        );
    }, [fetchAddress, onLocationUpdate]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsLocating(false);
    }, []);

    useEffect(() => {
        if (autoDetect && !enableTracking) {
            detectLocation().catch(() => {});
        } else if (enableTracking) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [autoDetect, enableTracking, detectLocation, startTracking, stopTracking]);

    return {
        location,
        isLocating,
        error,
        detectLocation,
        startTracking,
        stopTracking
    };
};

export default useUnifiedLocation;
