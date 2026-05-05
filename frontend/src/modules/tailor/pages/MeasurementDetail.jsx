import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Edit3, Ruler, Plus, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useTailorAuth } from '../context/AuthContext';

const MeasurementDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useTailorAuth();

    const [activeTab, setActiveTab] = useState('Top');
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const tabs = ['Top', 'Bottom', 'General'];

    const fetchProfileDetail = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/measurements`);
            if (response.data.success) {
                const found = response.data.data.find(m => m._id === id);
                if (found) setProfile(found);
            }
        } catch (error) {
            console.error('Error fetching measurement details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id && id !== '1' && id !== '2' && id !== '3' && id !== '4') {
            fetchProfileDetail();
        }
    }, [id]);

    // Fallback Mock Data matching Figma image exactly
    const mockData = {
        name: 'Eleanor Vance',
        clientId: '#ALT-8829',
        tags: ['Premium Client', '3 Orders Active'],
        topMetrics: [
            { label: 'Shoulder Width', value: '15.5' },
            { label: 'Bust', value: '34.0' },
            { label: 'Waist', value: '28.5' },
            { label: 'Sleeve Length', value: '23.2' },
            { label: 'Neck', value: '13.8' },
            { label: 'Arm Hole', value: '17.0' },
            { label: 'Bicep', value: '11.5' }
        ]
    };

    const finalProfile = profile ? {
        name: profile.profileName,
        clientId: `#ALT-${profile._id.substring(0, 4).toUpperCase()}`,
        tags: ['Client', `${profile.garmentType}`],
        topMetrics: Object.entries(profile.measurements || {}).map(([key, val]) => ({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: String(val)
        }))
    } : mockData;

    // Use first metric as the featured main card
    const featuredMetric = finalProfile.topMetrics[0] || { label: 'Metric', value: '0.0' };
    const gridMetrics = finalProfile.topMetrics.slice(1, 5);
    const rowMetrics = finalProfile.topMetrics.slice(5);

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-24 flex flex-col pt-5">

            <div className="flex-1 p-5 space-y-4 max-w-md mx-auto w-full">
                
                {/* Back Button */}
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate('/partner/measurements')} className="p-2.5 bg-white rounded-2xl border border-gray-100 text-gray-600 shadow-sm hover:text-[#2D2F6E] transition-all">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Back to Profiles</span>
                </div>

                {/* Customer Profile Card */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-700 text-2xl">
                            {finalProfile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-[18px] font-black text-gray-900">{finalProfile.name}</h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-0.5">Client ID: {finalProfile.clientId}</p>
                            <div className="flex gap-1.5 mt-2">
                                {finalProfile.tags.map((tag, idx) => (
                                    <span key={idx} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${idx === 1 ? 'bg-red-50 text-[#2D2F6E]' : 'bg-blue-50 text-blue-600'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center border border-gray-100">
                        <Edit3 size={18} />
                    </button>
                </div>

                {/* Tabs Row */}
                <div className="bg-gray-200/40 rounded-2xl p-1 flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${
                                activeTab === tab
                                    ? 'bg-white text-[#2D2F6E] shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Red Card (Featured Metric) */}
                <div className="bg-[#A02844] rounded-3xl p-6 text-white relative shadow-md">
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                        <Ruler size={70} color="white" />
                    </div>
                    <p className="text-[12px] text-white/70 font-bold tracking-wide uppercase">{featuredMetric.label}</p>
                    <p className="text-[40px] font-black tracking-tight leading-none mt-2">
                        {featuredMetric.value} <span className="text-[16px] font-medium opacity-80">inch</span>
                    </p>
                </div>

                {/* Sub-metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {gridMetrics.map((m, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{m.label}</p>
                            <p className="text-[20px] font-black text-gray-900 mt-1 leading-none">
                                {m.value} <span className="text-[10px] font-bold text-gray-400">in</span>
                            </p>
                        </div>
                    ))}
                </div>

                {/* Row Metrics (additional) */}
                <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {rowMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 px-2 first:pt-1 last:pb-1">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50/50 rounded-xl flex items-center justify-center text-blue-500">
                                    <Ruler size={16} />
                                </div>
                                <span className="text-[13px] font-bold text-gray-800">{m.label}</span>
                            </div>
                            <span className="text-[14px] font-black text-gray-900">{m.value} in</span>
                        </div>
                    ))}
                </div>

                {/* Add New Measurement Button */}
                <button 
                    onClick={() => alert('Add feature coming soon')}
                    className="w-full py-4 bg-[#2D2F6E] rounded-3xl text-[13px] font-black uppercase text-white shadow-lg shadow-[#2D2F6E]/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} strokeWidth={3} /> Add New Measurement
                </button>

                {/* Footer Banner */}
                <div className="bg-[#EBF1FF] text-[#1D4ED8] p-4 rounded-3xl flex items-start gap-3 border border-[#BFDBFE]/50 mt-2">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                        Measurements were last updated on {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} by Master Tailor {user?.name || 'Partner'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MeasurementDetail;
