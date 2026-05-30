import React, { useEffect, useState } from 'react';
import {
    User, ShoppingBag, MapPin, Ruler, Grid, LogOut, Wallet, Star,
    Settings, Headset, ChevronRight, Share2, Heart, MessageSquare, FileText, Shield, Ticket, Bell, Globe, Sparkles, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import BottomNav from '../components/BottomNav';
import ProfileHeader from '../components/profile/ProfileHeader';
import MenuOption from '../components/profile/MenuOption';

import useUserStore from '../../../store/userStore';
import api from '../../../utils/api';

const LegalLinks = () => {
    const [docs, setDocs] = useState([]);
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await api.get('/cms/content?type=legal');
                if (res.data.success) setDocs(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDocs();
    }, []);

    if (docs.length === 0) return null;

    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
                <div className="p-1 px-1.5 bg-[#2D2F6E] rounded text-[#E2C17D] italic">
                    <FileText size={12} strokeWidth={3} />
                </div>
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] italic">Legal & Policies</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docs.map((doc, idx) => (
                    <MenuOption
                        key={doc._id}
                        icon={Shield}
                        label={doc.title}
                        subLabel={`Official ${doc.title} document`}
                        to={`/user/legal/${doc.slug}`}
                    />
                ))}
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore(state => state);
    const { fetchProfile, profile, isLoading } = useUserStore();

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading && !profile) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    const displayUser = profile || {
        name: 'Guest User',
        email: 'guest@example.com',
        phone: '+91 9876543210'
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans text-gray-900">
            {/* 1. Header & Stats */}
            <ProfileHeader user={displayUser} stats={profile?.stats} />

            <div className="max-w-4xl mx-auto px-3 md:px-6 -mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Account Section */}
                <div className="mb-4">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2 italic">Account Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
                        <MenuOption
                            icon={ShoppingBag}
                            color="bg-[#2D2F6E]"
                            label="My Orders"
                            subLabel="Track, Return, Feedback"
                            to="/user/orders"
                        />
                        <MenuOption
                            icon={MapPin}
                            color="bg-[#2D2F6E]"
                            label="Saved Addresses"
                            subLabel="Manage Pickup & Delivery locations"
                            to="/user/profile/addresses"
                        />
                        <MenuOption
                            icon={Ruler}
                            color="bg-[#2D2F6E]"
                            label="My Measurements"
                            subLabel="Saved Body Profiles"
                            to="/user/profile/measurements"
                        />
                        <MenuOption
                            icon={Package}
                            color="bg-[#2D2F6E]"
                            label="Bulk Inquiries"
                            subLabel="Wholesale & Corporate Tracking"
                            to="/user/bulk-orders"
                        />
                    </div>
                </div>

                {/* Rewards & Benefits Section */}
                <div className="mb-4">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2 italic">Rewards & Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
                        <MenuOption
                            icon={Star}
                            color="bg-[#2D2F6E]"
                            label="Loyalty Points"
                            subLabel="Redeem your rewards"
                            extra={<span className="bg-gray-100 text-[10px] font-black px-2.5 py-1 rounded-full text-gray-900 border border-gray-200">0</span>}
                            to="/user/rewards"
                        />
                        <MenuOption
                            icon={Wallet}
                            color="bg-[#2D2F6E]"
                            label="Wallet"
                            subLabel="Your balance"
                            extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100 italic">₹ 0</span>}
                            to="/user/wallet"
                        />
                        <MenuOption
                            icon={Ticket}
                            color="bg-[#2D2F6E]"
                            label="Coupons"
                            subLabel="View available offers"
                            to="/user/coupons"
                        />
                        <MenuOption
                            icon={Share2}
                            color="bg-[#2D2F6E]"
                            label="Refer & Earn"
                            subLabel="Invite friends, earn rewards"
                            extra={<span className="bg-[#2D2F6E] text-[8px] font-black px-2 py-0.5 rounded-full text-white animate-pulse">NEW</span>}
                            to="/user/refer"
                        />
                    </div>
                </div>

                {/* Settings Section */}
                <div className="mb-4">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2 italic">Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
                        <MenuOption
                            icon={Globe}
                            color="bg-[#2D2F6E]"
                            label="Language"
                            subLabel="Change app language"
                            extra={<span className="text-[10px] font-bold text-gray-400 mr-1">EN</span>}
                            to="/user/settings/language"
                        />
                        <MenuOption
                            icon={Bell}
                            color="bg-[#2D2F6E]"
                            label="Notifications"
                            subLabel="Manage preferences"
                            to="/user/settings/notifications"
                        />
                        <MenuOption
                            icon={MessageSquare}
                            color="bg-[#2D2F6E]"
                            label="Support"
                            subLabel="Get help & chat with us"
                            to="/user/support"
                        />
                    </div>
                </div>

                <LegalLinks />

                <div className="max-w-md mx-auto sm:max-w-none px-2 mt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100 group hover:bg-red-50 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#2D2F6E] flex items-center justify-center text-[#E2C17D] shadow-lg shadow-gray-200 group-hover:rotate-6 transition-transform">
                                <LogOut size={20} strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-red-600 uppercase tracking-wider italic">Logout Account</h4>
                                <p className="text-[10px] font-bold text-red-400">Sign out from this device</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-red-300" />
                    </button>
                </div>

                <p className="text-center text-[10px] font-bold text-gray-400 mt-10 pb-6 uppercase tracking-widest opacity-50">
                    SewZella • Version 1.0.0 (Beta)
                </p>
            </div>

            <BottomNav />
        </div>
    );
};

export default ProfilePage;
