import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, X, User, MapPin, CheckCircle2, Scissors, Building, Star, Mail, Phone, Clock, FileText, Ban } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminTailors = () => {
    const [selectedTab, setSelectedTab] = useState('All Tailors');
    const [selectedTailor, setSelectedTailor] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [tailorsData, setTailorsData] = useState([]);
    const [pendingData, setPendingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditCommissionModalOpen, setIsEditCommissionModalOpen] = useState(false);
    const [newCommission, setNewCommission] = useState('');
    const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

    const tabs = ['All Tailors', 'Pending Applications'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [allRes, pendingRes] = await Promise.all([
                api.get('/admin/users?role=tailor'),
                api.get('/admin/tailors/pending')
            ]);
            
            setTailorsData(allRes.data.data.map(t => ({
                id: t._id,
                name: t.name,
                joined: new Date(t.createdAt).toLocaleDateString(),
                specialty: t.profile?.specializations?.join(', ') || 'General Tailoring',
                location: t.profile?.location?.address || 'Not Provided',
                rating: t.profile?.rating || 4.8,
                completedOrders: t.profile?.totalReviews || 0,
                commission: t.profile?.commissionPercentage !== undefined ? `${t.profile.commissionPercentage}%` : '20%',
                commissionRaw: t.profile?.commissionPercentage !== undefined ? t.profile.commissionPercentage : 20,
                status: t.isActive ? 'Approved' : (t.isVerified ? 'Suspended' : 'Pending'),
                email: t.email,
                phone: t.phoneNumber,
                documents: t.profile?.documents || [],
                shopName: t.profile?.shopName,
                experience: t.profile?.experienceInYears,
                bio: t.profile?.bio
            })));

            setPendingData(pendingRes.data.data.map(t => ({
                id: t._id,
                name: t.name,
                email: t.email,
                phone: t.phoneNumber,
                status: 'Pending Review',
                specialty: t.profile?.specializations?.join(', ') || 'General Tailoring',
                location: t.profile?.location?.address || 'Not Provided',
                submittedDate: new Date(t.createdAt).toLocaleDateString(),
                documents: t.profile?.documents || [],
                bio: t.profile?.bio,
                experience: t.profile?.experienceInYears,
                shopName: t.profile?.shopName
            })));

        } catch (error) {
            console.error('Error fetching tailors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.put(`/admin/tailors/${id}/approve`);
            setSelectedApp(null);
            toast.success('Tailor approved successfully');
            fetchData();
        } catch (error) {
            console.error('Approval failed', error);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter reason for rejection (e.g. 'Aadhar card is not clear'):");
        if (!reason) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            await api.put(`/admin/tailors/${id}/reject`, { reason });
            setSelectedApp(null);
            toast.success('Tailor application rejected');
            fetchData();
        } catch (error) {
            console.error('Rejection failed', error);
        }
    };

    const handleEditCommission = async () => {
        if (!selectedTailor || !newCommission) return;
        
        setIsUpdatingCommission(true);
        try {
            await api.put(`/admin/tailors/${selectedTailor.id}/commission`, {
                commissionPercentage: Number(newCommission)
            });
            
            toast.success('Commission updated successfully');
            
            // Update local state to reflect change immediately
            setSelectedTailor(prev => ({
                ...prev,
                commission: `${newCommission}%`,
                commissionRaw: Number(newCommission)
            }));
            
            setIsEditCommissionModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update commission');
        } finally {
            setIsUpdatingCommission(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending Review': 
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredTailors = tailorsData.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.phone.includes(searchQuery) ||
        t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPending = pendingData.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tailor Management</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage vendor applications, performance, and commissions</p>
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
                            placeholder="Search tailors..." 
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
                {selectedTab === 'All Tailors' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Tailor Details</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Shop Info</th>
                                    <th className="px-6 py-4">Specialty & Location</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Commission</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTailors.map((tailor) => (
                                    <tr
                                        key={tailor.id}
                                        onClick={() => setSelectedTailor(tailor)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-primary font-black text-sm">
                                                    {tailor.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{tailor.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">Joined {tailor.joined}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                    <Mail size={12} className="text-gray-400" /> {tailor.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                                                    <Phone size={10} className="text-gray-400" /> {tailor.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                    <Building size={12} className="text-gray-400" /> {tailor.shopName || 'Independent'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                                                    <Star size={10} className="text-gray-400" /> {tailor.experience ? `${tailor.experience} Years Exp.` : 'New'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">{tailor.specialty}</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{tailor.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
                                                    <Star size={12} className="fill-orange-500" /> {tailor.rating}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium">{tailor.completedOrders} Orders</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{tailor.commission}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(tailor.status)}`}>
                                                {tailor.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                        {filteredPending.map((app) => (
                            <div key={app.id} className="bg-white border text-left border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-primary font-black text-lg">
                                            {app.name.charAt(0)}
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-gray-900 mt-4">{app.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                                        <Scissors size={12} className="text-gray-400" /> {app.specialty}
                                    </div>
                                    <div className="flex gap-4 mt-4 text-[10px] text-gray-400 font-bold">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} /> {app.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} /> {app.submittedDate}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setSelectedApp(app)} className="flex-1 py-2.5 bg-gray-50 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-black uppercase tracking-widest rounded-xl border border-gray-100">
                                        Review Docs
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tailor Detail Drawer */}
            <AnimatePresence>
                {selectedTailor && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedTailor(null)}
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
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl">
                                        {selectedTailor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{selectedTailor.name}</h2>
                                        <p className="text-xs text-white/60 font-bold mt-1 flex items-center gap-1.5">
                                            <Scissors size={12} /> {selectedTailor.specialty}
                                        </p>
                                        <div className="flex gap-3 mt-2">
                                            <div className="inline-block px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-white/10 text-white border border-white/20">
                                                {selectedTailor.status}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                                <Star size={10} /> {selectedTailor.experience || 0} Yrs Exp.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTailor(null)}
                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fbfcfb]">

                                {/* Contact Info & Bio */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <Building size={16} className="text-primary opacity-70" /> {selectedTailor.shopName || 'Independent'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <Phone size={16} className="text-primary opacity-70" /> {selectedTailor.phone}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <Mail size={16} className="text-primary opacity-70" /> {selectedTailor.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <MapPin size={16} className="text-primary opacity-70" /> {selectedTailor.location}
                                    </div>
                                    {selectedTailor.bio && (
                                        <div className="pt-2 mt-2 border-t border-gray-50">
                                            <p className="text-xs italic text-gray-500 font-medium">"{selectedTailor.bio}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-orange-500"><Star size={20} className="fill-orange-500" /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedTailor.rating}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Rating</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                        <div className="flex justify-center mb-1 text-primary"><CheckCircle2 size={20} /></div>
                                        <p className="text-2xl font-black text-gray-900">{selectedTailor.completedOrders}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Orders Done</p>
                                    </div>
                                </div>

                                {/* Manage Settings */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Building size={12} /> Management Details
                                    </h3>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                            <div>
                                                <p className="text-xs font-bold text-gray-600">Platform Commission</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Percentage taken per order</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-gray-900">{selectedTailor.commission}</span>
                                                <button 
                                                    onClick={() => {
                                                        setNewCommission(selectedTailor.commissionRaw);
                                                        setIsEditCommissionModalOpen(true);
                                                    }}
                                                    className="text-[10px] text-primary hover:underline font-bold"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-600">Joined Date</p>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{selectedTailor.joined}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Section in Drawer */}
                                {selectedTailor.documents && selectedTailor.documents.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <FileText size={12} /> Verified Documents
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedTailor.documents.map((doc, i) => (
                                                <a 
                                                    key={i}
                                                    href={doc.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={14} className="text-gray-400 group-hover:text-primary" />
                                                        <span className="text-xs font-bold text-gray-700">{doc.name}</span>
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
                                {selectedTailor.status === 'Pending' || selectedTailor.status === 'Pending Review' ? (
                                    <>
                                        <button onClick={() => { handleReject(selectedTailor.id); setSelectedTailor(null); }} className="px-4 py-3 border border-red-100 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Ban size={14} /> Reject
                                        </button>
                                        <button onClick={() => { handleApprove(selectedTailor.id); setSelectedTailor(null); }} className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle2 size={14} /> Approve
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="px-4 py-3 border border-red-100 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Ban size={14} /> Suspend
                                        </button>
                                        <button className="px-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                            View Payouts
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
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">Review Application</h2>
                                    <button onClick={() => setSelectedApp(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                                            {selectedApp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">{selectedApp.name}</h3>
                                            <p className="text-sm font-bold text-primary">{selectedApp.specialty}</p>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <Mail size={12} className="text-gray-400" /> {selectedApp.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <Phone size={12} className="text-gray-400" /> {selectedApp.phone}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <Building size={14} /> {selectedApp.shopName || 'Independent'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <Star size={14} /> {selectedApp.experience || 0} Years Exp.
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-gray-400 mt-2">{selectedApp.location}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">KYC Documents</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                                selectedApp.documents.map((doc, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-primary/70"><FileText size={16} /></div>
                                                                <span className="text-sm font-bold text-gray-700">{doc.name}</span>
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={doc.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] rounded-xl transition-all font-black text-[10px] text-primary uppercase tracking-widest"
                                                        >
                                                            View Document
                                                        </a>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No documents uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedApp.bio && (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Professional Bio</h4>
                                            <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                "{selectedApp.bio}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-4">
                                    <button onClick={() => handleReject(selectedApp.id)} className="py-3 bg-white border border-gray-200 text-red-600 text-xs font-black rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors uppercase tracking-widest">
                                        Reject
                                    </button>
                                    <button onClick={() => handleApprove(selectedApp.id)} className="py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest">
                                        Approve Profile
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Commission Modal */}
            <AnimatePresence>
                {isEditCommissionModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => !isUpdatingCommission && setIsEditCommissionModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6"
                        >
                            <h3 className="text-lg font-black text-gray-900 mb-2">Edit Commission</h3>
                            <p className="text-xs text-gray-500 font-medium mb-6">Set the percentage taken per order for {selectedTailor?.name}</p>
                            
                            <div className="relative mb-6">
                                <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={newCommission}
                                    onChange={(e) => setNewCommission(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-primary pr-12"
                                    placeholder="20"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                            </div>
                            
                            <div className="flex gap-3 mt-2">
                                <button 
                                    onClick={() => setIsEditCommissionModalOpen(false)}
                                    disabled={isUpdatingCommission}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleEditCommission}
                                    disabled={isUpdatingCommission || !newCommission}
                                    className="flex-1 py-3 bg-primary text-white hover:bg-primary-dark transition-colors text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {isUpdatingCommission ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTailors;
