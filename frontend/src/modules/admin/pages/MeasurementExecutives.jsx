import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, MapPin, CheckCircle2, Star, Mail, Phone, Clock, FileText, Ban, Ruler, CreditCard, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const MeasurementExecutives = () => {
    const [selectedTab, setSelectedTab] = useState('All Executives');
    const [selectedExec, setSelectedExec] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [executivesData, setExecutivesData] = useState([]);
    const [pendingData, setPendingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = ['All Executives', 'Pending Applications'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [allRes, pendingRes] = await Promise.all([
                api.get('/measurement-executive/admin/executives'),
                api.get('/measurement-executive/admin/executives?status=pending')
            ]);

            const mapExec = (exec) => ({
                id: exec._id,
                name: exec.user?.name || 'Unnamed Executive',
                email: exec.user?.email || 'N/A',
                phone: exec.user?.phoneNumber || 'N/A',
                avatar: exec.profilePhoto || exec.user?.profileImage,
                joined: exec.createdAt ? new Date(exec.createdAt).toLocaleDateString() : 'N/A',
                address: exec.address || 'Location Not Provided',
                serviceRadius: exec.serviceRadius || 10,
                status: exec.verificationStatus || 'pending',
                availability: exec.availabilityStatus || 'offline',
                rating: exec.rating || 0,
                totalMeasurements: exec.totalMeasurements || 0,
                aadharNumber: exec.aadharNumber || 'Not Uploaded',
                documents: exec.documents || [],
                bankDetails: exec.bankDetails || {},
                walletBalance: exec.walletBalance || 0,
                totalEarned: exec.totalEarned || 0,
                emergencyContact: exec.emergencyContact || {},
                userActive: exec.user?.isActive ?? false
            });

            setExecutivesData((allRes.data.data || []).map(mapExec));
            setPendingData((pendingRes.data.data || []).map(mapExec));
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Error fetching measurement executives:', error);
            toast.error('Failed to load measurement executives');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/measurement-executive/admin/executives/${id}/status`, { verificationStatus: status });
            toast.success(`Executive ${status === 'verified' ? 'approved' : status} successfully`);
            setSelectedExec(null);
            setSelectedApp(null);
            fetchData();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Status update failed', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'verified':
            case 'Approved':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'pending':
            case 'Pending Review':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'rejected':
            case 'Suspended':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredExecutives = executivesData.filter(exec =>
        exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.phone.includes(searchQuery) ||
        exec.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPending = pendingData.filter(exec =>
        exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.phone.includes(searchQuery)
    );

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Measurement Executives</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage, approve, and verify at-home measurement executives</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                            {tab === 'Pending Applications' && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {pendingData.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search executives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative">
                {isLoading && (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3"></div>
                    </div>
                )}

                {selectedTab === 'All Executives' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Executive Details</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Service Area & Radius</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Availability</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredExecutives.length > 0 ? (
                                    filteredExecutives.map((exec) => (
                                        <tr
                                            key={exec.id}
                                            onClick={() => setSelectedExec(exec)}
                                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-primary font-black text-sm overflow-hidden">
                                                        {exec.avatar && exec.avatar !== 'default_profile.png' ? (
                                                            <img src={exec.avatar} alt={exec.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            exec.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{exec.name}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">Joined {exec.joined}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                        <Mail size={12} className="text-gray-400" /> {exec.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                                                        <Phone size={10} className="text-gray-400" /> {exec.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                        <MapPin size={12} className="text-gray-400" /> {exec.address}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                                                        <Ruler size={10} className="text-gray-400" /> Radius: {exec.serviceRadius} km
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
                                                        <Star size={12} className="fill-orange-500" /> {exec.rating ? exec.rating.toFixed(1) : 'New'}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-medium">{exec.totalMeasurements} Measurements</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    exec.availability === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${exec.availability === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                                    {exec.availability.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(exec.status)}`}>
                                                    {exec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-24 text-center text-gray-400">
                                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-black text-gray-900 uppercase tracking-widest">No Executives Found</p>
                                            <p className="text-xs font-medium mt-2">Try updating your search query or filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full">
                        {filteredPending.length > 0 ? (
                            filteredPending.map((app) => (
                                <div key={app.id} className="bg-white border text-left border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-primary font-black text-lg overflow-hidden">
                                                {app.avatar && app.avatar !== 'default_profile.png' ? (
                                                    <img src={app.avatar} alt={app.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    app.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-gray-900 mt-4">{app.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                                            <Mail size={12} className="text-gray-400" /> {app.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                                            <Phone size={12} className="text-gray-400" /> {app.phone}
                                        </div>
                                        <div className="flex gap-4 mt-4 text-[10px] text-gray-400 font-bold">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} /> {app.address}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Ruler size={12} /> {app.serviceRadius} km radius
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => setSelectedApp(app)} className="flex-1 py-2.5 bg-gray-50 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-black uppercase tracking-widest rounded-xl border border-gray-100">
                                            Review Application
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-black text-gray-900 uppercase tracking-widest">No Pending Applications</p>
                                <p className="text-xs font-medium mt-2 max-w-sm text-center">There are no measurement executive applications waiting for review.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Executive Detail Drawer */}
            <AnimatePresence>
                {selectedExec && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedExec(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-primary to-primary-dark text-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl overflow-hidden">
                                        {selectedExec.avatar && selectedExec.avatar !== 'default_profile.png' ? (
                                            <img src={selectedExec.avatar} alt={selectedExec.name} className="h-full w-full object-cover" />
                                        ) : (
                                            selectedExec.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{selectedExec.name}</h2>
                                        <p className="text-xs text-white/60 font-bold mt-1 flex items-center gap-1.5">
                                            <Ruler size={12} /> Service Radius: {selectedExec.serviceRadius} km
                                        </p>
                                        <div className="flex gap-3 mt-2">
                                            <div className="inline-block px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-white/10 text-white border border-white/20">
                                                {selectedExec.status}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                                <Star size={10} /> Rating: {selectedExec.rating ? selectedExec.rating.toFixed(1) : 'New'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedExec(null)}
                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fbfcfb]">

                                {/* Contact Info */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                        <User size={12} /> Personal & Contact Info
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <Phone size={16} className="text-primary opacity-70" /> {selectedExec.phone}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <Mail size={16} className="text-primary opacity-70" /> {selectedExec.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <MapPin size={16} className="text-primary opacity-70" /> {selectedExec.address}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <ShieldCheck size={16} className="text-primary opacity-70" /> Aadhar: {selectedExec.aadharNumber}
                                    </div>
                                </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-orange-500"><Star size={20} className="fill-orange-500" /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedExec.rating ? selectedExec.rating.toFixed(1) : '0.0'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Rating</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-primary"><CheckCircle2 size={20} /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedExec.totalMeasurements}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Measurements</p>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                        <Wallet size={12} /> Earnings & Financials
                                    </h3>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-xs text-gray-500 font-medium">Wallet Balance</span>
                                        <span className="text-sm font-black text-gray-900">₹{selectedExec.walletBalance}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                                        <span className="text-xs text-gray-500 font-medium">Total Earned</span>
                                        <span className="text-sm font-black text-emerald-600">₹{selectedExec.totalEarned}</span>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                {selectedExec.bankDetails && (selectedExec.bankDetails.accountNumber || selectedExec.bankDetails.upiId) && (
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                            <CreditCard size={12} /> Bank Information
                                        </h3>
                                        {selectedExec.bankDetails.accountName && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-medium">Account Name</span>
                                                <span className="font-bold text-gray-800">{selectedExec.bankDetails.accountName}</span>
                                            </div>
                                        )}
                                        {selectedExec.bankDetails.bankName && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-medium">Bank</span>
                                                <span className="font-bold text-gray-800">{selectedExec.bankDetails.bankName}</span>
                                            </div>
                                        )}
                                        {selectedExec.bankDetails.accountNumber && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-medium">Account Number</span>
                                                <span className="font-bold text-gray-800">{selectedExec.bankDetails.accountNumber}</span>
                                            </div>
                                        )}
                                        {selectedExec.bankDetails.ifscCode && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-medium">IFSC Code</span>
                                                <span className="font-bold text-gray-800">{selectedExec.bankDetails.ifscCode}</span>
                                            </div>
                                        )}
                                        {selectedExec.bankDetails.upiId && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-medium">UPI ID</span>
                                                <span className="font-bold text-primary">{selectedExec.bankDetails.upiId}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Emergency Contact */}
                                {selectedExec.emergencyContact && selectedExec.emergencyContact.name && (
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                            <AlertCircle size={12} /> Emergency Contact
                                        </h3>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-medium">Name</span>
                                            <span className="font-bold text-gray-800">{selectedExec.emergencyContact.name}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-medium">Phone</span>
                                            <span className="font-bold text-gray-800">{selectedExec.emergencyContact.phone}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Documents */}
                                {selectedExec.documents && selectedExec.documents.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <FileText size={12} /> Uploaded Documents
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedExec.documents.map((doc, i) => (
                                                <a
                                                    key={i}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={14} className="text-gray-400 group-hover:text-primary" />
                                                        <span className="text-xs font-bold text-gray-700">{doc.name || `Document ${i+1}`}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">View</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                                {selectedExec.status === 'pending' ? (
                                    <>
                                        <button onClick={() => handleUpdateStatus(selectedExec.id, 'rejected')} className="px-4 py-3 border border-red-100 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Ban size={14} /> Reject
                                        </button>
                                        <button onClick={() => handleUpdateStatus(selectedExec.id, 'verified')} className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-purple-900/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle2 size={14} /> Approve
                                        </button>
                                    </>
                                ) : selectedExec.status === 'verified' ? (
                                    <>
                                        <button onClick={() => handleUpdateStatus(selectedExec.id, 'rejected')} className="px-4 py-3 border border-red-100 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Ban size={14} /> Suspend
                                        </button>
                                        <button onClick={() => setSelectedExec(null)} className="px-4 py-3 bg-gray-100 text-gray-700 text-xs font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleUpdateStatus(selectedExec.id, 'verified')} className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-purple-900/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2 col-span-2">
                                            <CheckCircle2 size={14} /> Re-verify / Approve
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Application Review Modal */}
                {selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedApp(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">Review Executive Application</h2>
                                    <button onClick={() => setSelectedApp(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl overflow-hidden">
                                            {selectedApp.avatar && selectedApp.avatar !== 'default_profile.png' ? (
                                                <img src={selectedApp.avatar} alt={selectedApp.name} className="h-full w-full object-cover" />
                                            ) : (
                                                selectedApp.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">{selectedApp.name}</h3>
                                            <p className="text-sm font-bold text-primary">Service Radius: {selectedApp.serviceRadius} km</p>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <Mail size={12} className="text-gray-400" /> {selectedApp.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <Phone size={12} className="text-gray-400" /> {selectedApp.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <MapPin size={12} className="text-gray-400" /> {selectedApp.address}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Application Documents */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Submitted Documents & Info</h4>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500 font-medium">Aadhar Number</span>
                                                <span className="font-bold text-gray-900">{selectedApp.aadharNumber}</span>
                                            </div>
                                        </div>

                                        {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedApp.documents.map((doc, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-4 border border-gray-100 bg-gray-50 rounded-2xl flex items-center justify-between hover:bg-white hover:shadow-md transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="text-primary" size={20} />
                                                            <span className="text-xs font-bold text-gray-800">{doc.name || `Document ${idx+1}`}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-primary uppercase">View</span>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No document attachments uploaded.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                        className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all text-xs font-black uppercase tracking-widest rounded-xl"
                                    >
                                        Reject Application
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'verified')}
                                        className="flex-1 py-3 bg-primary text-white hover:bg-primary-dark transition-all text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-purple-900/20"
                                    >
                                        Approve Executive
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MeasurementExecutives;
