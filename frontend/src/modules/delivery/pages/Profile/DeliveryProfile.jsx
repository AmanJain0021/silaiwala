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
    Globe
} from 'lucide-react';
import MenuOption from '../../../customer/components/profile/MenuOption';
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import api from '../../../../utils/api';

const DeliveryProfile = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const logout = useAuthStore((state) => state.logout);
    const [isEditing, setIsEditing] = useState(null); // 'personal' | 'bank' | null
    const { isOnline, setIsOnline } = useOutletContext() || { isOnline: true, setIsOnline: () => { } };
    const [showRules, setShowRules] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [kycStatus, setKycStatus] = useState('Action Required');
    const [loading, setLoading] = useState(true);

    // Profile States
    const [deliveryProfile, setDeliveryProfile] = useState(null);
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        phone: '',
        emergencyPhone: '',
        vehicle: '',
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
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

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
                await deliveryService.updateProfile({
                    name: personalInfo.name,
                    phoneNumber: personalInfo.phone,
                    emergencyContact: personalInfo.emergencyPhone,
                    vehicleNumber: personalInfo.vehicle
                });

                if (setUser && user) {
                    setUser({ ...user, name: personalInfo.name });
                }
                toast.success('Identity profile updated');
            } else if (section === 'bank') {
                await deliveryService.updateProfile({
                    bankDetails: {
                        accountName: bankInfo.accountName,
                        bankName: bankInfo.bank,
                        accountNumber: bankInfo.accountNo,
                        ifscCode: bankInfo.ifsc
                    }
                });
                toast.success('Financial details updated');
            }
            setIsEditing(null);
        } catch (error) {
            console.error(`Failed to update ${section} details:`, error);
            toast.error(`Failed to update ${section} details`);
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
                <Loader2 className="w-10 h-10 text-[#2D2F6E] animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Scanning Profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-2">
            {/* Profile Hero Card */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-0 opacity-60"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-xl overflow-hidden bg-indigo-50">
                            <img
                                src={user?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Chirag"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{user?.name || 'Partner'}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                <span className="text-amber-500 font-black text-xs">★</span>
                                <span className="text-amber-700 font-bold text-xs">{deliveryProfile?.rating || '4.8'}</span>
                            </div>
                            <span className="text-slate-200">•</span>
                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">ID: {user?._id?.slice(-6).toUpperCase() || '882190'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-wider">{deliveryProfile?.totalDeliveries || 0} Deliveries</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Duty Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between relative z-20 group">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Availability</h2>
                    <p className={`text-[10px] font-bold tracking-widest mt-0.5 transition-colors capitalize ${isOnline ? 'text-[#2D2F6E]' : 'text-slate-400'}`}>
                        {isOnline ? 'Active & Receiving Tasks' : 'Currently Off Duty'}
                    </p>
                </div>

                {/* Interactive Toggle Switch */}
                <button
                    onClick={handleToggleDuty}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-500 ease-in-out relative flex items-center shadow-inner ${isOnline ? 'bg-[#2D2F6E]' : 'bg-slate-200'
                        }`}
                >
                    <div
                        className={`w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOnline ? 'translate-x-6' : 'translate-x-0'
                            }`}
                    >
                        {isOnline && <div className="w-2 h-2 bg-[#2D2F6E] rounded-full animate-pulse"></div>}
                    </div>
                </button>
            </div>



            {/* New Categorized Menu - Matching Reference */}
            <div className="space-y-6">

                {/* 1. Identity & Duty */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Identity & Performance</h3>
                    <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm">
                        <MenuOption
                            icon={User}
                            color="bg-green-500"
                            label="Identity Profile"
                            subLabel={deliveryProfile?.user?.isVerified ? "Verified Partner" : "Update details"}
                            onClick={() => setIsEditing('personal')}
                        />
                        <MenuOption
                            icon={Star}
                            color="bg-orange-400"
                            label="Performance Rating"
                            subLabel="Your service score"
                            extra={<span className="bg-orange-50 text-[10px] font-black px-2.5 py-1 rounded-full text-orange-600 border border-orange-100 italic">4.8</span>}
                            to="/delivery/stats"
                        />
                    </div>
                </div>

                {/* 2. Financials */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Earnings & Bank</h3>
                    <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm">
                        <MenuOption
                            icon={Wallet}
                            color="bg-purple-600"
                            label="Wallet & Earnings"
                            subLabel="Check your balance"
                            extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100 italic">₹ 1,240</span>}
                            to="/delivery/wallet"
                        />
                        <MenuOption
                            icon={CreditCard}
                            color="bg-indigo-500"
                            label="Financial Routing"
                            subLabel="Bank details"
                            onClick={() => setIsEditing('bank')}
                        />
                    </div>
                </div>

                {/* 3. Settings & Support */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Platform Settings</h3>
                    <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm">
                        <MenuOption
                            icon={Bell}
                            color="bg-red-500"
                            label="Notifications"
                            subLabel="Alert preferences"
                            to="/delivery/notifications"
                        />
                        <MenuOption
                            icon={Globe}
                            color="bg-blue-600"
                            label="Language"
                            extra={<span className="text-[10px] font-bold text-gray-400 mr-1">EN</span>}
                            to="/delivery/language"
                        />
                        <MenuOption
                            icon={FileText}
                            color="bg-amber-600"
                            label="KYC Documents"
                            subLabel={kycStatus}
                            onClick={() => setShowKYCModal(true)}
                        />
                        <MenuOption
                            icon={LifeBuoy}
                            color="bg-cyan-500"
                            label="Help & Support"
                            onClick={() => setShowSupport(true)}
                        />
                    </div>
                </div>
            </div>

            {/* Logout Action - Premium Style */}
            <div className="pt-6 pb-4">
                <button
                    onClick={() => {
                        logout();
                        navigate('/delivery/login');
                    }}
                    className="w-full bg-red-50/50 p-5 rounded-[2rem] border border-red-100 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform">
                            <LogOut size={22} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-black text-red-600 uppercase tracking-widest italic leading-none">Secure Logout</h4>
                            <p className="text-[10px] font-bold text-red-400 mt-1">Sign out of Silaiwala</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-red-300" />
                </button>
                <p className="text-center mt-8 text-[11px] font-black text-slate-400 uppercase tracking-widest opacity-50">Silaiwala • Version 1.2 (Beta)</p>
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-500 transition-all resize-none"
                                        placeholder="I need help with..."
                                    ></textarea>
                                </div>
                                <button className="w-full bg-slate-600 text-white rounded-2xl p-4 font-black tracking-widest text-xs hover:bg-slate-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 uppercase">
                                    <Send size={16} /> Submit Ticket
                                </button>
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
                                                    const res = await api.post('/upload', formData);
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
                                                <CheckCircle2 size={32} className="text-[#2D2F6E] absolute drop-shadow-md bg-white rounded-full" />
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
                                                    const res = await api.post('/upload', formData);
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
                                                <CheckCircle2 size={32} className="text-[#2D2F6E] absolute drop-shadow-md bg-white rounded-full" />
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
                                <CheckCircle2 size={16} className="text-[#2D2F6E]" /> Submit To Admin
                            </button>

                            <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                Documents are securely encrypted.<br />Verification takes up to 24 hours.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryProfile;

