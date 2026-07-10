import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import api from '../../utils/api';
import { getToken } from '../../utils/auth';

const LocationSplashScreen = ({ onComplete, role, token }) => {
    const [status, setStatus] = useState('finding'); // finding, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const hasFetched = useRef(false);
    const isMounted = useRef(true);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            if (isMounted.current) {
                setStatus('error');
                setErrorMsg('Geolocation is not supported by your browser');
            }
            return;
        }

        let isPositionHandled = false;

        // Fallback timeout since native timeout can be unreliable in some browsers
        const fallbackTimer = setTimeout(() => {
            if (!isPositionHandled && isMounted.current) {
                isPositionHandled = true;
                setStatus('error');
                setErrorMsg('Location request timed out. Please check your browser permissions.');
            }
        }, 5000);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                if (!isMounted.current || isPositionHandled) return;
                isPositionHandled = true;
                clearTimeout(fallbackTimer);
                
                try {
                    const { latitude, longitude } = position.coords;
                    
                    let address = "Current Location";

                    try {
                        const { API_URL } = await import('../../config/constants');
                        const res = await fetch(`${API_URL}/distance/geocode?lat=${latitude}&lng=${longitude}`);
                        const result = await res.json();
                        if (result.success && result.data && result.data.address) {
                            address = result.data.address;
                        }
                    } catch (e) {
                        console.log("Reverse geocoding failed, using placeholder");
                    }

                    import('../../store/locationStore').then((module) => {
                        module.default.getState().setLocation(address, latitude, longitude);
                    }).catch(err => console.error("Could not load locationStore", err));

                    const activeToken = token || getToken();
                    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

                    if (role === 'delivery') {
                        await api.patch('/deliveries/status', {
                            lat: latitude,
                            lng: longitude,
                            isAvailable: true,
                            status: 'active'
                        }, { headers });
                    }

                    setStatus('success');
                    setTimeout(() => {
                        if (isMounted.current && onComplete) onComplete();
                    }, 500);

                } catch (err) {
                    console.error('Failed to save location:', err);
                    setStatus('error');
                    setErrorMsg('Could not save location to profile. You can update it later.');
                }
            },
            (error) => {
                if (!isMounted.current || isPositionHandled) return;
                isPositionHandled = true;
                clearTimeout(fallbackTimer);
                console.error('Geolocation error:', error);
                setStatus('error');
                setErrorMsg('Location permission denied or unavailable.');
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }, [onComplete, role, token]);

    useEffect(() => {
        isMounted.current = true;
        if (hasFetched.current) return;
        hasFetched.current = true;
        
        const timer = setTimeout(() => {
            getLocation();
        }, 200);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
        };
    }, [getLocation]);

    const handleRetry = () => {
        setStatus('finding');
        setTimeout(() => getLocation(), 500);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#843D9B] to-[#1a1b41] overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E04D79]/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-center p-8 max-w-sm w-full text-center">
                {status === 'finding' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative mb-8">
                            <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-white/20 rounded-full blur-md"
                            />
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
                                <Navigation size={32} className="text-white animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Locating You</h2>
                        <p className="text-indigo-200 text-sm font-medium mb-8">We need your location to find the best tailors and assign deliveries accurately.</p>
                        
                        <div className="flex gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        
                        <button 
                            onClick={() => {
                                if (onComplete) onComplete();
                            }}
                            className="mt-8 text-white/50 text-xs font-bold hover:text-white underline transition-colors"
                        >
                            Skip & Continue
                        </button>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <MapPin size={36} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Location Saved</h2>
                        <p className="text-emerald-200 text-sm font-medium">Taking you to your dashboard...</p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center w-full bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                            <MapPin size={28} className="text-red-400 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2 tracking-tight text-center">Enable Location Services</h2>
                        <p className="text-indigo-200 text-xs font-medium mb-6 leading-relaxed text-center">
                            We cannot detect your location. Please turn on your device's GPS and allow location permissions in your browser settings.
                        </p>
                        
                        <div className="w-full space-y-3">
                            <button 
                                onClick={handleRetry}
                                className="w-full py-3.5 bg-white text-[#843D9B] rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                I've Enabled It, Try Again
                            </button>
                            <button 
                                onClick={() => onComplete && onComplete()}
                                className="w-full py-3.5 bg-transparent border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                                Continue Without Location
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default LocationSplashScreen;
