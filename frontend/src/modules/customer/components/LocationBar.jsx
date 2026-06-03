import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Loader2, Navigation, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import useLocationStore from '../../../store/locationStore';
import { useGoogleLocation } from '../../../hooks/useGoogleLocation';

const LocationBar = () => {
    const { address: location, setLocation, coordinates } = useLocationStore();
    const [isEditing, setIsEditing] = useState(false);
    const [tempLocation, setTempLocation] = useState('');
    const { detectLocation, isLocating: isLoading } = useGoogleLocation();

    const handleSave = () => {
        if (tempLocation.trim()) {
            // Mock random coords for manual entry for now
            const mockLat = 34.0837 + (Math.random() - 0.5) * 0.01;
            const mockLng = 74.7973 + (Math.random() - 0.5) * 0.01;
            setLocation(tempLocation, mockLat, mockLng);
            setIsEditing(false);
        }
    };

    const handleDetectLocation = async () => {
        try {
            const data = await detectLocation();
            if (data) {
                setLocation(data.address, data.latitude, data.longitude);
            }
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to detect location.");
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="bg-white/40 backdrop-blur-md border-b border-gray-100 relative z-40 selection:bg-[#2D2F6E] selection:text-white transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex justify-between items-center text-xs sm:text-sm">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-2 w-full"
                        >
                            <div className="flex-1 relative flex items-center">
                                <Search className="absolute left-3 h-3 w-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={tempLocation}
                                    onChange={(e) => setTempLocation(e.target.value)}
                                    placeholder="Enter area or pincode..."
                                    className="w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl py-1.5 sm:py-2 pl-8 pr-3 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#2D2F6E]/10 transition-all shadow-sm"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleDetectLocation}
                                className="p-2 sm:p-2.5 bg-[#2D2F6E]/5 text-[#2D2F6E] rounded-lg sm:rounded-xl hover:bg-[#2D2F6E]/10 transition-colors"
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                            </button>
                            <button
                                onClick={handleSave}
                                className="p-2 sm:p-2.5 bg-[#2D2F6E] text-white rounded-lg sm:rounded-xl shadow-lg shadow-[#2D2F6E]/20 active:scale-90 transition-transform"
                            >
                                <Check size={14} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-between w-full"
                        >
                            <div
                                className="flex items-center gap-2 sm:gap-2.5 truncate cursor-pointer group"
                                onClick={() => {
                                    setTempLocation(location);
                                    setIsEditing(true);
                                }}
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2D2F6E]/5 flex items-center justify-center text-[#2D2F6E] shrink-0 border border-[#2D2F6E]/5">
                                    <MapPin size={12} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5 sm:mb-1 text-left">Delivering To</p>
                                    <div className="flex items-center gap-1 overflow-hidden">
                                        <span className="text-[11px] sm:text-xs font-black text-gray-900 truncate tracking-tight">{location}</span>
                                        <ChevronDown size={12} className="text-[#2D2F6E] opacity-50 group-hover:translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#2D2F6E] shadow-[0_0_8px_rgba(255,92,138,0.4)] animate-pulse"></div>
                                <span className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-widest opacity-80">Riders Online</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LocationBar;
