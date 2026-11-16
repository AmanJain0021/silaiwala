// Port of modules/customer/components/LocationBar.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react-native";
import useLocationStore from "../../store/locationStore";
import LocationModal from "./LocationModal";
import { Box, Btn, I, Txt, Scroll } from '../ui/primitives';
const LocationBar = () => {
  const {
    address: location
  } = useLocationStore();
  const [showLocationModal, setShowLocationModal] = useState(false);
  return <Box className="bg-white/40 backdrop-blur-md border-b border-gray-100 relative z-40 selection:bg-[#843D9B] selection:text-white transition-all duration-300">
            <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex justify-between items-center text-xs sm:text-sm">
                <Box className="flex items-center justify-between w-full">
                    <Btn className="block flex items-center gap-2 sm:gap-2.5 truncate cursor-pointer group" onPress={() => setShowLocationModal(true)}>
                        <Box className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#843D9B]/5 flex items-center justify-center text-[#843D9B] shrink-0 border border-[#843D9B]/5">
                            <I icon={MapPin} size={12} className="group-hover:scale-110 transition-transform" />
                        </Box>
                        <Box className="min-w-0">
                            <Txt className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5 sm:mb-1 text-left">Delivering To</Txt>
                            <Box className="flex items-center gap-1 overflow-hidden">
                                <Txt className="text-[11px] sm:text-xs font-black text-gray-900 truncate tracking-tight">{location}</Txt>
                                <I icon={ChevronDown} size={12} className="text-[#843D9B] opacity-50 group-hover:translate-y-0.5 transition-transform" />
                            </Box>
                        </Box>
                    </Btn>

                    <Box className="flex items-center gap-2">
                        <Box className="w-2 h-2 rounded-full bg-[#843D9B] shadow-[0_0_8px_rgba(255,92,138,0.4)] animate-pulse"></Box>
                        <Txt className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest opacity-80">Riders Online</Txt>
                    </Box>
                </Box>
            </Box>
            
            <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
        </Box>;
};
export default LocationBar;