import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, History, Bell, MapPin, Shield, LogOut, ChevronRight, FileText, Save, X, Phone, Mail, Wallet, Star, Ticket, Navigation } from 'lucide-react';
import MenuOption from '../../customer/components/profile/MenuOption';
import { Input, Button } from '../components/UIElements';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../../components/Common/ImageUploader';
import { useGoogleLocation } from '../../../hooks/useGoogleLocation';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { logout } = useTailorAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'pickup', 'terms', 'privacy'
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        shopName: '',
        name: '',
        email: '',
        phoneNumber: '',
        bio: '',
        address: '',
        latitude: null,
        longitude: null,
        profileImage: ''
    });

    const { detectLocation, isLocating } = useGoogleLocation();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/tailors/me');
                if (res.data.success) {
                    const data = res.data.data;
                    setProfile(data);
                    setFormData({
                        shopName: data.shopName || '',
                        name: data.user?.name || '',
                        email: data.user?.email || '',
                        phoneNumber: data.user?.phoneNumber || '',
                        bio: data.bio || '',
                        address: data.location?.address || '123 Main St, Bandra West, Mumbai',
                        latitude: data.location?.coordinates?.[1] || null,
                        longitude: data.location?.coordinates?.[0] || null,
                        profileImage: data.user?.profileImage || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAutoLocation = async () => {
        try {
            const data = await detectLocation();
            if (data) {
                setFormData({
                    ...formData,
                    address: data.address,
                    latitude: data.latitude,
                    longitude: data.longitude
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Could not fetch address details automatically.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let uploadedImageUrl = formData.profileImage;
            if (formData.profileImage instanceof File) {
                const formDataObj = new FormData();
                formDataObj.append('image', formData.profileImage);
                formDataObj.append('folder', 'tailor_profiles');
                
                try {
                    const res = await api.post('/upload/public', formDataObj, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedImageUrl = res.data.data;
                } catch (err) {
                    toast.error('Failed to upload image');
                    setIsSaving(false);
                    return;
                }
            }

            const payload = { ...formData, profileImage: uploadedImageUrl };
            const res = await api.patch('/tailors/profile', payload);
            if (res.data.success) {
                setProfile(res.data.data);
                setFormData({...formData, profileImage: uploadedImageUrl});
                setIsEditing(false);
                toast.success("Profile details saved successfully!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
            navigate('/partner/login');
        }
    };

    const menuOptions = [
        { icon: <Edit2 size={20} />, label: 'Edit Profile', action: () => setIsEditing(true) },
        { icon: <Ticket size={20} />, label: 'Subscription Plan', path: '/partner/subscription' },
        { icon: <History size={20} />, label: 'Order History', path: '/partner/orders' },
        { icon: <Bell size={20} />, label: 'Notifications', path: '/partner/notifications' },
        { icon: <MapPin size={20} />, label: 'Pick Up Information', action: () => setActiveModal('pickup') },
        { icon: <FileText size={20} />, label: 'Terms & Conditions', action: () => setActiveModal('terms') },
        { icon: <Shield size={20} />, label: 'Privacy & Security', action: () => setActiveModal('privacy') },
    ];

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    const renderModalContent = () => {
        switch (activeModal) {
            case 'pickup':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900">Pick Up Information</h3>
                        <p className="text-sm text-gray-600">Default pickup location is your registered shop address. Delivery partners will arrive between 10 AM - 6 PM.</p>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Address</p>
                            <p className="text-sm font-medium text-gray-800">{formData.address}</p>
                        </div>
                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900">Terms & Conditions</h3>
                        <div className="text-xs text-gray-600 space-y-2 h-48 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
                            <p>1. By using Silaiwala, you agree to fulfill all accepted orders within the specified deadline.</p>
                            <p>2. {formData.shopName} is responsible for the fabric quality if provided by the shop.</p>
                            <p>3. Payments are processed every Friday for completed orders.</p>
                            <p>4. Platform commission is fixed at 12% per transaction.</p>
                        </div>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900">Privacy & Security</h3>
                        <div className="space-y-3">
                            <Button onClick={() => alert("Change Password dialog opened")} variant="secondary" className="text-xs py-3 border-gray-200">Change Password</Button>
                            <Button onClick={() => alert("Manage Devices dialog opened")} variant="secondary" className="text-xs py-3 border-gray-200">Manage Devices</Button>
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                                <Shield size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-red-700 leading-tight">Your data is fully encrypted. We never share your shop financials with third parties.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#2D2F6E] selection:text-white pb-20">
            
            {/* ── MOBILE HEADER ── */}
            <div className={`md:hidden relative bg-[#2D2F6E] pt-4 ${isEditing ? 'pb-12' : 'pb-16'} px-5 text-white overflow-hidden shrink-0 shadow-xl transition-all duration-300`}>
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white">
                        <path d="M0,100 C40,80 60,0 100,0 L100,100 Z" />
                    </svg>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <button onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} className="p-1.5 -ml-2 text-white hover:text-indigo-100 transition-colors">
                        {isEditing ? <X size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <h1 className="text-base font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase">
                        {isEditing ? 'Edit Profile' : 'Profile Settings'}
                    </h1>
                </div>
                <div className="absolute -bottom-1 left-0 w-full leading-none">
                    <svg className="w-full h-8 text-[#F5F5F5] fill-current" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M0,20 C30,0 70,0 100,20 L100,20 L0,20 Z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 p-2 md:p-0">
                
                {/* ── DESKTOP TITLE ── */}
                <div className="hidden md:block py-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account & Security</h2>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Manage your shop profile and platform preferences</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT: PROFILE SUMMARY & EDIT FORM */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Profile Overview Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Shield size={120} className="text-[#2D2F6E]" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="h-24 w-24 bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center text-[#FDE5D2] shadow-2xl shadow-[#2D2F6E]/20 relative group-hover:scale-105 transition-transform duration-500">
                                    {(profile?.user?.profileImage && profile?.user?.profileImage !== 'default_profile.png') ? (
                                        <img src={profile.user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-[2rem]" />
                                    ) : (
                                        <span className="text-3xl font-black">{profile?.shopName?.charAt(0) || formData.name?.charAt(0) || 'R'}</span>
                                    )}
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-[#2D2F6E] hover:bg-[#2D2F6E] hover:text-white transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{profile?.shopName || 'Luxury Stitches'}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                        <span className="bg-indigo-50 text-[#2D2F6E] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                            Verified Partner
                                        </span>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            Premium Tier
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleSave} className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-1 mb-6">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">Profile Image</label>
                                        <div className="w-24 h-24">
                                            <ImageUploader
                                                value={formData.profileImage === 'default_profile.png' ? null : formData.profileImage}
                                                onChange={(file) => setFormData({...formData, profileImage: file})}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Shop Name</label>
                                            <input 
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#2D2F6E]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                value={formData.shopName} 
                                                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Owner Name</label>
                                            <input 
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#2D2F6E]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                                            <input 
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#2D2F6E]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                type="email" 
                                                value={formData.email} 
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contact Number</label>
                                            <input 
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#2D2F6E]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                type="tel" 
                                                value={formData.phoneNumber} 
                                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Address</label>
                                            <button 
                                                type="button"
                                                onClick={handleAutoLocation}
                                                disabled={isLocating}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isLocating ? (
                                                    <div className="w-3 h-3 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                                ) : (
                                                    <Navigation size={12} className="fill-primary/10" />
                                                )}
                                                {isLocating ? 'Locating...' : 'Detect Exact Location'}
                                            </button>
                                        </div>
                                        <input 
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#2D2F6E]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                            value={formData.address} 
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            placeholder="Detect exact location or enter address"
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isSaving}
                                            className="flex-[2] py-4 bg-[#2D2F6E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2D2F6E]/20 hover:bg-[#1e1f4a] transition-all"
                                        >
                                            {isSaving ? 'Saving Changes...' : 'Update Profile'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Phone size={12} className="text-gray-400" />
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                                        </div>
                                        <p className="text-sm font-black text-gray-900">{formData.phoneNumber || 'Not provided'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Mail size={12} className="text-gray-400" />
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Access</p>
                                        </div>
                                        <p className="text-sm font-black text-gray-900">{formData.email || 'Not provided'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: NAVIGATION MENU */}
                    <div className="w-full lg:w-[400px] space-y-6">
                        
                        {/* Account Actions */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-1">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-3 mb-3">Quick Navigation</h3>
                            <MenuOption
                                icon={Wallet}
                                color="bg-[#2D2F6E]"
                                label="Wallet & Payouts"
                                subLabel="Check your balance"
                                extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100">₹ 0</span>}
                                to="/partner/withdraw"
                            />
                            <MenuOption
                                icon={Ticket}
                                color="bg-[#2D2F6E]"
                                label="Subscription Plan"
                                subLabel="Manage your plan"
                                to="/partner/subscription"
                            />
                            <MenuOption
                                icon={MapPin}
                                color="bg-[#2D2F6E]"
                                label="Pick Up Info"
                                subLabel="Manage addresses"
                                onClick={() => setActiveModal('pickup')}
                            />
                            <MenuOption
                                icon={Shield}
                                color="bg-[#2D2F6E]"
                                label="Privacy & Terms"
                                subLabel="Legal guidelines"
                                onClick={() => setActiveModal('privacy')}
                            />
                        </div>

                        {/* Logout Section */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <button
                                onClick={handleLogout}
                                className="w-full p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-100 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-rose-500 shadow-lg group-hover:rotate-6 transition-transform">
                                        <LogOut size={18} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest leading-none">Logout Account</h4>
                                        <p className="text-[9px] font-bold text-rose-400 mt-1">End current session</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Slide-up Modals for Desktop/Mobile */}
            {activeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh]">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                {activeModal === 'pickup' ? 'Pick Up Information' : activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy & Security'}
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                            {renderModalContent()}
                        </div>
                        <div className="p-8 border-t border-gray-50">
                            <button 
                                onClick={() => setActiveModal(null)} 
                                className="w-full bg-[#2D2F6E] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#2D2F6E]/20 active:scale-95 transition-all"
                            >
                                Close Information
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
