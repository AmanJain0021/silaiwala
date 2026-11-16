// Port of modules/customer/pages/TailorSelection.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { useNavigate,  } from '../lib/nav';
import { ArrowLeft, Star, MapPin, ChevronRight, Loader2 } from "lucide-react-native";
import api from "../lib/api";
import useCheckoutStore from "../store/checkoutStore";
import useLocationStore from "../store/locationStore";
import SafeImage from "../components/common/SafeImage";
import { Box, Txt, Btn, I, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const TailorSelection = () => {
  const navigate = useNavigate();
  const {
    serviceDetails,
    configuration,
    pricing,
    setTailor,
    isBuyNowMode,
    buyNowItem
  } = useCheckoutStore();
  const [tailors, setTailors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    coordinates
  } = useLocationStore();
  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const response = await api.get('/customers/tailors', {
          params: {
            lat: coordinates?.lat,
            lng: coordinates?.lng
          }
        });
        if (response.data.success) {
          setTailors(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching tailors for selection:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTailors();
  }, []);
  const handleSelectTailor = tailor => {
    // We use the tailor's User ID for the order assignment in the backend
    const tailorUserId = tailor.user?._id || tailor.user?.id || tailor._id;
    setTailor(tailorUserId, tailor.shopName || 'Tailor Partner');
    navigate('/user/checkout/address');
  };
  if (isLoading) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Spin size={32} className="text-[#843D9B] animate-spin mb-4" />
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finding Available Tailors...</Txt>
            </Box></Screen>;
  }
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-[#843D9B] text-white px-4 py-4 flex items-center gap-3 pt-safe">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-lg font-bold">Select a Tailor</Txt>
                    <Txt className="text-[10px] text-gray-100">Choose an expert for your {(isBuyNowMode ? buyNowItem?.serviceDetails?.title : serviceDetails?.title) || 'service'}</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            {/* Progress Bar */}
            <Box className="bg-white px-6 py-6 flex justify-between items-center border-b border-gray-100">
                <Box className="flex flex-col items-center gap-1">
                    <Box className="w-6 h-6 rounded-full bg-[#843D9B] text-white text-[10px] flex items-center justify-center font-bold">1</Box>
                    <Txt className="text-[10px] font-bold text-[#843D9B]">Service</Txt>
                </Box>
                <Box className="h-px bg-[#843D9B] flex-1 mx-4"></Box>
                <Box className="flex flex-col items-center gap-1">
                    <Box className="w-6 h-6 rounded-full bg-[#843D9B] text-white text-[10px] flex items-center justify-center font-bold animate-pulse">2</Box>
                    <Txt className="text-[10px] font-bold text-[#843D9B]">Tailor</Txt>
                </Box>
                <Box className="h-px bg-gray-200 flex-1 mx-4"></Box>
                <Box className="flex flex-col items-center gap-1">
                    <Box className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center font-bold">3</Box>
                    <Txt className="text-[10px] font-bold text-gray-400">Review</Txt>
                </Box>
            </Box>

            {/* Tailor List */}
            <Box className="p-4 space-y-4 max-w-4xl mx-auto md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {tailors.length > 0 ? tailors.map(tailor => <Btn key={tailor._id} onPress={() => handleSelectTailor(tailor)} className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group">
                        <Box className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                            <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName || 'Tailor Partner'} className="w-full h-full" />
                        </Box>
                        <Box className="flex-1">
                            <Txt className="text-sm font-bold text-gray-900 group-hover:text-[#843D9B] transition-colors">{tailor.shopName || 'Tailor Partner'}</Txt>
                            <Txt className="text-[10px] text-[#843D9B] font-bold mb-1">{tailor.specializations?.[0] || 'Expert Tailor'}</Txt>
                            <Box className="flex items-center gap-3 text-[10px] text-gray-500">
                                <Txt className="flex items-center gap-0.5"><I icon={Star} size={10} className="fill-yellow-400 text-yellow-400" /> {tailor.rating || 0}</Txt>
                                <Txt className="flex items-center gap-0.5"><I icon={MapPin} size={10} /> {tailor.distance || 'Near You'}</Txt>
                                <Txt className="font-bold text-[#843D9B] bg-indigo-50 px-1 py-0.5 rounded text-[8px]">{tailor.experienceInYears || 0}Y Exp</Txt>
                            </Box>
                        </Box>
                        <I icon={ChevronRight} size={18} className="text-gray-300 mr-1" />
                    </Btn>) : <Box className="py-20 text-center opacity-40">
                        <Txt className="text-sm font-bold uppercase tracking-widest">No available tailors found</Txt>
                    </Box>}
            </Box>

            {/* Info Message */}
            <Box className="mx-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <Txt className="text-[10px] text-blue-700 leading-relaxed">
                    <Txt className="font-bold">Note:</Txt> You are manually selecting a tailor. Their specific stitching quality and style will be reflected in your final outfit.
                </Txt>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default TailorSelection;