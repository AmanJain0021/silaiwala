// Port of modules/customer/pages/TailorListing.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import {  useNavigate, useLocation } from '../lib/nav';
import { ArrowLeft, Search, Filter, Star, MapPin, Heart, ShieldCheck, Clock, ChevronRight, Loader2 } from "lucide-react-native";
import api from "../lib/api";
import useLocationStore from "../store/locationStore";
import SafeImage from "../components/common/SafeImage";
import TailorFilterDrawer from "../components/customer/TailorFilterDrawer";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Box, Txt, Btn, I, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const TailorListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    requireAuth
  } = useRequireAuth();
  const handleTailorClick = (e, tailorId) => {
    if (!requireAuth('Please login to view tailor shop details')) return;
    navigate(`/user/tailor/${tailorId}`);
  };
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || params.get('service') || '';
  });
  const [filters, setFilters] = useState({
    sortBy: 'priority',
    rating: '',
    minPrice: '',
    maxPrice: 10000
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tailors, setTailors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    coordinates
  } = useLocationStore();
  useEffect(() => {
    const fetchTailors = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/customers/tailors', {
          params: {
            lat: coordinates?.lat,
            lng: coordinates?.lng,
            sortBy: filters.sortBy,
            rating: filters.rating,
            maxPrice: filters.maxPrice
          }
        });
        if (response.data.success) {
          setTailors(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching tailors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTailors();
  }, [coordinates, filters]);
  const searchTerm = search.trim().toLowerCase();
  const filteredTailors = tailors.filter(t => (t.shopName || "").toLowerCase().includes(searchTerm) || (t.specializations || []).some(s => s.toLowerCase().includes(searchTerm)));
  if (isLoading && tailors.length === 0) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Spin size={40} className="text-[#843D9B] animate-spin mb-4" />
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching Experts...</Txt>
            </Box></Screen>;
  }
  return <Screen className="bg-[#F7F8FC]"><Box className="flex-1 bg-[#F7F8FC] font-sans selection:bg-[#843D9B] selection:text-white">
            <TailorFilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />


            {/* 1. Premium Sticky Header */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-5 pt-safe shadow-sm">
                <Box className="flex items-center justify-between mb-4">
                    <Box className="flex items-center gap-3">
                        <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors active:scale-90">
                            <I icon={ArrowLeft} size={22} />
                        </Btn>
                        <Box>
                            <Txt className="text-xl font-black text-gray-900 leading-none">Find Experts</Txt>
                            <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Available Near You</Txt>
                        </Box>
                    </Box>
                    <Btn onPress={() => setIsFilterOpen(true)} className="p-2.5 bg-gray-50 rounded-xl text-gray-500 border border-gray-100 active:scale-95 transition-all relative z-50 cursor-pointer">
                        <I icon={Filter} size={18} />
                        {(filters.rating || filters.maxPrice < 10000 || filters.sortBy !== 'priority') && <Txt className="absolute -top-1 -right-1 w-3 h-3 bg-[#843D9B] rounded-full border-2 border-white"></Txt>}
                    </Btn>
                </Box>

                {/* Search Bar with Internal Shadows */}
                <Box className="max-w-3xl mx-auto relative group">
                    <Box className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <I icon={Search} className="h-4 w-4 text-gray-400 group-focus-within:text-[#843D9B] transition-colors" />
                    </Box>
                    <Input placeholder="Search by name, expertise..." value={search} onChangeText={e => setSearch(e)} className="w-full pl-10 pr-4 py-3 bg-gray-100/50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#843D9B]/10 focus:bg-white focus:border-[#843D9B]/20 transition-all placeholder:text-gray-400" />
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            {/* 2. Tailor Count & Sort info */}
            <Box className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
                <Txt className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    {filteredTailors.length} Verified Tailors Found
                </Txt>
                <Box className="flex gap-2 items-center">
                    <Box className="h-5 w-px bg-gray-200" />
                    <Btn onPress={() => setIsFilterOpen(true)} className="text-xs font-black text-[#843D9B] cursor-pointer hover:underline">
                        Sort By: {filters.sortBy === 'priority' ? 'Recommended' : filters.sortBy === 'rating' ? 'Rating' : filters.sortBy === 'price_low' ? 'Lowest Price' : 'Highest Price'}
                    </Btn>
                </Box>
            </Box>

            {/* 3. Modern List */}
            <Box className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <React.Fragment>
                    {filteredTailors.length > 0 ? filteredTailors.map((tailor, index) => <Box key={tailor._id}>
                                <Btn onPress={e => handleTailorClick(e, tailor._id)} className="block bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden h-full">
                                    {/* Subtle Gradient Hover Effect */}
                                    <Box className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#843D9B]/5 to-transparent rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500"></Box>

                                    <Box className="flex gap-4 items-start relative z-10">
                                        {/* Profile Picture with Status Ring */}
                                        <Box className="relative shrink-0">
                                            <Box className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName || 'Tailor Partner'} className="w-full h-full scale-110" />
                                            </Box>
                                            <Box className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-green-500/20"></Box>
                                        </Box>

                                        {/* Core Info */}
                                        <Box className="flex-1 min-w-0 pt-1">
                                            <Box className="flex justify-between items-start mb-1">
                                                <Box className="flex items-center gap-1.5 min-w-0">
                                                    <Txt className="font-black text-gray-900 truncate tracking-tight">{tailor.shopName || 'Tailor Partner'}</Txt>
                                                    <I icon={ShieldCheck} size={14} className="text-[#843D9B] shrink-0" />
                                                </Box>
                                                <Box className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-[#843D9B] rounded-lg text-[10px] font-black border border-[#843D9B]/10">
                                                    {tailor.rating || 0} <I icon={Star} size={8} className="fill-[#843D9B] text-[#843D9B]" />
                                                </Box>
                                            </Box>

                                            <Box className="flex items-center gap-2 mb-2">
                                                <Txt className="text-[11px] text-[#843D9B] font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    {tailor.specializations?.[0] || 'Expert Tailor'}
                                                </Txt>
                                                {tailor.isAvailable && <Box className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-black border border-amber-100 shadow-sm animate-pulse">
                                                        <I icon={Clock} size={8} /> AVAILABLE
                                                    </Box>}
                                            </Box>

                                            <Box className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                <Txt className="flex items-center gap-1.5"><I icon={MapPin} size={12} className="text-gray-300" /> {tailor.distance || 'Near You'}</Txt>
                                                <Txt className="text-gray-200">|</Txt>
                                                <Txt>{tailor.totalReviews || 0} Reviews</Txt>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Action Footnote */}
                                    <Box className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <Box className="flex gap-2">
                                            {(tailor.specializations || []).slice(0, 2).map((tag, i) => <Txt key={i} className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase">
                                                    {tag}
                                                </Txt>)}
                                        </Box>
                                        <Btn className="text-[11px] font-black text-[#843D9B] flex items-center gap-1 group/btn">
                                            View Details <I icon={ChevronRight} size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Btn>
                                    </Box>
                                </Btn>
                            </Box>) : <Box className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                            <Box className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <I icon={Search} size={32} />
                            </Box>
                            <Txt className="text-lg font-bold text-gray-900">No Experts Found</Txt>
                            <Txt className="text-xs text-gray-400 px-10 leading-relaxed mt-2">
                                We couldn't find any tailors matching "{search}". Try searching for categories like 'Bridal' or 'Suits'.
                            </Txt>
                        </Box>}
                </React.Fragment>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default TailorListing;
