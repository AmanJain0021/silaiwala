// Port of modules/tailor/pages/MeasurementList.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import { alert } from '../lib/alert';
import React, { useState, useEffect } from "react";
import { Search, Filter, ArrowLeft, Menu, UserPlus, ChevronRight } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { useTailorAuth } from "../context/tailor/AuthContext";
import { Box, Txt, I, Input, Btn, Scroll } from '../components/ui/primitives';
const MeasurementList = () => {
  const navigate = useNavigate();
  const {
    user
  } = useTailorAuth();
  const [activeFilter, setActiveFilter] = useState('All Profiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const filters = ['All Profiles', 'Recent Updates', 'High Priority'];

  // Fetch Orders to display as measurement profiles
  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tailors/orders');
      if (response.data.success) {
        const mappedProfiles = response.data.data.map(order => ({
          _id: order._id,
          orderId: order.orderId,
          profileName: order.customer?.name || 'Customer',
          updatedTime: order.createdAt,
          metrics: 12,
          tags: [order.status.toUpperCase()],
          status: order.status === 'delivered' ? 'Expired' : 'Active'
        }));
        setProfiles(mappedProfiles);
      }
    } catch (error) {
      console.error('Error fetching measurements profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProfiles();
  }, []);
  const filteredProfiles = profiles.filter(item => {
    const matchesSearch = (item.profileName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.orderId || '').toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (activeFilter === 'High Priority') {
      // Consider pending, accepted, or in-progress orders as high priority
      matchesFilter = ['PENDING', 'ACCEPTED', 'IN-PROGRESS'].includes(item.tags[0]);
    }
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (activeFilter === 'Recent Updates') {
      return new Date(b.updatedTime) - new Date(a.updatedTime);
    }
    // Default sorting
    return new Date(b.updatedTime) - new Date(a.updatedTime);
  });
  return <Box className="min-h-screen bg-[#F5F5F5] pb-24 flex flex-col relative pt-0">

            <Box className="flex-1 px-4 py-3 space-y-3.5">
                {/* Title */}
                <Txt className="text-[20px] font-black text-gray-900 tracking-tighter leading-none">
                    Customer Measurements
                </Txt>

                {/* Search */}
                <Box className="relative">
                    <I icon={Search} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <Input placeholder="Search by name or order ID..." value={searchQuery} onChangeText={e => setSearchQuery(e)} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#843D9B] text-[13px] text-gray-900 shadow-sm" />
                </Box>

                {/* Filter Pills */}
                <Scroll contentClassName="flex p-0.5 gap-0.5" className="bg-gray-200/30 rounded-xl no-scrollbar" horizontal>
                    {filters.map(filter => <Btn key={filter} onPress={() => setActiveFilter(filter)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black tracking-wide transition-all ${activeFilter === filter ? 'bg-[#843D9B] text-white shadow-sm' : 'text-gray-500'}`}>
                            {filter}
                        </Btn>)}
                </Scroll>

                {/* Measurement List Cards */}
                <Box className="space-y-3 mt-2">
                    {isLoading ? <Box className="flex justify-center py-10">
                            <Spin size={24} className="text-[#843D9B]" />
                        </Box> : filteredProfiles.map((profile, i) => {
          const avatarChar = profile.profileName?.charAt(0) || 'C';
          return <Btn key={profile._id || i} onPress={() => navigate(`/partner/measurements/${profile._id}`)} className="block bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-all">
                                <Box className="flex items-center justify-between">
                                    <Box className="flex items-center gap-2.5">
                                        <Box className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-700 text-base relative">
                                            {avatarChar}
                                            <Txt className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${profile.status === 'Expired' ? 'bg-red-400' : 'bg-[#10B981]'}`} />
                                        </Box>
                                        <Box>
                                            <Txt className="text-[15px] font-black text-gray-900 leading-none">{profile.profileName}</Txt>
                                            <Txt className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-none">
                                                {profile.updatedTime || new Date(profile.updatedAt).toLocaleDateString()}
                                            </Txt>
                                        </Box>
                                    </Box>
                                    <Box className="text-right">
                                        <Txt className="text-[18px] font-black text-[#843D9B] leading-none">
                                            {profile.metrics || Object.keys(profile.measurements || {}).length || '12'}
                                        </Txt>
                                        <Txt className="text-[7px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Metrics</Txt>
                                    </Box>
                                </Box>

                                <Box className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                                    <Box className="flex gap-1">
                                        {(profile.tags || [profile.garmentType]).map((tag, idx) => <Txt key={idx} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${tag === 'EXPIRED' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                {tag}
                                            </Txt>)}
                                    </Box>
                                    <Btn className="text-[11px] font-black text-[#843D9B] flex items-center gap-1">
                                        View <I icon={ChevronRight} size={12} strokeWidth={3} />
                                    </Btn>
                                </Box>
                            </Btn>;
        })}
                </Box>
            </Box>

            {/* Floating Action Button */}
            <Btn onPress={() => alert('Feature coming soon')} className="fixed bottom-24 right-4 w-12 h-12 bg-[#843D9B] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-20">
                <I icon={UserPlus} size={20} />
            </Btn>
        </Box>;
};
export default MeasurementList;
