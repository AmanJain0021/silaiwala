import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

import useLocationStore from '../../../store/locationStore';
import LocationModal from './LocationModal';

const LocationBar = () => {
    const { address: location } = useLocationStore();
    const [showLocationModal, setShowLocationModal] = useState(false);

    return (
        <div className="bg-white/40 backdrop-blur-md border-b border-gray-100 relative z-40 selection:bg-[#843D9B] selection:text-white transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex justify-between items-center text-xs sm:text-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between w-full"
                >
                    <div
                        className="flex items-center gap-2 sm:gap-2.5 truncate cursor-pointer group"
                        onClick={() => setShowLocationModal(true)}
                    >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#843D9B]/5 flex items-center justify-center text-[#843D9B] shrink-0 border border-[#843D9B]/5">
                            <MapPin size={12} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5 sm:mb-1 text-left">Delivering To</p>
                            <div className="flex items-center gap-1 overflow-hidden">
                                <span className="text-[11px] sm:text-xs font-black text-gray-900 truncate tracking-tight">{location}</span>
                                <ChevronDown size={12} className="text-[#843D9B] opacity-50 group-hover:translate-y-0.5 transition-transform" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#843D9B] shadow-[0_0_8px_rgba(255,92,138,0.4)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest opacity-80">Riders Online</span>
                    </div>
                </motion.div>
            </div>
            
            <LocationModal 
                isOpen={showLocationModal} 
                onClose={() => setShowLocationModal(false)} 
            />
        </div>
    );
};

export default LocationBar;
