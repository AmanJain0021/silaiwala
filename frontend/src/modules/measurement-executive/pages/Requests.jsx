import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { MapPin, Clock, Navigation, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Requests = () => {
    const { requests, loading, fetchRequests, acceptRequest, rejectRequest } = useMeasurementStore();
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchRequests(activeTab);
    }, [activeTab]);

    const handleAccept = async (id) => {
        try {
            await acceptRequest(id);
            toast.success('Request accepted!');
        } catch (error) {
            toast.error('Failed to accept request');
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectRequest(id);
            toast.success('Request rejected.');
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Measurement Requests</h1>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['pending', 'active', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-8">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="text-center p-8 bg-white shadow rounded-lg text-gray-500">
                    No {activeTab} requests found.
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {req.customer?.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">Order ID: {req.order?.orderId}</p>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                                    <div className="flex items-start">
                                        <div>
                                            <div className="flex items-start text-sm text-gray-600 mb-2">
                                                <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                                <span>{req.customerAddress?.street}, {req.customerAddress?.city}</span>
                                            </div>
                                            
                                            {req.tailor && (
                                                <div className="flex items-start text-sm text-gray-600 mb-2">
                                                    <User className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                                    <span>Tailor: {req.tailor.name}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-4 mt-3 ml-7">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    <Navigation className="h-3.5 w-3.5 text-sky-500" />
                                                    {req.distance ? `${req.distance} km` : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                    {req.distance ? `${Math.round(req.distance * 2)} min` : 'N/A'}
                                                </div>
                                                
                                                {req.customerLocation?.coordinates && (
                                                    <a 
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${req.customerLocation.coordinates[1]},${req.customerLocation.coordinates[0]}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        <Navigation className="h-3.5 w-3.5" />
                                                        Navigate
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {req.scheduledTime && (
                                        <div className="flex items-center">
                                            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                            <span>
                                                {new Date(req.scheduledTime).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-end space-x-3">
                                    {req.status === 'assigned' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(req._id)}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(req._id)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Accept Request
                                            </button>
                                        </>
                                    )}
                                    {['accepted', 'otp_sent', 'otp_verified', 'measurements_uploaded', 'completed'].includes(req.status) && (
                                        <Link
                                            to={`/executive/requests/${req._id}`}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            View Details
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Requests;
