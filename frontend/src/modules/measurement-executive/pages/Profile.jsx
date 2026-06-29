import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { User, MapPin, Briefcase, Phone, Mail, Award, Trash2, AlertTriangle, LogOut, Shield } from 'lucide-react';
import api from '../../../utils/api';

const Profile = () => {
    const navigate = useNavigate();
    const { profile } = useMeasurementStore();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/executive/login');
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
            alert(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmText('');
        }
    };

    if (!profile) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#843D9B]"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#843D9B] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                    <User size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your account details</p>
                </div>
            </div>

            <div className="bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 overflow-hidden mb-6">
                <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-purple-50/50 to-white">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                            <div className="w-20 h-20 rounded-3xl bg-[#843D9B] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-purple-200 border-4 border-white">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{user.name}</h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                                    <Award className="h-4 w-4 text-[#843D9B]" />
                                    {user.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-bold text-xs uppercase tracking-widest shadow-sm ${
                            profile.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            profile.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                            <Shield size={16} />
                            {profile.verificationStatus}
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-[#843D9B]">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-sky-500">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                <p className="text-sm font-medium text-gray-900">{user.phoneNumber}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md md:col-span-2">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-500">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered Address</p>
                                <p className="text-sm font-medium text-gray-900 leading-relaxed">{profile.address || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Service Radius */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-amber-500">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service Radius</p>
                                <p className="text-sm font-medium text-gray-900">{profile.serviceRadius} km</p>
                            </div>
                        </div>

                        {/* Total Measurements */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-rose-500">
                                <Award size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Measurements</p>
                                <p className="text-sm font-medium text-gray-900">{profile.totalMeasurements}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout & Delete Account Section */}
            <div className="space-y-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-gray-100 group hover:bg-gray-50 transition-all duration-300"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shadow-sm group-hover:-rotate-6 transition-transform">
                            <LogOut size={20} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Logout Account</h4>
                            <p className="text-xs font-bold text-gray-400 mt-1">Sign out from this device</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-gray-100 group hover:bg-red-50 hover:border-red-100 transition-all duration-300"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm group-hover:rotate-6 transition-transform">
                            <Trash2 size={20} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-black text-red-600 uppercase tracking-widest">Delete Account</h4>
                            <p className="text-xs font-bold text-red-400/80 mt-1">Permanently remove your account</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center shadow-inner">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Delete Account?</h3>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed mt-2">This action is <span className="font-bold text-red-600">permanent</span> and cannot be undone. All your measurement data, earnings, and history will be lost forever.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block text-center">Type DELETE to confirm</label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-center tracking-widest focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
