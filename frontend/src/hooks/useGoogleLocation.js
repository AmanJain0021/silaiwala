import { useState, useCallback } from 'react';

export const useGoogleLocation = () => {
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);

    const detectLocation = useCallback(() => {
        setIsLocating(true);
        setError(null);

        return new Promise((resolve, reject) => {
            if (!("geolocation" in navigator)) {
                const err = new Error("Geolocation is not supported by your browser.");
                setError(err.message);
                setIsLocating(false);
                reject(err);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                        const response = await fetch(`${apiUrl}/distance/geocode?lat=${latitude}&lng=${longitude}`);
                        const result = await response.json();

                        if (result.success && result.data) {
                            const { address, city, state, pincode, street, raw } = result.data;

                            const locationData = {
                                address,
                                latitude,
                                longitude,
                                city,
                                state,
                                pincode,
                                street,
                                raw
                            };
                            setIsLocating(false);
                            resolve(locationData);
                        } else {
                            throw new Error("No address found from Backend Geocoding API.");
                        }
                    } catch (err) {
                        console.error("Google Geocoding failed:", err);
                        setError(err.message);
                        setIsLocating(false);
                        reject(err);
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    let errMsg = "Location access denied.";
                    if (err.code === 2) errMsg = "Position unavailable.";
                    if (err.code === 3) errMsg = "Location request timed out.";
                    setError(errMsg);
                    setIsLocating(false);
                    reject(new Error(errMsg));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }, []);

    return { detectLocation, isLocating, error };
};

export default useGoogleLocation;
