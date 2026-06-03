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
                        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                        const response = await fetch(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                        );
                        const data = await response.json();

                        if (data.status === "OK" && data.results.length > 0) {
                            const result = data.results[0];
                            const address = result.formatted_address;
                            
                            let city = "";
                            let state = "";
                            let pincode = "";
                            let street = "";
                            
                            result.address_components.forEach(comp => {
                                if (comp.types.includes('locality')) city = comp.long_name;
                                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                                if (comp.types.includes('postal_code')) pincode = comp.long_name;
                                if (comp.types.includes('route')) street = comp.long_name;
                            });

                            const locationData = {
                                address,
                                latitude,
                                longitude,
                                city,
                                state,
                                pincode,
                                street,
                                raw: result
                            };
                            setIsLocating(false);
                            resolve(locationData);
                        } else {
                            throw new Error(data.error_message || "No address found from Google Maps API.");
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
