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
        <div className="min-h-screen bg-[#F5F5F5] pb-24 flex flex-col relative pt-5">

            <div className="flex-1 p-5 space-y-4">
                {/* Title */}
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">
                    Customer Measurements
                </h2>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#2D2F6E] text-sm text-gray-900 shadow-sm"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex bg-gray-200/30 rounded-2xl p-1 gap-1 overflow-x-auto custom-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[12px] font-black tracking-wide transition-all ${
                                activeFilter === filter
                                    ? 'bg-[#2D2F6E] text-white shadow-md shadow-[#2D2F6E]/20'
                                    : 'text-gray-500 hover:text-gray-800'
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
                            <div className="h-6 w-6 border-2 border-[#2D2F6E] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProfiles.map((profile, i) => {
                        const avatarChar = profile.profileName?.charAt(0) || 'C';
                        return (
                            <div 
                                key={profile._id || i}
                                onClick={() => navigate(`/partner/measurements/${profile._id}`)}
                                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4 cursor-pointer active:scale-[0.99] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-700 text-lg relative">
                                            {avatarChar}
                                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${profile.status === 'Expired' ? 'bg-red-400' : 'bg-[#10B981]'}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-[17px] font-black text-gray-900">{profile.profileName}</h4>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                Last updated: {profile.updatedTime || new Date(profile.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[20px] font-black text-[#2D2F6E] leading-none">
                                            {profile.metrics || Object.keys(profile.measurements || {}).length || '12'}
                                        </p>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Metrics</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="flex gap-1.5">
                                        {(profile.tags || [profile.garmentType]).map((tag, idx) => (
                                            <span 
                                                key={idx} 
                                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
                                                    tag === 'EXPIRED' 
                                                        ? 'bg-red-50 text-red-500' 
                                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <button className="text-[12px] font-black text-[#2D2F6E] flex items-center gap-1 hover:underline">
                                        View Profile <ChevronRight size={14} strokeWidth={3} />
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
                className="fixed bottom-28 right-5 w-14 h-14 bg-[#2D2F6E] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2D2F6E]/30 active:scale-95 transition-all z-20"
            >
                <UserPlus size={24} />
            </button>
        </div>
    );
};

export default MeasurementList;
