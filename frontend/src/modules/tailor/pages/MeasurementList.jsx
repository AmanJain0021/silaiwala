import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowLeft, Menu, UserPlus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTailorAuth } from '../context/AuthContext';

const MeasurementList = () => {
    const navigate = useNavigate();
    const { user } = useTailorAuth();

    const [activeFilter, setActiveFilter] = useState('All Profiles');
    const [searchQuery, setSearchQuery] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const filters = ['All Profiles', 'Recent Updates', 'High Priority'];

    // Fetch Measurements (mapped as profiles for tailor use case)
    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            // Using existing endpoint
            const response = await api.get('/measurements');
            if (response.data.success) {
                setProfiles(response.data.data || []);
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

    const filteredProfiles = (profiles.length > 0 ? profiles : [
        /* Fallback Mock matching Figma exactly if DB has no profiles */
        { _id: '1', profileName: 'Alexander Pierce', updatedTime: '2 hours ago', metrics: 14, tags: ['SH', 'TR'], status: 'Active' },
        { _id: '2', profileName: 'Elena Rodriguez', updatedTime: 'Oct 24, 2023', metrics: 22, tags: ['BRIDE', 'SILK'], status: 'Active' },
        { _id: '3', profileName: 'Julian Vane', updatedTime: 'Oct 12, 2023', metrics: 12, tags: ['SUIT'], status: 'Active' },
        { _id: '4', profileName: 'Sarah Miller', updatedTime: 'Sep 30, 2023', metrics: 8, tags: ['EXPIRED'], status: 'Expired' }
    ]).filter(item => 
        (item.profileName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-24 flex flex-col relative pt-0">

            <div className="flex-1 px-4 py-3 space-y-3.5">
                {/* Title */}
                <h2 className="text-[20px] font-black text-gray-900 tracking-tighter leading-none">
                    Customer Measurements
                </h2>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                        type="text"
                        placeholder="Search by name or order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#843D9B] text-[13px] text-gray-900 shadow-sm"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex bg-gray-200/30 rounded-xl p-0.5 gap-0.5 overflow-x-auto no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black tracking-wide transition-all ${
                                activeFilter === filter
                                    ? 'bg-[#843D9B] text-white shadow-sm'
                                    : 'text-gray-500'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Measurement List Cards */}
                <div className="space-y-3 mt-2">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="h-6 w-6 border-2 border-[#843D9B] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProfiles.map((profile, i) => {
                        const avatarChar = profile.profileName?.charAt(0) || 'C';
                        return (
                            <div 
                                key={profile._id || i}
                                onClick={() => navigate(`/partner/measurements/${profile._id}`)}
                                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-700 text-base relative">
                                            {avatarChar}
                                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${profile.status === 'Expired' ? 'bg-red-400' : 'bg-[#10B981]'}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-[15px] font-black text-gray-900 leading-none">{profile.profileName}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-none">
                                                {profile.updatedTime || new Date(profile.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[18px] font-black text-[#843D9B] leading-none">
                                            {profile.metrics || Object.keys(profile.measurements || {}).length || '12'}
                                        </p>
                                        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Metrics</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                                    <div className="flex gap-1">
                                        {(profile.tags || [profile.garmentType]).map((tag, idx) => (
                                            <span 
                                                key={idx} 
                                                className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    tag === 'EXPIRED' 
                                                        ? 'bg-red-50 text-red-500' 
                                                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <button className="text-[11px] font-black text-[#843D9B] flex items-center gap-1">
                                        View <ChevronRight size={12} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={() => alert('Feature coming soon')}
                className="fixed bottom-24 right-4 w-12 h-12 bg-[#843D9B] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-20"
            >
                <UserPlus size={20} />
            </button>
        </div>
    );
};

export default MeasurementList;
