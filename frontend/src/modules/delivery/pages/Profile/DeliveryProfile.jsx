import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useAuthStore from '../../../../store/authStore';
import {
    User,
    CreditCard,
    ShieldCheck,
    Bell,
    FileText,
    LogOut,
    ChevronRight,
    Wallet,
    Star,
    Edit3,
    CheckCircle2,
    X,
    LifeBuoy,
    Book,
    Send,
    UploadCloud,
    Loader2,
    Globe,
    Camera
} from 'lucide-react';
import { Trash2, AlertTriangle } from 'lucide-react';
import MenuOption from '../../../customer/components/profile/MenuOption';
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import api from '../../../../utils/api';

const DeliveryProfile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const logout = useAuthStore((state) => state.logout);
    const [isEditing, setIsEditing] = useState(null); // 'personal' | 'bank' | null
    const { isOnline, setIsOnline } = useOutletContext() || { isOnline: true, setIsOnline: () => { } };
    const [showRules, setShowRules] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [kycStatus, setKycStatus] = useState('Action Required');
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [supportIssue, setSupportIssue] = useState('');
    const [myTickets, setMyTickets] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Profile States
    const [deliveryProfile, setDeliveryProfile] = useState(null);
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        phone: '',
        emergencyPhone: '',
        vehicle: '',
        profileImage: null,
        previewImage: null,
    });

    const [bankInfo, setBankInfo] = useState({
        accountName: 'Partner Name',
        bank: 'HDFC Bank',
        accountNo: '**** **** 9921',
        ifsc: 'HDFC0001234',
    });

    // Mock KYC Upload States
    const [aadharImage, setAadharImage] = useState(null);
    const [licenseImage, setLicenseImage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await deliveryService.getProfile();
                if (res.success) {
                    const data = res.data;
                    setDeliveryProfile(data);
                    setPersonalInfo(prev => ({
                        ...prev,
                        name: data.user.name,
                        phone: data.user.phoneNumber || '',
                        emergencyPhone: data.emergencyContact || '',
                        vehicle: data.vehicleNumber || '',
                        profileImage: null,
                        previewImage: data.user.profileImage || null,
                    }));
                    if (data.documents && data.documents.length > 0) {
                        const allVerified = data.documents.every(doc => doc.status === 'verified');
                        setKycStatus(allVerified ? 'Verified' : 'Under Review');
                    }
                    if (data.bankDetails) {
                        setBankInfo({
                            accountName: data.bankDetails.accountName || 'Partner Name',
                            bank: data.bankDetails.bankName || 'HDFC Bank',
                            accountNo: data.bankDetails.accountNumber || '**** **** 9921',
                            ifsc: data.bankDetails.ifscCode || 'HDFC0001234',
                        });
                    }
                }
                setLoading(false);
            } catch (error) {
                if (error.name === 'CanceledError' || error.message?.includes('canceled')) {
                    console.log('Request canceled, likely due to React StrictMode or navigation.');
                    return; // DO NOT set loading to false here, let the new request handle it
                }
                console.error('Failed to fetch profile:', error);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const fetchMyTickets = async () => {
        try {
            const res = await api.get('/support/my-tickets');
            if (res.data.success) {
                setMyTickets(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch support tickets', error);
        }
    };

    useEffect(() => {
        if (showSupport) {
            fetchMyTickets();
        }
    }, [showSupport]);

    const handleToggleDuty = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await deliveryService.updateStatus({ isAvailable: newStatus });
            toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            setIsOnline(!newStatus); // Revert on failure
            toast.error('Failed to update status');
        }
    };

    const handleSave = async (section) => {
        try {
            if (section === 'personal') {
                if (!personalInfo.name.trim()) {
                    toast.error("Full Name is required");
                    return;
                }
                if (personalInfo.emergencyPhone && personalInfo.emergencyPhone.length < 10) {
                    toast.error("Please enter a valid Emergency Contact");
                    return;
                }

                let profileImageUrl = null;
                if (personalInfo.profileImage) {
                    const toastId = toast.loading('Uploading profile photo...');
                    try {
                        const formData = new FormData();
                        formData.append('images', personalInfo.profileImage);
                        const uploadRes = await api.post('/upload/public/bulk', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        profileImageUrl = uploadRes.data.data[0];
                        toast.success('Photo uploaded', { id: toastId });
                    } catch (err) {
                        toast.error('Photo upload failed', { id: toastId });
                        return;
                    }
                }

                const res = await deliveryService.updateProfile({
                    name: personalInfo.name,
                    phoneNumber: personalInfo.phone,
                    emergencyContact: personalInfo.emergencyPhone,
                    vehicleNumber: personalInfo.vehicle,
                    ...(profileImageUrl && { profileImage: profileImageUrl })
                });
                
                if (res.success) {
                    setDeliveryProfile(res.data);
                }

                if (updateUser) {
                    updateUser({ name: personalInfo.name, phoneNumber: personalInfo.phone });
                }
                toast.success('Identity profile updated');
            } else if (section === 'bank') {
                if (!bankInfo.accountName.trim() || !bankInfo.bank.trim() || !bankInfo.accountNo.trim() || !bankInfo.ifsc.trim()) {
                    toast.error("Please fill in all bank details");
                    return;
                }
                if (bankInfo.ifsc.length !== 11) {
                    toast.error("IFSC Code must be exactly 11 characters");
                    return;
                }
                const res = await deliveryService.updateProfile({
                    bankDetails: {
                        accountName: bankInfo.accountName,
                        bankName: bankInfo.bank,
                        accountNumber: bankInfo.accountNo,
                        ifscCode: bankInfo.ifsc
                    }
                });
                if (res.success) {
                    setDeliveryProfile(res.data);
                }
                toast.success('Financial details updated');
            }
            setIsEditing(null);
        } catch (error) {
            console.error(`Failed to update ${section} details:`, error);
            toast.error(`Failed to update ${section} details`);
        }
    };

    const handleSupportSubmit = async () => {
        if (!supportIssue.trim()) {
            toast.error('Please describe your issue');
            return;
        }
        const toastId = toast.loading('Submitting ticket...');
        try {
            const payload = {
                name: user?.name || deliveryProfile?.personal?.name || 'Delivery Partner',
                email: user?.email || 'delivery@silaiwala.com',
                subject: 'Delivery App Support Ticket',
                message: supportIssue
            };
            await api.post('/support', payload);
            toast.success('Ticket submitted successfully! Support will contact you shortly.', { id: toastId });
            setSupportIssue('');
            fetchMyTickets();
        } catch (error) {
            console.error('Failed to submit ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to submit ticket. Please try again.', { id: toastId });
        }
    };

    const handleKYCSubmit = async () => {
        if (!aadharImage || !licenseImage) {
            toast.error('Please upload both documents');
            return;
        }

        const toastId = toast.loading('Uploading documents...');
        try {
            // In a real app, these are File objects from the input
            // For this UI, we might need a way to get the actual file if it was a real upload
            // but I will mock the upload logic for now to show how it calls the API.

            // 1. Upload logic (If these were real Files)
            // const formData = new FormData();
            // formData.append('image', aadharFile);
            // const res1 = await api.post('/upload', formData);

            // Mocking URLs for now since we just have blobs in state
            const documents = [
                { name: 'Aadhar/Voter ID', url: aadharImage },
                { name: 'Driving License', url: licenseImage }
            ];

            await deliveryService.submitDocuments(documents);
            setKycStatus('Under Review');
            setShowKYCModal(false);
            toast.success('KYC Documents submitted successfully', { id: toastId });
        } catch (error) {
            console.error('KYC Submission failed:', error);
            toast.error('KYC Submission failed', { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#843D9B] animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Scanning Profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-2 -mt-2">
            {/* Profile Hero Card */}
            <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden mx-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-0 opacity-60"></div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-indigo-50">
                            <img
                                src={deliveryProfile?.user?.profileImage || user?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Chirag"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                            <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{deliveryProfile?.user?.name || user?.name || 'Partner'}</h2>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
                                <span className="text-amber-500 font-black text-[9px]">★</span>
                                <span className="text-amber-700 font-bold text-[9px]">{deliveryProfile?.rating || '4.8'}</span>
                            </div>
                            <span className="text-slate-200">•</span>
                            <span className="text-slate-400 font-bold text-[8px] uppercase tracking-wider">ID: {(deliveryProfile?.user?._id || user?._id)?.slice(-6).toUpperCase() || '882190'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                <span className="text-emerald-600 font-black text-[8px] uppercase tracking-wider">{deliveryProfile?.totalDeliveries || 0} Deliveries</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Duty Status */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between relative z-20 mx-0.5">
                <div className="text-left">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Availability</h2>
                    <p className={`text-[8px] font-bold tracking-widest mt-0.5 transition-colors capitalize ${isOnline ? 'text-[#843D9B]' : 'text-slate-400'}`}>
                        {isOnline ? 'Active & Receiving Tasks' : 'Currently Off Duty'}
                    </p>
                </div>

                {/* Interactive Toggle Switch */}
                <button
                    onClick={handleToggleDuty}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-500 relative flex items-center shadow-inner ${isOnline ? 'bg-[#843D9B]' : 'bg-slate-200'}`}
                >
                    <div
                        className={`w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-500 ${isOnline ? 'translate-x-5' : 'translate-x-0'}`}
                    >
                        {isOnline && <div className="w-1.5 h-1.5 bg-[#843D9B] rounded-full animate-pulse"></div>}
                    </div>
                </button>
            </div>            {/* 1. Identity & Duty */}
            <div className="mx-0.5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2 italic">Identity & Performance</h3>
                <div className="space-y-1">
                    <MenuOption
                        icon={User}
                        color="bg-[#843D9B]"
                        label="Identity Profile"
                        subLabel={deliveryProfile?.kycStatus === 'verified' ? "Verified Partner" : "Update details"}
                        onClick={() => {
                            if (deliveryProfile) {
                                setPersonalInfo({
                                    name: deliveryProfile.user?.name || '',
                                    phone: deliveryProfile.user?.phoneNumber || '',
                                    emergencyPhone: deliveryProfile.emergencyContact || '',
                                    vehicle: deliveryProfile.vehicleNumber || '',
                                    profileImage: null,
                                    previewImage: deliveryProfile.user?.profileImage || null,
                                });
                            }
                            setIsEditing('personal');
                        }}
                    />
                    <MenuOption
                        icon={Star}
                        color="bg-[#843D9B]"
                        label="Performance Rating"
                        subLabel="Your service score"
                        extra={<span className="bg-orange-50 text-[10px] font-black px-2.5 py-1 rounded-full text-orange-600 border border-orange-100 italic">{deliveryProfile?.rating?.toFixed(1) || '0.0'}</span>}
                        onClick={() => toast.success('Performance details coming soon!')}
                    />
                </div>
            </div>

            {/* 2. Financials */}
            <div className="mx-0.5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2 italic">Earnings & Bank</h3>
                <div className="space-y-1">
                    <MenuOption
                        icon={Wallet}
                        color="bg-[#843D9B]"
                        label="Wallet & Earnings"
                        subLabel="Check your balance"
                        extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100 italic">₹ {deliveryProfile?.walletBalance || 0}</span>}
                        to="/delivery/wallet"
                    />
                    <MenuOption
                        icon={CreditCard}
                        color="bg-[#843D9B]"
                        label="Financial Routing"
                        subLabel="Bank details"
                        onClick={() => {
                            if (deliveryProfile?.bankDetails) {
                                setBankInfo({
                                    accountName: deliveryProfile.bankDetails.accountName || '',
                                    bank: deliveryProfile.bankDetails.bankName || '',
                                    accountNo: deliveryProfile.bankDetails.accountNumber || '',
                                    ifsc: deliveryProfile.bankDetails.ifscCode || '',
                                });
                            }
                            setIsEditing('bank');
                        }}
                    />
                </div>
            </div>

            {/* 3. Settings & Support */}
            <div className="mx-0.5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2 italic">Platform Settings</h3>
                <div className="space-y-1">
                    <MenuOption
                        icon={Bell}
                        color="bg-[#843D9B]"
                        label="Notifications"
                        subLabel={notificationsEnabled ? "Alerts are active" : "Alerts are muted"}
                        hideArrow={true}
                        extra={
                            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 relative flex items-center shadow-inner ${notificationsEnabled ? 'bg-[#843D9B]' : 'bg-slate-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}>
                                </div>
                            </div>
                        }
                        onClick={() => {
                            setNotificationsEnabled(!notificationsEnabled);
                            toast.success(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`);
                        }}
                    />

                    <MenuOption
                        icon={FileText}
                        color="bg-[#843D9B]"
                        label="KYC Documents"
                        subLabel={kycStatus}
                        onClick={() => setShowKYCModal(true)}
                    />
                    <MenuOption
                        icon={LifeBuoy}
                        color="bg-[#843D9B]"
                        label="Help & Support"
                        onClick={() => setShowSupport(true)}
                    />
                </div>
            </div>

            {/* Logout Action - Premium Style */}
            <div className="pt-2 pb-4">
                <button
                    onClick={() => {
                        logout();
                        navigate('/delivery/login');
                    }}
                    className="w-full bg-red-50/50 p-3 rounded-[1.5rem] border border-red-100 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#843D9B] rounded-2xl flex items-center justify-center text-[#E2C17D] shadow-md shadow-indigo-100 group-hover:rotate-6 transition-transform">
                            <LogOut size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xs font-black text-red-600 uppercase tracking-widest italic leading-none">Secure Logout</h4>
                            <p className="text-[9px] font-bold text-red-400 mt-1">Sign out of SewZelaa</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-red-300" />
                </button>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full bg-gray-50/50 p-3 rounded-[1.5rem] border border-gray-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-between group active:scale-[0.98] transition-all mt-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-100 group-hover:rotate-6 transition-transform">
                            <Trash2 size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xs font-black text-red-600 uppercase tracking-widest italic leading-none">Delete Account</h4>
                            <p className="text-[9px] font-bold text-red-400 mt-1">Permanently remove your account</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-red-300" />
                </button>
                <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">SewZelaa • Version 1.2 (Beta)</p>
            </div>

            {/* Platform Rules Modal */}
            <AnimatePresence>
                {showRules && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowRules(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative max-h-[80vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowRules(false)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                    <Book size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Platform Rules</h3>
                                    <p className="text-[10px] tracking-widest font-bold text-slate-400 uppercase">Strict Compliance</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-rose-600 tracking-widest mb-1.5 uppercase">Fabric Liability</h4>
                                    <p className="text-xs text-rose-500/80 font-medium leading-relaxed">Delivery partners are strictly liable for any damage or loss of fabric during transit. Capture clear proofs at pickup.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-slate-700 tracking-widest mb-1.5 uppercase">C.O.D Remittance</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Cash On Delivery collected for readymade orders must be settled with the platform within 24 hours.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-slate-700 tracking-widest mb-1.5 uppercase">Professionalism</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Maintain a professional demeanor with customers and tailors. Severe complaints may lead to account suspension.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help & Support Modal */}
            <AnimatePresence>
                {showSupport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowSupport(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowSupport(false)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                                    <LifeBuoy size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Help & Support</h3>
                                    <p className="text-[9px] tracking-widest font-bold text-slate-400 uppercase">Raise Ticket</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block uppercase">Describe your issue</label>
                                    <textarea
                                        rows="4"
                                        value={supportIssue}
                                        onChange={(e) => setSupportIssue(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-500 transition-all resize-none"
                                        placeholder="I need help with..."
                                    ></textarea>
                                </div>
                                <button 
                                    onClick={handleSupportSubmit}
                                    className="w-full bg-slate-600 text-white rounded-2xl p-4 font-black tracking-widest text-xs hover:bg-slate-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 uppercase"
                                >
                                    <Send size={16} /> Submit Ticket
                                </button>
                                
                                {myTickets.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-slate-100 max-h-[300px] overflow-y-auto pr-2">
                                        <h4 className="text-[10px] font-black text-slate-400 tracking-widest mb-4 uppercase sticky top-0 bg-white z-10 py-1">Recent Tickets</h4>
                                        <div className="space-y-4">
                                            {myTickets.map(ticket => (
                                                <div key={ticket._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-900">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-3">{ticket.message}</p>
                                                    {ticket.adminResponse && (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Support Response</span>
                                                            <p className="text-sm text-slate-800">{ticket.adminResponse}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KYC Upload Modal */}
            <AnimatePresence>
                {showKYCModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowKYCModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowKYCModal(false)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-indigo-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Verification</h3>
                                <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase">Submit documents for approval</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                {/* Aadhar Card Upload */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-700 tracking-widest mb-2 flex items-center gap-2 uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        Aadhar Core / Voter ID
                                    </label>
                                    <label className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-blue-200 hover:text-primary transition-all text-slate-400 group cursor-pointer relative overflow-hidden">
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append('image', file);

                                                try {
                                                    const res = await api.post('/upload', formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setAadharImage(res.data.data);
                                                    toast.success('Aadhar uploaded');
                                                } catch (err) {
                                                    toast.error('Aadhar upload failed');
                                                }
                                            }
                                        }} />
                                        {aadharImage ? (
                                            <div className="absolute inset-0 w-full h-full bg-slate-900/10 flex items-center justify-center backdrop-blur-sm">
                                                <img src={aadharImage} alt="Aadhar" className="w-full h-full object-cover opacity-60" />
                                                <CheckCircle2 size={32} className="text-[#843D9B] absolute drop-shadow-md bg-white rounded-full" />
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase">Tap to Upload Photo</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* Driving License Upload */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-700 tracking-widest mb-2 flex items-center gap-2 uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                        Valid Driving License
                                    </label>
                                    <label className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-slate-200 hover:text-slate-500 transition-all text-slate-400 group cursor-pointer relative overflow-hidden">
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append('image', file);

                                                try {
                                                    const res = await api.post('/upload', formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setLicenseImage(res.data.data);
                                                    toast.success('License uploaded');
                                                } catch (err) {
                                                    toast.error('License upload failed');
                                                }
                                            }
                                        }} />
                                        {licenseImage ? (
                                            <div className="absolute inset-0 w-full h-full bg-slate-900/10 flex items-center justify-center backdrop-blur-sm">
                                                <img src={licenseImage} alt="License" className="w-full h-full object-cover opacity-60" />
                                                <CheckCircle2 size={32} className="text-[#843D9B] absolute drop-shadow-md bg-white rounded-full" />
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase">Tap to Upload Document</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleKYCSubmit}
                                className="w-full bg-slate-900 text-white rounded-2xl p-4 font-black tracking-widest text-xs hover:bg-black active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 uppercase"
                            >
                                <CheckCircle2 size={16} className="text-[#843D9B]" /> Submit To Admin
                            </button>

                            <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                Documents are securely encrypted.<br />Verification takes up to 24 hours.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing === 'personal' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsEditing(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-5 sm:p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsEditing(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-xl flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Identity Profile</h3>
                                    <p className="text-[9px] tracking-widest font-bold text-slate-400 uppercase">Update your personal details</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col items-center mb-2">
                                    <label className="relative cursor-pointer group">
                                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#843D9B] overflow-hidden flex items-center justify-center bg-fuchsia-50 group-hover:bg-fuchsia-100 transition-all">
                                            {personalInfo.previewImage ? (
                                                <img src={personalInfo.previewImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-[#843D9B]" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPersonalInfo({
                                                        ...personalInfo,
                                                        profileImage: file,
                                                        previewImage: URL.createObjectURL(file)
                                                    });
                                                }
                                            }}
                                        />
                                    </label>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">Update Photo</span>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        value={personalInfo.name}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');
                                            if (val.length > 0) {
                                                val = val.charAt(0).toUpperCase() + val.slice(1);
                                            }
                                            setPersonalInfo({ ...personalInfo, name: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={personalInfo.phone}
                                        readOnly
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 focus:outline-none cursor-not-allowed opacity-70"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Emergency Contact</label>
                                    <input
                                        type="tel"
                                        value={personalInfo.emergencyPhone}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                            if (val.length > 10) val = val.slice(0, 10);
                                            setPersonalInfo({ ...personalInfo, emergencyPhone: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={personalInfo.vehicle}
                                        readOnly
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 focus:outline-none cursor-not-allowed uppercase opacity-70"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSave('personal')}
                                    className="w-full bg-[#843D9B] text-white rounded-xl py-3 font-black tracking-widest text-xs hover:bg-[#6b3180] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 uppercase mt-1"
                                >
                                    <CheckCircle2 size={16} /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Bank Modal */}
            <AnimatePresence>
                {isEditing === 'bank' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsEditing(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-5 sm:p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsEditing(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-[#843D9B] rounded-xl flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Financial Routing</h3>
                                    <p className="text-[9px] tracking-widest font-bold text-slate-400 uppercase">Update bank details</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={bankInfo.accountName}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');
                                            if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1);
                                            setBankInfo({ ...bankInfo, accountName: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankInfo.bank}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');
                                            if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1);
                                            setBankInfo({ ...bankInfo, bank: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankInfo.accountNo}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                            if (val.length > 18) val = val.slice(0, 18);
                                            setBankInfo({ ...bankInfo, accountNo: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all tracking-widest"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 tracking-widest mb-1 block uppercase">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={bankInfo.ifsc}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                            if (val.length > 11) val = val.slice(0, 11);
                                            setBankInfo({ ...bankInfo, ifsc: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all tracking-widest"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSave('bank')}
                                    className="w-full bg-[#843D9B] text-white rounded-xl py-3 font-black tracking-widest text-xs hover:bg-[#6b3180] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 uppercase mt-1"
                                >
                                    <CheckCircle2 size={16} /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5" onClick={e => e.stopPropagation()} style={{ animation: 'zoomIn 0.3s ease-out' }}>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={28} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Delete Account?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">This action is <span className="font-bold text-red-600">permanent</span> and cannot be undone. All your delivery data, earnings, and history will be lost forever.</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Type DELETE to confirm</label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-center tracking-widest focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (deleteConfirmText !== 'DELETE') return;
                                    setIsDeleting(true);
                                    try {
                                        await api.delete('/auth/delete-account');
                                        logout();
                                        navigate('/delivery/login');
                                    } catch (err) {
                                        toast.error(err.response?.data?.message || 'Failed to delete account');
                                    } finally {
                                        setIsDeleting(false);
                                        setShowDeleteModal(false);
                                        setDeleteConfirmText('');
                                    }
                                }}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryProfile;

