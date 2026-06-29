import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { useMeasurementAuth } from '../context/MeasurementAuthContext';
import { ClipboardList, CheckCircle, TrendingUp, MapPin, User, ChevronRight, AlertCircle, Power, Bell, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import useUnifiedLocation from '../../../shared/hooks/useUnifiedLocation';

const Dashboard = () => {
    const navigate = useNavigate();
    const { profile, stats, loading, fetchDashboard, toggleAvailability } = useMeasurementStore();
    const { isSocketConnected } = useMeasurementAuth();
    const { detectLocation } = useUnifiedLocation({ fetchAddress: false });

    const executiveName = profile?.user?.name || profile?.name || 'Measurement Executive';
    const addressName = profile?.address || 'Location not set';
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const handleRefreshLocation = async () => {
        setIsFetchingLocation(true);
        toast.loading('Fetching precise location...', { id: 'loc-toast-refresh' });
        try {
            const data = await detectLocation();
            if (data && data.latitude && data.longitude) {
                await useMeasurementStore.getState().updateLocation([data.longitude, data.latitude]);
                await fetchDashboard(); // refresh profile to get exact address
                toast.success(`Location updated`, { id: 'loc-toast-refresh' });
            }
        } catch (error) {
            console.error('Location error:', error);
            toast.error('Failed to update location', { id: 'loc-toast-refresh' });
        } finally {
            setIsFetchingLocation(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleToggleStatus = async () => {
        try {
            const newStatus = profile?.availabilityStatus === 'online' ? 'offline' : 'online';
            
            if (newStatus === 'online') {
                toast.loading('Fetching location...', { id: 'loc-toast' });
                try {
                    const data = await detectLocation();
                    if (data && data.latitude && data.longitude) {
                        await useMeasurementStore.getState().updateLocation([data.longitude, data.latitude]);
                        await toggleAvailability(newStatus);
                        toast.success(`You are now online`, { id: 'loc-toast' });
                    }
                } catch (error) {
                    console.error('Location error:', error);
                    toast.error('Location required to go online. Please enable it or set manually.', { id: 'loc-toast' });
                }
            } else {
                await toggleAvailability(newStatus);
                toast.success(`You are now offline`);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading || !profile) {
        return <div className="p-4 flex justify-center">Loading dashboard...</div>;
    }

    if (profile.verificationStatus !== 'verified') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Your account is currently <strong>{profile.verificationStatus || 'pending'}</strong>. You will be able to receive measurement requests once approved by an admin.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isOnline = profile?.availabilityStatus === 'online';

    const statCards = [
        { name: 'Pending Requests', value: stats?.totalPending || 0, icon: ClipboardList, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { name: 'Completed Today', value: stats?.completedToday || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Total Measurements', value: stats?.totalMeasurements || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            {/* ── HEADER ── */}
            <div className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <div className="w-11 h-11 bg-indigo-50 text-[#843D9B] font-black text-xl rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                            {executiveName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h2 className="text-[15px] font-black text-gray-900 leading-tight tracking-tight truncate">
                                {executiveName}
                            </h2>
                            <div className="flex items-center mt-0.5">
                                <MapPin size={10} className="text-[#843D9B] shrink-0 mr-1" />
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                    {addressName}
                                </span>
                                <button 
                                    onClick={handleRefreshLocation} 
                                    className="ml-1.5 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0 border border-gray-100 flex items-center justify-center"
                                    title="Detect Location"
                                >
                                    <Navigation size={9} className={`${isFetchingLocation ? 'animate-pulse text-[#843D9B]' : 'text-gray-400'}`} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Status Toggle */}
                        <button
                            onClick={handleToggleStatus}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
                                isOnline 
                                    ? 'bg-[#843D9B]/10 border-[#843D9B]/20 text-[#843D9B]' 
                                    : 'bg-gray-100 border-gray-200 text-gray-500'
                            }`}
                        >
                            {isOnline ? 'Online' : 'Offline'}
                            <Power size={10} />
                        </button>
                        
                        <button className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm relative shrink-0">
                            <AlertCircle size={18} />
                        </button>
                        <button className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm relative shrink-0">
                            <Bell size={18} />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[6px] font-black text-white">0</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 mt-6 max-w-lg mx-auto">
                
                {/* Purple Stats Card */}
                <div className="bg-gradient-to-br from-[#6b2c80] to-[#843D9B] rounded-[24px] p-6 shadow-xl relative overflow-hidden mb-6">
                    {/* Decorative Elements */}
                    <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute left-10 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl -mb-10" />
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Total Measurements</p>
                        <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{stats?.totalMeasurements || 0}</h3>
                        <p className="text-[11px] font-medium text-white/80 mb-6 max-w-[200px] leading-relaxed">
                            Completed measurements will update your total count immediately.
                        </p>
                        
                        <button className="bg-white text-[#843D9B] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full flex items-center gap-1 w-fit shadow-lg shadow-black/10 active:scale-95 transition-transform">
                            VIEW DETAILS <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Floating accents */}
                    <div className="absolute right-6 bottom-6 w-24 h-24 bg-[#5a246b] rounded-2xl rotate-12 opacity-50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    </div>
                    <div className="absolute right-24 bottom-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg rotate-12">
                        M
                    </div>
                    <div className="absolute right-4 bottom-20 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-[10px] shadow-lg -rotate-12">
                        M
                    </div>
                </div>

                {/* Stats Grid (4 columns) */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex justify-between items-center mb-6">
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-1">
                            <ClipboardList size={18} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today</span>
                        <span className="text-sm font-black text-gray-900">{stats?.completedToday || 0}</span>
                        <span className="text-[8px] font-bold text-gray-400">Done</span>
                    </div>

                    <div className="w-px h-12 bg-gray-100" />

                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-1">
                            <AlertCircle size={18} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                        <span className="text-sm font-black text-gray-900">{stats?.totalPending || 0}</span>
                        <span className="text-[8px] font-bold text-gray-400">Tasks</span>
                    </div>

                    <div className="w-px h-12 bg-gray-100" />

                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-black text-gray-900">{stats?.totalMeasurements || 0}</span>
                        <span className="text-[8px] font-bold text-gray-400">Tasks</span>
                    </div>

                    <div className="w-px h-12 bg-gray-100" />

                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-1">
                            <CheckCircle size={18} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                        <span className={`text-sm font-black ${isSocketConnected ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {isSocketConnected ? '4.8' : '0.0'}
                        </span>
                        <span className={`text-[8px] font-bold ${isSocketConnected ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {isSocketConnected ? 'Excellent' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Live Task Action Card */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-4 rotate-3">
                        <ClipboardList size={24} />
                    </div>
                    {stats?.totalPending > 0 ? (
                        <>
                            <h3 className="text-[15px] font-black text-gray-800 mb-1">
                                You have active tasks, there {stats.totalPending === 1 ? 'is' : 'are'} <span className="text-[#843D9B]">{stats.totalPending} pending</span> {stats.totalPending === 1 ? 'request' : 'requests'}!
                            </h3>
                            <button className="mt-5 bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-[#843D9B]/30 hover:shadow-xl hover:shadow-[#843D9B]/40 active:scale-95 transition-all">
                                VIEW LIVE POOL
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-[15px] font-black text-gray-800 mb-1">
                                You have no active tasks currently.
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">Keep your status online to receive new requests.</p>
                            <button className="mt-5 bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-[#843D9B]/30 hover:shadow-xl hover:shadow-[#843D9B]/40 active:scale-95 transition-all">
                                VIEW LIVE POOL
                            </button>
                        </>
                    )}
                </div>

                {/* Verification Warning */}
                {profile?.verificationStatus !== 'verified' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Verification Pending</h4>
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                Your account is currently <strong>{profile?.verificationStatus || 'pending'}</strong>. You will be able to receive measurement requests once approved by an admin.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
