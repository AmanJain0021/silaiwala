import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { ArrowLeft, Edit2, History, MapPin, Shield, LogOut, ChevronRight, Phone, Mail, Wallet, Trash2, AlertTriangle, Award, X, Bell } from 'lucide-react';
import MenuOption from '../../customer/components/profile/MenuOption';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import PullToRefresh from 'react-simple-pull-to-refresh';

const Profile = () => {
    const navigate = useNavigate();
    const { profile, fetchDashboard, loading } = useMeasurementStore();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeModal, setActiveModal] = useState(null); 

    useEffect(() => {
        if (!profile) fetchDashboard();
    }, [profile, fetchDashboard]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/executive/login');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setIsDeleting(true);
        try {
            await api.delete('/auth/delete-account');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/executive/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmText('');
        }
    };

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#843D9B]"></div>
        </div>
    );

    return (
        <PullToRefresh onRefresh={async () => await fetchDashboard()}>
            <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white pb-20">
            
            {/* ── MOBILE HEADER ── */}
            <div className={`md:hidden relative bg-[#843D9B] pt-4 ${isEditing ? 'pb-12' : 'pb-16'} px-5 text-white overflow-hidden shrink-0 shadow-xl transition-all duration-300`}>
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white">
                        <path d="M0,100 C40,80 60,0 100,0 L100,100 Z" />
                    </svg>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-1.5 -ml-2 text-white hover:text-indigo-100 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-base font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase">
                        Profile Settings
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
                    <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Manage your executive profile and preferences</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT: PROFILE SUMMARY & EDIT FORM */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Profile Overview Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Shield size={120} className="text-[#843D9B]" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="h-24 w-24 bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-[#843D9B]/20 relative group-hover:scale-105 transition-transform duration-500">
                                    <span className="text-3xl font-black">{user?.name?.charAt(0) || 'M'}</span>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-[#843D9B] hover:bg-[#843D9B] hover:text-white transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{user?.name || 'Executive'}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                        <span className="bg-[#843D9B]/10 text-[#843D9B] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#843D9B]/20">
                                            {profile?.verificationStatus === 'verified' ? 'Verified Executive' : 'Under Review'}
                                        </span>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Phone size={12} className="text-gray-400" />
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                                    </div>
                                    <p className="text-sm font-black text-gray-900">{user?.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Mail size={12} className="text-gray-400" />
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Access</p>
                                    </div>
                                    <p className="text-sm font-black text-gray-900">{user?.email || 'Not provided'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-1">
                                        <MapPin size={12} className="text-gray-400" />
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registered Address</p>
                                    </div>
                                    <p className="text-sm font-black text-gray-900">{profile?.address || 'Not provided'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Award size={12} className="text-gray-400" />
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Measurements</p>
                                    </div>
                                    <p className="text-sm font-black text-gray-900">{profile?.totalMeasurements || '0'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: NAVIGATION MENU */}
                    <div className="w-full lg:w-[400px] space-y-6">
                        
                        {/* Account Actions */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-1">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-3 mb-3">Quick Navigation</h3>
                            <MenuOption
                                icon={Wallet}
                                color="bg-[#843D9B]"
                                label="Wallet & Payouts"
                                subLabel="Check your balance"
                                extra={<span className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100">₹ 0</span>}
                                to="/executive/wallet"
                            />
                            <MenuOption
                                icon={History}
                                color="bg-[#843D9B]"
                                label="Measurement History"
                                subLabel="View past measurements"
                                to="/executive/requests"
                            />
                            <MenuOption
                                icon={Shield}
                                color="bg-[#843D9B]"
                                label="Privacy & Terms"
                                subLabel="Legal guidelines"
                                onClick={() => setActiveModal('privacy')}
                            />
                        </div>

                        {/* Test Push Section */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post('/notifications/test-push');
                                        toast.success('Test push sent successfully!');
                                    } catch (err) {
                                        toast.error('Failed to send test push: ' + (err.response?.data?.message || err.message));
                                    }
                                }}
                                className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-2xl border border-indigo-100 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                        <Bell size={18} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none">Test Push</h4>
                                        <p className="text-[9px] font-bold text-indigo-400 mt-1">Send a test notification</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                            </button>
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

                        {/* Delete Account Section */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full p-4 bg-gray-50 hover:bg-red-50 rounded-2xl border border-gray-200 hover:border-rose-200 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                        <Trash2 size={18} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black text-red-600 uppercase tracking-widest leading-none">Delete Account</h4>
                                        <p className="text-[9px] font-bold text-red-400 mt-1">Permanently remove your account</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
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
                                {activeModal === 'privacy' ? 'Privacy & Security' : 'Information'}
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                            {activeModal === 'privacy' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                                        <Shield size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-red-700 leading-tight">Your data is fully encrypted. We never share your financials with third parties.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 border-t border-gray-50">
                            <button 
                                onClick={() => setActiveModal(null)} 
                                className="w-full bg-[#843D9B] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#843D9B]/20 active:scale-95 transition-all"
                            >
                                Close Information
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={28} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Delete Account?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">This action is <span className="font-bold text-red-600">permanent</span> and cannot be undone. All your data and earnings history will be lost forever.</p>
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
                                onClick={handleDeleteAccount}
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
        </PullToRefresh>
    );
};

export default Profile;
