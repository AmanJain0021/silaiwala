import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { MapPin, Clock, Navigation, User, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PullToRefresh from 'react-simple-pull-to-refresh';

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
        <PullToRefresh onRefresh={async () => await fetchRequests(activeTab)}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#843D9B] flex items-center justify-center text-white shadow-lg shadow-purple-200 shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">Measurement Requests</h1>
                    <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">Manage your assigned tasks</p>
                </div>
            </div>

            {/* Premium Tabs */}
            <div className="mb-3 sm:mb-8 w-full">
                <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm w-full">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-[#843D9B] text-white shadow-md' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon size={14} strokeWidth={isActive ? 3 : 2} className="shrink-0 sm:w-4 sm:h-4" />
                                <span className="truncate">{tab.label}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 pb-20 sm:pb-0">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-white shadow-md sm:shadow-xl shadow-gray-200/40 rounded-2xl sm:rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="p-2.5 sm:p-6">
                                <div className="flex items-start justify-between mb-2 sm:mb-6 gap-2">
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm sm:text-xl border border-blue-100 shrink-0">
                                            {req.customer?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-lg font-black text-gray-900 truncate leading-tight">
                                                {req.customer?.name}
                                            </h3>
                                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">Order: {req.order?.orderId}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center justify-center text-center px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 shrink-0 whitespace-nowrap">
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:flex sm:flex-col sm:space-y-4 gap-1.5 sm:gap-0 mb-2 sm:mb-6 text-sm text-gray-600 bg-gray-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-gray-50">
                                    <div className="flex items-start gap-1.5 sm:gap-3 col-span-2 sm:col-span-1">
                                        <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                            <MapPin className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-emerald-500" />
                                        </div>
                                        <div className="pt-0.5 min-w-0">
                                            <p className="text-[8px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0 sm:mb-1">Address</p>
                                            <p className="text-[9px] sm:text-sm font-medium text-gray-900 leading-tight truncate sm:whitespace-normal">{req.customerAddress?.street}, {req.customerAddress?.city}</p>
                                        </div>
                                    </div>
                                    
                                    {req.tailor && (
                                        <div className="flex items-start gap-1.5 sm:gap-3">
                                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                                <User className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-[#843D9B]" />
                                            </div>
                                            <div className="pt-0.5 min-w-0">
                                                <p className="text-[8px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0 sm:mb-1">Tailor</p>
                                                <p className="text-[9px] sm:text-sm font-medium text-gray-900 leading-tight truncate">{req.tailor.shopName || 'Tailor Partner'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {req.scheduledTime && (
                                        <div className="flex items-start gap-1.5 sm:gap-3">
                                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                                <Clock className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-amber-500" />
                                            </div>
                                            <div className="pt-0.5 min-w-0">
                                                <p className="text-[8px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0 sm:mb-1">Time</p>
                                                <p className="text-[9px] sm:text-sm font-medium text-gray-900 leading-tight truncate">{new Date(req.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-1 sm:gap-3 mb-2 sm:mb-6 bg-white p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-black text-slate-600 bg-slate-50 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl flex-1 justify-center min-w-0">
                                        <Navigation className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                                        <span className="truncate">{req.distance ? `${req.distance}km` : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-black text-slate-600 bg-slate-50 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl flex-1 justify-center min-w-0">
                                        <Clock className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
                                        <span className="truncate">{req.distance ? `${Math.round(req.distance * 2)}m` : 'N/A'}</span>
                                    </div>
                                    
                                    {req.customerLocation?.coordinates && (
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${req.customerLocation.coordinates[1]},${req.customerLocation.coordinates[0]}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg sm:rounded-xl text-[8px] sm:text-xs font-black uppercase tracking-wider transition-all min-w-0"
                                        >
                                            <Navigation className="h-2.5 w-2.5 sm:h-4 sm:w-4 shrink-0" />
                                            <span className="truncate hidden sm:inline">Navigate</span>
                                            <span className="truncate sm:hidden">Nav</span>
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-1.5 sm:gap-3">
                                    {(req.status === 'assigned' || req.status === 'pending') && (
                                        <>
                                            {req.status === 'assigned' && (
                                                <button
                                                    onClick={() => handleReject(req._id)}
                                                    className="flex-1 py-1.5 sm:py-3 px-2 sm:px-4 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1 sm:gap-2 min-w-0"
                                                >
                                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                                    <span className="truncate">Reject</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAccept(req._id)}
                                                className="flex-1 py-1.5 sm:py-3 px-2 sm:px-4 bg-[#843D9B] hover:bg-[#6b2f81] text-white rounded-lg sm:rounded-xl font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-md sm:shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-1 sm:gap-2 min-w-0"
                                            >
                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                                <span className="truncate">Accept</span>
                                            </button>
                                        </>
                                    )}
                                    {['accepted', 'otp_sent', 'otp_verified', 'measurements_uploaded', 'completed'].includes(req.status) && (
                                        <Link
                                            to={`/executive/requests/${req._id}`}
                                            className="w-full py-2 sm:py-4 bg-[#843D9B] hover:bg-[#6b2f81] text-white rounded-lg sm:rounded-xl font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-md sm:shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-w-0"
                                        >
                                            <span className="truncate">View Details</span>
                                            <Navigation className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </PullToRefresh>
    );
};

export default Requests;
