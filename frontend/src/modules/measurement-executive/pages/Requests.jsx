import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { MapPin, Clock, Navigation, User, FileText, CheckCircle, XCircle } from 'lucide-react';
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

    const tabs = [
        { id: 'pending', label: 'Pending', icon: Clock },
        { id: 'active', label: 'Active', icon: Navigation },
        { id: 'completed', label: 'Completed', icon: CheckCircle }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#843D9B] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                    <FileText size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Measurement Requests</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your assigned tasks</p>
                </div>
            </div>

            {/* Premium Tabs */}
            <div className="mb-8">
                <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm inline-flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-[#843D9B] text-white shadow-md' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#843D9B]"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center p-12 bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 text-gray-500 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText size={28} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-600">No {activeTab} requests found.</p>
                    <p className="text-xs text-gray-400 mt-1">Check back later for new assignments.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100">
                                            {req.customer?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900">
                                                {req.customer?.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Order: {req.order?.orderId}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-6 text-sm text-gray-600 bg-gray-50/50 rounded-2xl p-4 border border-gray-50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Address</p>
                                            <p className="font-medium text-gray-900">{req.customerAddress?.street}, {req.customerAddress?.city}</p>
                                        </div>
                                    </div>
                                    
                                    {req.tailor && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                                <User className="h-4 w-4 text-[#843D9B]" />
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tailor</p>
                                                <p className="font-medium text-gray-900">{req.tailor.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {req.scheduledTime && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Scheduled Time</p>
                                                <p className="font-medium text-gray-900">{new Date(req.scheduledTime).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-xl flex-1 justify-center">
                                        <Navigation className="h-4 w-4 text-sky-500" />
                                        {req.distance ? `${req.distance} km` : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-xl flex-1 justify-center">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                        {req.distance ? `${Math.round(req.distance * 2)} min` : 'N/A'}
                                    </div>
                                    
                                    {req.customerLocation?.coordinates && (
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${req.customerLocation.coordinates[1]},${req.customerLocation.coordinates[0]}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                            <Navigation className="h-4 w-4" />
                                            Navigate
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    {req.status === 'assigned' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(req._id)}
                                                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(req._id)}
                                                className="flex-1 py-3 px-4 bg-[#843D9B] hover:bg-[#6b2f81] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} />
                                                Accept
                                            </button>
                                        </>
                                    )}
                                    {['accepted', 'otp_sent', 'otp_verified', 'measurements_uploaded', 'completed'].includes(req.status) && (
                                        <Link
                                            to={`/executive/requests/${req._id}`}
                                            className="w-full py-4 bg-[#843D9B] hover:bg-[#6b2f81] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Details
                                            <Navigation size={16} />
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
