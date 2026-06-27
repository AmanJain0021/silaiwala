import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ClipboardList, User, LogOut, Menu, X, MapPin, Bell, Navigation, Wallet } from 'lucide-react';
import { MeasurementAuthProvider } from '../context/MeasurementAuthContext';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import useUnifiedLocation from '../../../shared/hooks/useUnifiedLocation';
import ManualLocationModal from '../../../shared/components/ManualLocationModal';

const LocationBanner = () => {
    const { profile } = useMeasurementStore();
    const coords = profile?.currentLocation?.coordinates;
    const [addressName, setAddressName] = useState('Location not set');
    const [isFetching, setIsFetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { detectLocation } = useUnifiedLocation({ fetchAddress: true });
    
    // Auto-fetch on mount
    useEffect(() => {
        if (!coords || coords.length !== 2) {
            handleFetchLocation();
        }
    }, []);

    useEffect(() => {
        if (coords && coords.length === 2) {
            setAddressName('Fetching address...');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords[1]},${coords[0]}&key=${apiKey}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'OK' && data.results && data.results.length > 0) {
                        const parts = data.results[0].formatted_address.split(',');
                        // Take the first 3 parts for a concise location name
                        setAddressName(parts.slice(0, 3).join(','));
                    } else {
                        setAddressName(`Lat: ${coords[1].toFixed(4)}, Lng: ${coords[0].toFixed(4)}`);
                    }
                })
                .catch(() => {
                    setAddressName(`Lat: ${coords[1].toFixed(4)}, Lng: ${coords[0].toFixed(4)}`);
                });
        } else {
            setAddressName('Location not set');
        }
    }, [coords]);

    const handleFetchLocation = async () => {
        setIsFetching(true);
        toast.loading('Fetching precise location...', { id: 'loc-toast' });
        try {
            const data = await detectLocation();
            if (data && data.latitude && data.longitude) {
                await useMeasurementStore.getState().updateLocation([data.longitude, data.latitude]);
                toast.success('Location updated successfully!', { id: 'loc-toast' });
            }
        } catch (error) {
            toast.error('Failed to update location automatically.', { id: 'loc-toast' });
        } finally {
            setIsFetching(false);
        }
    };

    const handleSetManualLocation = async (place) => {
        // Save to local storage for global override
        localStorage.setItem('manual_location', JSON.stringify({
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.address
        }));
        
        // Immediately update store
        await useMeasurementStore.getState().updateLocation([place.longitude, place.latitude]);
        setAddressName(place.address);
        toast.success('Manual location set successfully!');
    };

    return (
        <div className="bg-[#8B3D9A] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 relative">
            <div className="flex items-center flex-1 min-w-0">
                <div className="bg-white/20 p-2 rounded-full mr-3 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col truncate pr-4">
                    <span className="text-[10px] font-bold tracking-wider text-purple-200 uppercase">Current Location</span>
                    <span className="text-sm font-semibold truncate text-white">
                        {addressName}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center text-xs font-semibold"
                    title="Set Location Manually"
                >
                    Manual
                </button>
                <button 
                    onClick={handleFetchLocation}
                    disabled={isFetching}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Auto Fetch Location"
                >
                    <Navigation className={`h-5 w-5 text-white ${isFetching ? 'animate-pulse' : ''}`} />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                </button>
            </div>
            
            <ManualLocationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLocationSet={handleSetManualLocation}
            />
        </div>
    );
};

const LayoutContent = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navigation = [
        { name: 'Dashboard', href: '/executive/dashboard', icon: Home },
        { name: 'Requests', href: '/executive/requests', icon: ClipboardList },
        { name: 'Wallet', href: '/executive/wallet', icon: Wallet },
        { name: 'Profile', href: '/executive/profile', icon: User },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/executive/login');
    };

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50 font-sans text-gray-900">
            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:flex-shrink-0 z-50">
                <div className="flex flex-col w-72 bg-[#0A0A0A] border-r border-[#1C1C1C]">
                    <div className="flex flex-col h-0 flex-1">
                        <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-8 mb-4">
                                <h1 className="text-xl font-black text-white leading-none tracking-tight">
                                    Measurement<span className="text-[#843D9B]">Exec</span>
                                </h1>
                            </div>
                            <nav className="mt-5 flex-1 px-4 space-y-2">
                                {navigation.map((item) => {
                                    const active = location.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`${
                                                active ? 'bg-[#843D9B] text-white shadow-xl shadow-[#843D9B]/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                            } group flex items-center px-5 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all`}
                                        >
                                            <item.icon className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'} mr-4 flex-shrink-0 h-[18px] w-[18px]`} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                        <div className="flex-shrink-0 flex p-6">
                            <button onClick={handleLogout} className="flex-shrink-0 w-full group block bg-white/5 hover:bg-white/10 rounded-2xl text-left text-gray-400 hover:text-white border border-white/5 transition-all p-4">
                                <div className="flex items-center">
                                    <LogOut className="inline-block h-5 w-5 mr-3" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden relative">
                {/* Mobile Header logic is handled in Dashboard.jsx, but we might want a generic one for other pages */}
                <main className="flex-1 relative z-0 overflow-y-auto custom-scrollbar md:p-8 lg:p-10 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>

                {/* ── BOTTOM NAVIGATION (MOBILE ONLY) ── */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className="flex flex-col items-center gap-1 relative min-w-[64px] py-1"
                            >
                                {isActive && (
                                    <motion.span 
                                        layoutId="bottomNavActive"
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#843D9B] rounded-full" 
                                    />
                                )}
                                <div className={`p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                                    isActive
                                        ? 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/30 scale-110'
                                        : 'text-gray-400 active:scale-90'
                                }`}>
                                    {React.createElement(item.icon, {
                                        size: 20,
                                        strokeWidth: isActive ? 2.5 : 2
                                    })}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    isActive ? 'text-[#843D9B]' : 'text-gray-400'
                                }`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

const MeasurementExecutiveLayout = () => {
    return (
        <MeasurementAuthProvider>
            <LayoutContent />
        </MeasurementAuthProvider>
    );
};

export default MeasurementExecutiveLayout;
