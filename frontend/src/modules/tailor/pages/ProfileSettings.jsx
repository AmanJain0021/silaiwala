import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, History, Bell, MapPin, Shield, LogOut, ChevronRight, FileText, Save, X, Phone, Mail, Wallet, Star, Ticket } from 'lucide-react';
import MenuOption from '../../customer/components/profile/MenuOption';
import { Input, Button } from '../components/UIElements';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';

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
        address: ''
    });

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
                        address: data.location?.address || '123 Main St, Bandra West, Mumbai'
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

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.patch('/tailors/profile', formData);
            if (res.data.success) {
                setProfile(res.data.data);
                setIsEditing(false);
                alert("Profile details saved successfully!");
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
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
        <div className="min-h-full bg-gray-50 flex flex-col relative animate-in fade-in duration-300 pb-20">
            {/* Curved Header */}
            <div className={`relative bg-primary pt-8 ${isEditing ? 'pb-24' : 'pb-32'} px-5 text-white overflow-hidden shrink-0 shadow-xl shadow-indigo-900/10 transition-all duration-300`}>
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white">
                        <path d="M0,100 C40,80 60,0 100,0 L100,100 Z" />
                    </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between mb-2">
                    <button onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} className="p-2 -ml-2 text-white hover:text-indigo-100 transition-colors">
                        {isEditing ? <X size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <h1 className="text-lg font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase">
                        {isEditing ? 'Edit Profile' : 'Profile'}
                    </h1>
                    <div className="w-10"></div>
                </div>

                <div className="absolute -bottom-1 left-0 w-full leading-none">
                    <svg className="w-full h-16 text-gray-50 fill-current" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M0,20 C30,0 70,0 100,20 L100,20 L0,20 Z" />
                    </svg>
                </div>
            </div>

            {/* Avatar Container */}
            {!isEditing && (
                <div className="relative z-20 flex flex-col items-center -mt-20 mb-8 px-5 animate-in zoom-in duration-300">
                    <div className="h-[5.5rem] w-[5.5rem] bg-white p-1 rounded-full shadow-lg mb-4 pointer-events-none">
                        <div className="w-full h-full bg-primary rounded-full flex flex-col items-center justify-center text-white relative overflow-hidden pointer-events-auto">
                            <span className="text-3xl font-black">{profile?.shopName?.charAt(0) || formData.name?.charAt(0) || 'R'}</span>
                            <div
                                className="absolute bottom-0 w-full bg-black/20 py-1 text-center cursor-pointer hover:bg-black/30 transition-colors"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 size={10} className="mx-auto text-white/90" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{profile?.shopName || 'Luxury Stitches'}</h2>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Premium Tailor</p>
                </div>
            )}

            {isEditing ? (
                /* Compacted Edit Form */
                <form onSubmit={handleSave} className="px-5 flex-1 pb-10 relative z-20 -mt-10 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 space-y-4">
                        <Input 
                            label="Shop Name" 
                            value={formData.shopName} 
                            onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                        />
                        <Input 
                            label="Owner Name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <Input 
                            label="Email Address" 
                            type="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        <Input 
                            label="Contact Number" 
                            type="tel" 
                            value={formData.phoneNumber} 
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        />
                        <Input 
                            label="Shop Address" 
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                    <Button type="submit" loading={isSaving} className="py-5 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all font-black uppercase tracking-widest">
                         Save Profile
                    </Button>
                </form>
            ) : (
                /* Menu List */
                <div className="px-5 space-y-4 flex-1 pb-10 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
                        <MenuOption
                            icon={Edit2}
                            color="bg-indigo-500"
                            label="Edit Profile"
                            subLabel="Update shop details"
                            onClick={() => setIsEditing(true)}
                        />
                        <MenuOption
                            icon={History}
                            color="bg-purple-600"
                            label="Order History"
                            subLabel="View past transactions"
                            to="/partner/orders"
                        />
                        <MenuOption
                            icon={Bell}
                            color="bg-indigo-500"
                            label="Notifications"
                            subLabel="Manage alerts"
                            to="/partner/notifications"
                        />
                    </div>

                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mb-2 italic">Earnings & Wallet</h3>
                    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
                        <MenuOption
                            icon={Wallet}
                            color="bg-orange-400"
                            label="Wallet & Payouts"
                            subLabel="Check your balance"
                            extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100 italic">₹ 0</span>}
                            to="/partner/withdraw"
                        />
                        <MenuOption
                            icon={MapPin}
                            color="bg-green-500"
                            label="Pick Up Information"
                            subLabel="Manage addresses"
                            onClick={() => setActiveModal('pickup')}
                        />
                    </div>

                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 mb-2 italic">Support & Legal</h3>
                    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
                        <MenuOption
                            icon={FileText}
                            color="bg-blue-600"
                            label="Terms & Conditions"
                            onClick={() => setActiveModal('terms')}
                        />
                        <MenuOption
                            icon={Shield}
                            color="bg-red-500"
                            label="Privacy & Security"
                            onClick={() => setActiveModal('privacy')}
                        />
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50/50 p-4 rounded-[2rem] border border-red-100 flex items-center justify-between hover:bg-red-50 transition-all group active:scale-[0.98] mt-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform">
                                <LogOut size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-red-600 uppercase tracking-widest italic leading-none">Sign Out</h4>
                                <p className="text-[10px] font-bold text-red-400 mt-1">Exit Partner Dashboard</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-red-300" />
                    </button>
                </div>
            )}

            {/* Modals for Pickup, Terms, Privacy */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[450px] rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom flex flex-col max-h-[80vh] shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="overflow-y-auto custom-scrollbar pr-2">
                            {renderModalContent()}
                        </div>
                        <div className="mt-8">
                            <Button onClick={() => setActiveModal(null)} className="rounded-2xl py-4 font-black uppercase tracking-widest italic">Understood</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
