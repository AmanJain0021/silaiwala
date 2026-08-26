import React, { useEffect, useState } from 'react';
import {
    ShoppingBag, MapPin, Ruler, LogOut, Wallet, Star,
    Settings, ChevronRight, Share2, MessageSquare, FileText, Shield, Ticket, Bell, Globe, Package, Trash2, AlertTriangle, Crown, Map
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';
import BottomNav from '../components/BottomNav';
import ProfileHeader from '../components/profile/ProfileHeader';
import MenuOption from '../components/profile/MenuOption';
import useUserStore from '../../../store/userStore';
import api from '../../../utils/api';
import useBrandingStore from '../../../store/brandingStore';
import { formatOrderItemsTitle, getItemImage } from '../../../utils/orderItems';
import { getImageUrl } from '../../../utils/imageUrl';

const LegalLinks = () => {
    const [docs, setDocs] = useState([]);
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await api.get('/cms/content?type=legal');
                if (res.data.success) setDocs(res.data.data);
            } catch (err) {
                if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
                    console.error(err);
                }
            }
        };
        fetchDocs();
    }, []);

    if (docs.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Legal & Policies</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {docs.map((doc) => (
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
    const logout = useAuthStore(state => state.logout);
    const authUser = useAuthStore(state => state.user);
    const profile = useUserStore(state => state.profile);
    const fetchProfile = useUserStore(state => state.fetchProfile);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const appName = useBrandingStore(state => state.appName);
    
    const [activeOrder, setActiveOrder] = useState(null);
    const [savedProfiles, setSavedProfiles] = useState([]);

    useEffect(() => {
        fetchProfile();
        
        // Fetch active order
        const fetchActiveOrder = async () => {
            try {
                const res = await api.get('/orders/customer/my-orders');
                if (res.data.success && res.data.data) {
                    const active = res.data.data.find(o => !['delivered', 'cancelled', 'returned'].includes(o.orderStatus?.toLowerCase()));
                    if (active) setActiveOrder(active);
                }
            } catch (e) {
                // Ignore
            }
        };
        
        // Fetch saved measurements
        const fetchMeasurements = async () => {
            try {
                const res = await api.get('/customers/measurements/profiles');
                if (res.data.success && res.data.data) {
                    setSavedProfiles(res.data.data.slice(0, 5)); // show up to 5
                }
            } catch (e) {
                // Ignore
            }
        };
        
        fetchActiveOrder();
        fetchMeasurements();
    }, [fetchProfile]);

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
            window.location.href = '/user/login';
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setIsDeleting(true);
        try {
            await api.delete('/auth/delete-account');
            await logout();
            navigate('/user/login');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmText('');
        }
    };

    const storedUser = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const displayUser = React.useMemo(() => {
        const merged = {
            ...(storedUser || {}),
            ...(authUser || {}),
            ...(profile || {})
        };
        const rawImg = merged.profileImage || merged.user?.profileImage || merged.profile?.profileImage || authUser?.profileImage || authUser?.user?.profileImage || storedUser?.profileImage || null;
        return {
            ...merged,
            name: merged.name || merged.user?.name || 'Customer',
            email: merged.email || merged.user?.email || '',
            phone: merged.phone || merged.phoneNumber || merged.user?.phoneNumber || '',
            profileImage: typeof rawImg === 'string' ? rawImg : null
        };
    }, [profile, authUser, storedUser]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans text-gray-900 w-full flex flex-col items-center overflow-x-hidden">
            {/* 1. Header & Stats */}
            <ProfileHeader user={displayUser} stats={profile?.stats} />

            <div className="w-full max-w-[412px] px-4 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Current Order (Conditionally Rendered if active) */}
                {activeOrder && (
                    <div className="mb-6 bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between gap-3 relative overflow-hidden">
                        <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                            {getImageUrl(getItemImage(activeOrder.items?.[0])) ? (
                                <img src={getImageUrl(getItemImage(activeOrder.items[0]))} alt="Order" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Package size={24} />
                                </div>
                            )}
                            {(activeOrder.items?.length || 0) > 1 && (
                                <span className="absolute bottom-0 right-0 bg-primary text-white text-[8px] font-black px-1 rounded-tl">
                                    {activeOrder.items.length}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 block">Current Order</span>
                            <h4 className="text-[13px] font-bold text-gray-900 truncate mb-1">
                                {formatOrderItemsTitle(activeOrder.items, {
                                    fallback: `Order #${activeOrder.orderId?.slice(-6) || ''}`,
                                })}
                            </h4>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold text-primary">{activeOrder.orderStatus || activeOrder.status || 'Processing'}</span>
                            </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end">
                            <span className="text-[8px] text-gray-400 font-bold mb-1 uppercase tracking-wider">ETA</span>
                            <span className="text-[10px] font-bold text-gray-700 mb-2">Tomorrow, 10:30 AM</span>
                            <Link to={`/user/orders/${activeOrder._id}/track`} className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                                <MapPin size={10} /> Track Order
                            </Link>
                        </div>
                    </div>
                )}

                {/* Account Management */}
                <div className="mb-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Account Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <MenuOption
                            icon={ShoppingBag}
                            label="My Orders"
                            subLabel="Track, cancel, reorder"
                            to="/user/orders"
                        />
                        <MenuOption
                            icon={MapPin}
                            label="Saved Addresses"
                            subLabel="Manage delivery"
                            to="/user/profile/addresses"
                        />
                        <MenuOption
                            icon={Ruler}
                            label="My Measurements"
                            subLabel="Saved body profiles"
                            to="/user/profile/measurements"
                        />
                        <MenuOption
                            icon={Package}
                            label="Bulk Inquiries"
                            subLabel="Wholesale & corporate"
                            to="/user/bulk-orders"
                        />
                    </div>
                </div>



                {/* Rewards & Benefits Section (Horizontal Scroll) */}
                <div className="mb-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Rewards & Benefits</h3>
                    <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 custom-scrollbar hide-scroll-indicator scroll-smooth">
                        <MenuOption
                            layout="vertical"
                            icon={Star}
                            color="text-[#843D9B]"
                            label="Loyalty Points"
                            subLabel={`${displayUser.loyaltyPoints || 0} Points`}
                            to="/user/loyalty"
                        />
                        <MenuOption
                            layout="vertical"
                            icon={Crown}
                            color="text-orange-500"
                            label="Membership"
                            subLabel="Elite Member"
                            to="/user/membership"
                        />
                        <MenuOption
                            layout="vertical"
                            icon={Wallet}
                            color="text-indigo-600"
                            label="Wallet"
                            subLabel={`₹${profile?.walletBalance || '0.00'}`}
                            to="/user/wallet"
                        />
                        <MenuOption
                            layout="vertical"
                            icon={Ticket}
                            color="text-[#843D9B]"
                            label="Coupons"
                            subLabel="5 Available"
                            to="/user/coupons"
                        />
                        <MenuOption
                            layout="vertical"
                            icon={Share2}
                            color="text-pink-500"
                            label="Refer & Earn"
                            subLabel="Earn Rewards"
                            extra={<span className="absolute -top-2 -right-2 bg-pink-500 text-[8px] font-black px-2 py-0.5 rounded-full text-white shadow-sm transform rotate-12 animate-pulse">NEW</span>}
                            to="/user/refer"
                        />
                    </div>
                </div>

                {/* Membership Banner */}
                <div className="mb-6 bg-[#25103E] rounded-2xl p-4 text-white shadow-xl flex items-center justify-between group cursor-pointer relative overflow-hidden" onClick={() => navigate('/user/membership')}>
                    {/* Background glow */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 flex items-center justify-center shrink-0 text-[#FFB800]">
                            <Crown size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold mb-1 tracking-tight">SewZella Elite Membership</h4>
                            <p className="text-[9px] text-gray-300 font-medium leading-relaxed max-w-[180px]">
                                You are enjoying FREE Pickup, Priority Support & Exclusive Discounts
                            </p>
                        </div>
                    </div>
                    <button className="shrink-0 bg-white text-[#25103E] px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 group-hover:bg-gray-100 transition-colors">
                        View Benefits <ChevronRight size={12} />
                    </button>
                </div>

                {/* Settings Section */}
                <div className="mb-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Settings & Support</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <MenuOption
                            icon={Globe}
                            label="Language"
                            subLabel="English"
                            to="/user/language"
                        />
                        <MenuOption
                            icon={Bell}
                            label="Notifications"
                            subLabel="Manage preferences"
                            to="/user/notifications"
                        />
                        <MenuOption
                            icon={Wallet}
                            label="Payment Methods"
                            subLabel="UPI, Cards, Wallets"
                            to="/user/payments"
                        />
                        <MenuOption
                            icon={MessageSquare}
                            label="Support"
                            subLabel="Help center & chat"
                            to="/user/support"
                        />
                        <MenuOption
                            icon={Map} // Placeholder for FAQ icon
                            label="Help & FAQs"
                            subLabel="Find answers quickly"
                            to="/user/faq"
                        />
                    </div>
                </div>

                <LegalLinks />

                {/* Test Push & Logout */}
                <div className="mt-8 mb-4 space-y-2">
                    <button
                        onClick={async () => {
                            try {
                                const { testPushToThisDevice } = await import('../../../hooks/usePushNotifications');
                                const res = await testPushToThisDevice();
                                toast.success(res?.message || 'Test push notification sent!', { position: 'bottom-center' });
                            } catch (err) {
                                toast.error('Failed to send test push: ' + (err.response?.data?.message || err.message), { position: 'bottom-center' });
                            }
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                                <Bell size={18} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-bold text-indigo-900">Test Push Notification</h4>
                                <p className="text-[10px] text-indigo-500 mt-0.5">Send a test alert to this device</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-indigo-300" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-3.5 bg-red-50/50 rounded-2xl border border-red-100 hover:bg-red-50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 transition-transform group-hover:scale-105">
                                <LogOut size={18} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-bold text-red-700">Logout Account</h4>
                                <p className="text-[10px] text-red-500 mt-0.5">Sign out from this device</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-red-300" />
                    </button>
                </div>

                <div className="mt-2 mb-8">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-3 rounded-2xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                        Delete Account
                    </button>
                </div>

                <p className="text-center text-[9px] font-bold text-gray-400 pb-6 uppercase tracking-widest opacity-60">
                    {appName} • Version 1.0.0
                </p>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Delete Account?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">This action is <span className="font-bold text-red-600">permanent</span> and cannot be undone. All your data, orders, and measurements will be lost forever.</p>
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
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>

            <BottomNav />
        </div>
    );
};

export default ProfilePage;
