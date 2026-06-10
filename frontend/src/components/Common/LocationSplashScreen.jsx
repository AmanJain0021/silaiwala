import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import api from '../../utils/api';

const LocationSplashScreen = ({ onComplete, role, token }) => {
    const [status, setStatus] = useState('finding'); // finding, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let isMounted = true;

        const getLocation = () => {
            if (!navigator.geolocation) {
                if (isMounted) {
                    setStatus('error');
                    setErrorMsg('Geolocation is not supported by your browser');
                }
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    if (!isMounted) return;
                    
                    try {
                        const { latitude, longitude } = position.coords;
                        
                        // Default placeholder address if reverse geocoding is skipped/fails
                        let address = "Current Location";

                        // Try to reverse geocode using Google Maps API
                        try {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                            const res = await fetch(`${apiUrl}/distance/geocode?lat=${latitude}&lng=${longitude}`);
                            const result = await res.json();
                            if (result.success && result.data && result.data.address) {
                                address = result.data.address;
                            }
                        } catch (e) {
                            console.log("Reverse geocoding failed, using placeholder");
                        }

                        // Update global store so the UI (like HomeHeader) reflects the new location immediately
                        import('../../store/locationStore').then((module) => {
                            module.default.getState().setLocation(address, latitude, longitude);
                        }).catch(err => console.error("Could not load locationStore", err));

                        const activeToken = token || localStorage.getItem('token');
                        const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

                        // Save location to backend
                        if (role === 'tailor') {
                            await api.patch('/tailors/profile', {
                                latitude,
                                longitude,
                                address
                            }, { headers });
                        } else if (role === 'customer' || role === 'user') {
                            await api.post('/customers/addresses', {
                                type: 'Home',
                                receiverName: 'Self',
                                phone: 'N/A', // Let backend allow or we pass a placeholder
                                street: address,
                                city: 'Unknown',
                                state: 'Unknown',
                                zipCode: '000000',
                                isDefault: true,
                                location: {
                                    type: 'Point',
                                    coordinates: [longitude, latitude]
                                }
                            }, { headers });
                        }

                        setStatus('success');
                        setTimeout(() => {
                            if (isMounted && onComplete) onComplete();
                        }, 500);

                    } catch (err) {
                        console.error('Failed to save location:', err);
                        setStatus('error');
                        setErrorMsg('Could not save location to profile. You can update it later.');
                    }
                },
                (error) => {
                    if (!isMounted) return;
                    console.error('Geolocation error:', error);
                    setStatus('error');
                    setErrorMsg('Location permission denied or unavailable.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        // Add a slight delay for better UX
        const timer = setTimeout(() => {
            getLocation();
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [onComplete, role]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#2D2F6E] to-[#1a1b41] overflow-hidden"
        >
            {/* Background decorative elements */}
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
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <MapPin size={28} className="text-red-400 opacity-50 line-through" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-3 tracking-tight">Location Required</h2>
                        <p className="text-indigo-200 text-xs font-medium mb-6 leading-relaxed">
                            {errorMsg}
                        </p>
                        <button 
                            onClick={() => onComplete && onComplete()}
                            className="w-full py-3.5 bg-white text-[#2D2F6E] rounded-full font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg"
                        >
                            Skip for Now
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default LocationSplashScreen;
