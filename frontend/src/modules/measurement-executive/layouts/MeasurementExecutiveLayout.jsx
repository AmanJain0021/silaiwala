import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, LogOut, Menu, X, MapPin, Bell, Navigation, Wallet } from 'lucide-react';
import { MeasurementAuthProvider } from '../context/MeasurementAuthContext';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';

const LocationBanner = () => {
    const { profile } = useMeasurementStore();
    const coords = profile?.currentLocation?.coordinates;
    const [addressName, setAddressName] = useState('Location not set');
    const [isFetching, setIsFetching] = useState(false);

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

    const handleFetchLocation = () => {
        setIsFetching(true);
        toast.loading('Fetching precise location...', { id: 'loc-toast' });
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { longitude, latitude } = position.coords;
                    try {
                        await useMeasurementStore.getState().updateLocation([longitude, latitude]);
                        toast.success('Location updated successfully!', { id: 'loc-toast' });
                    } catch (err) {
                        toast.error('Failed to update location', { id: 'loc-toast' });
                    } finally {
                        setIsFetching(false);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    toast.error('Location permission denied.', { id: 'loc-toast' });
                    setIsFetching(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            toast.error('Geolocation is not supported', { id: 'loc-toast' });
            setIsFetching(false);
        }
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
                    onClick={handleFetchLocation}
                    disabled={isFetching}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Fetch Location"
                >
                    <Navigation className={`h-5 w-5 text-white ${isFetching ? 'animate-pulse' : ''}`} />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                </button>
            </div>
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
        <div className="h-screen flex overflow-hidden bg-gray-100">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
                <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
                
                <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-gray-800 transition duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <X className="h-6 w-6 text-white" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4">
                            <h1 className="text-white text-xl font-bold">Measurement Exec</h1>
                        </div>
                        <nav className="mt-5 px-2 space-y-1">
                            {navigation.map((item) => {
                                const active = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`${
                                            active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                    >
                                        <item.icon className={`${active ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-4 flex-shrink-0 h-6 w-6`} aria-hidden="true" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex bg-gray-700 p-4">
                        <button onClick={handleLogout} className="flex-shrink-0 group block w-full text-left text-gray-300 hover:text-white">
                            <div className="flex items-center">
                                <LogOut className="inline-block h-5 w-5 mr-3" />
                                <span className="text-sm font-medium">Logout</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true">{/* Force sidebar to shrink to fit close icon */}</div>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1 bg-gray-800">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4">
                                <h1 className="text-white text-xl font-bold">Measurement Exec</h1>
                            </div>
                            <nav className="mt-5 flex-1 px-2 space-y-1">
                                {navigation.map((item) => {
                                    const active = location.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`${
                                                active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                        >
                                            <item.icon className={`${active ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                        <div className="flex-shrink-0 flex bg-gray-700 p-4">
                            <button onClick={handleLogout} className="flex-shrink-0 w-full group block text-left text-gray-300 hover:text-white">
                                <div className="flex items-center">
                                    <LogOut className="inline-block h-5 w-5 mr-3" />
                                    <span className="text-sm font-medium">Logout</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <LocationBanner />
                <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex justify-between bg-white border-b border-gray-200">
                    <button
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex items-center px-4">
                        <span className="font-semibold text-gray-700">SilaiWala</span>
                    </div>
                </div>
                
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <Outlet />
                </main>
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
