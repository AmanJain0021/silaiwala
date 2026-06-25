import React, { useEffect, useState } from 'react';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { useMeasurementAuth } from '../context/MeasurementAuthContext';
import { ClipboardList, CheckCircle, TrendingUp, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useUnifiedLocation from '../../../shared/hooks/useUnifiedLocation';

const Dashboard = () => {
    const { profile, stats, loading, fetchDashboard, toggleAvailability } = useMeasurementStore();
    const { isSocketConnected } = useMeasurementAuth();
    const { detectLocation } = useUnifiedLocation({ fetchAddress: false });

    const executiveName = profile?.user?.name || profile?.name || 'Measurement Executive';
    const coords = profile?.currentLocation?.coordinates;
    const [addressName, setAddressName] = useState('Location not set');

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (coords && coords.length === 2) {
            setAddressName('Fetching address...');
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[1]}&lon=${coords[0]}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        const parts = data.display_name.split(',');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {executiveName}</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your measurement requests and tracking</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Current Status</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Toggle your status to start receiving measurement requests.
                    </p>
                </div>
                <div className="flex items-center">
                    <span className={`mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                    <button
                        onClick={handleToggleStatus}
                        className={`${
                            isOnline ? 'bg-green-600' : 'bg-gray-200'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                        <span className="sr-only">Toggle online status</span>
                        <span
                            aria-hidden="true"
                            className={`${
                                isOnline ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                {statCards.map((item) => (
                    <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className={`${item.bg} rounded-md p-3`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                        <dd className="text-3xl font-semibold text-gray-900">{item.value}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Connection Status</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'} mr-3`}></div>
                        <span className="text-sm text-gray-700">
                            {isSocketConnected ? 'Connected to live assignment server' : 'Disconnected from server'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
