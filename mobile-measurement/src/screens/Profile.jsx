// Port of modules/measurement-executive/pages/Profile.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../components/ui/Sheet';
import storage from '../lib/storage';
import { confirm } from '../lib/alert';
import { Path, default as Svg } from 'react-native-svg';
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import useMeasurementStore from "../store/measurementExecutiveStore";
import { ArrowLeft, Edit2, History, MapPin, Shield, LogOut, ChevronRight, Phone, Mail, Wallet, Trash2, AlertTriangle, Award, X, Bell, Loader2 } from "lucide-react-native";
import MenuOption from "../components/customer/profile/MenuOption";
import api from "../lib/api";
import toast from '../lib/toast';
import useAuthStore from "../store/authStore";
import { testPushToThisDevice } from "../lib/push";
import { Box, Btn, I, Txt, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const Profile = () => {
  const navigate = useNavigate();
  const {
    profile,
    fetchDashboard,
    updateProfile,
    loading
  } = useMeasurementStore();
  const [user, setUser] = useState(JSON.parse(storage.getItem('user') || '{}'));
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  useEffect(() => {
    if (!profile) fetchDashboard();
  }, [profile, fetchDashboard]);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    aadharNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    if (isEditing) {
      setEditForm({
        name: user?.name || '',
        address: profile?.address || '',
        aadharNumber: profile?.aadharNumber || '',
        emergencyContactName: profile?.emergencyContact?.name || '',
        emergencyContactPhone: profile?.emergencyContact?.phone || ''
      });
      setEditErrors({});
    }
  }, [isEditing, user, profile]);
  const validateEditForm = () => {
    const errors = {};
    if (!editForm.name.trim()) {
      errors.name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(editForm.name)) {
      errors.name = "Name can only contain alphabets";
    }
    if (!editForm.address.trim()) {
      errors.address = "Address is required";
    }
    if (editForm.aadharNumber && !/^\d{12}$/.test(editForm.aadharNumber)) {
      errors.aadharNumber = "Aadhar number must be exactly 12 digits";
    }
    if (editForm.emergencyContactName && !/^[A-Za-z\s]+$/.test(editForm.emergencyContactName)) {
      errors.emergencyContactName = "Name can only contain alphabets";
    }
    if (editForm.emergencyContactPhone && !/^\d{10}$/.test(editForm.emergencyContactPhone)) {
      errors.emergencyContactPhone = "Phone number must be exactly 10 digits";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleEditSubmit = async e => {
    if (!validateEditForm()) return;
    setIsUpdating(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        aadharNumber: editForm.aadharNumber || undefined
      };
      if (editForm.emergencyContactName || editForm.emergencyContactPhone) {
        payload.emergencyContact = {
          name: editForm.emergencyContactName.trim(),
          phone: editForm.emergencyContactPhone
        };
      }
      await updateProfile(payload);
      const updatedUser = {
        ...user,
        name: payload.name
      };
      useAuthStore.getState().updateUser({
        name: payload.name
      });
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };
  const handleLogout = async () => {
    if (await confirm("Are you sure you want to logout?")) {
      await useAuthStore.getState().logout();
    }
  };
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await api.delete('/auth/delete-account');
      await useAuthStore.getState().logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };
  if (!profile) return <Box className="min-h-screen flex items-center justify-center bg-gray-50">
            <Spin size={48} className="text-[#843D9B]" />
        </Box>;
  return <>
            <Box className="min-h-full bg-[#F5F5F5] flex flex-col font-sans">
            
            {/* ── MOBILE HEADER ── */}
            <Box className={`md:hidden relative bg-[#843D9B] pt-4 ${isEditing ? 'pb-12' : 'pb-16'} px-5 text-white overflow-hidden shrink-0 shadow-xl transition-all duration-300`}>
                <Box className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
                    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <Path fill="#FFFFFF" d="M0,100 C40,80 60,0 100,0 L100,100 Z" />
                    </Svg>
                </Box>
                <Box className="relative z-10 flex items-center justify-between">
                    <Btn onPress={() => navigate(-1)} className="p-1.5 -ml-2 text-white hover:text-indigo-100 transition-colors">
                        <I icon={ArrowLeft} size={20} />
                    </Btn>
                    <Txt className="text-base font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase">
                        Profile Settings
                    </Txt>
                </Box>
                <Box className="absolute -bottom-1 left-0 w-full leading-none">
                    <Svg width="100%" height={32} viewBox="0 0 100 20" preserveAspectRatio="none">
                        <Path fill="#F5F5F5" d="M0,20 C30,0 70,0 100,20 L100,20 L0,20 Z" />
                    </Svg>
                </Box>
            </Box>

            <Box className="flex-1 p-2 md:p-0">
                
                {/* ── DESKTOP TITLE ── */}
                <Box className="hidden md:block py-6">
                    <Txt className="text-2xl font-black text-gray-900 tracking-tight">Account & Security</Txt>
                    <Txt className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Manage your executive profile and preferences</Txt>
                </Box>

                <Box className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT: PROFILE SUMMARY & EDIT FORM */}
                    <Box className="flex-1 space-y-6">
                        
                        {/* Profile Overview Card */}
                        <Box className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <Box className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <I icon={Shield} size={120} className="text-[#843D9B]" />
                            </Box>
                            
                            <Box className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <Box className="h-24 w-24 bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-[#843D9B]/20 relative group-hover:scale-105 transition-transform duration-500">
                                    <Txt className="text-3xl font-black">{user?.name?.charAt(0) || 'M'}</Txt>
                                    <Btn onPress={() => setIsEditing(true)} className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-[#843D9B] hover:bg-[#843D9B] hover:text-white transition-all">
                                        <I icon={Edit2} size={14} />
                                    </Btn>
                                </Box>
                                <Box className="text-center md:text-left">
                                    <Txt className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{user?.name || 'Executive'}</Txt>
                                    <Box className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                        <Txt className="bg-[#843D9B]/10 text-[#843D9B] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#843D9B]/20">
                                            {profile?.verificationStatus === 'verified' ? 'Verified Executive' : 'Under Review'}
                                        </Txt>
                                        <Txt className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            Active
                                        </Txt>
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Box className="flex items-center gap-3 mb-1">
                                        <I icon={Phone} size={12} className="text-gray-400" />
                                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</Txt>
                                    </Box>
                                    <Txt className="text-sm font-black text-gray-900">{user?.phoneNumber || 'Not provided'}</Txt>
                                </Box>
                                <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Box className="flex items-center gap-3 mb-1">
                                        <I icon={Mail} size={12} className="text-gray-400" />
                                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Access</Txt>
                                    </Box>
                                    <Txt className="text-sm font-black text-gray-900">{user?.email || 'Not provided'}</Txt>
                                </Box>
                                <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Box className="flex items-center gap-3 mb-1">
                                        <I icon={MapPin} size={12} className="text-gray-400" />
                                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registered Address</Txt>
                                    </Box>
                                    <Txt className="text-sm font-black text-gray-900">{profile?.address || 'Not provided'}</Txt>
                                </Box>
                                <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Box className="flex items-center gap-3 mb-1">
                                        <I icon={Award} size={12} className="text-gray-400" />
                                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Measurements</Txt>
                                    </Box>
                                    <Txt className="text-sm font-black text-gray-900">{profile?.totalMeasurements || '0'}</Txt>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* RIGHT: NAVIGATION MENU */}
                    <Box className="w-full lg:w-[400px] space-y-6">
                        
                        {/* Account Actions */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-1">
                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-3 mb-3">Quick Navigation</Txt>
                            <MenuOption icon={Wallet} color="bg-[#843D9B]" label="Wallet & Payouts" subLabel="Check your balance" extra={<Txt className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100">₹ 0</Txt>} to="/executive/wallet" />
                            <MenuOption icon={History} color="bg-[#843D9B]" label="Measurement History" subLabel="View past measurements" to="/executive/requests" />
                            <MenuOption icon={Shield} color="bg-[#843D9B]" label="Privacy & Terms" subLabel="Legal guidelines" onPress={() => setActiveModal('privacy')} />
                        </Box>

                        {/* Test Push Section */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <Btn onPress={async () => {
                try {
                  await testPushToThisDevice();
                  toast.success('Test push sent to this device!');
                } catch (err) {
                  toast.error('Failed to send test push: ' + (err.response?.data?.message || err.message));
                }
              }} className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-2xl border border-indigo-100 flex items-center justify-between group transition-all">
                                <Box className="flex items-center gap-4">
                                    <Box className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                        <I icon={Bell} size={18} strokeWidth={3} />
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none">Test Push</Txt>
                                        <Txt className="text-[9px] font-bold text-indigo-400 mt-1">Send a test notification</Txt>
                                    </Box>
                                </Box>
                                <I icon={ChevronRight} size={18} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                            </Btn>
                        </Box>

                        {/* Logout Section */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <Btn onPress={handleLogout} className="w-full p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-100 flex items-center justify-between group transition-all">
                                <Box className="flex items-center gap-4">
                                    <Box className="h-10 w-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-rose-500 shadow-lg group-hover:rotate-6 transition-transform">
                                        <I icon={LogOut} size={18} strokeWidth={3} />
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-xs font-black text-rose-600 uppercase tracking-widest leading-none">Logout Account</Txt>
                                        <Txt className="text-[9px] font-bold text-rose-400 mt-1">End current session</Txt>
                                    </Box>
                                </Box>
                                <I icon={ChevronRight} size={18} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
                            </Btn>
                        </Box>

                        {/* Delete Account Section */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <Btn onPress={() => setShowDeleteModal(true)} className="w-full p-4 bg-gray-50 hover:bg-red-50 rounded-2xl border border-gray-200 hover:border-rose-200 flex items-center justify-between group transition-all">
                                <Box className="flex items-center gap-4">
                                    <Box className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                        <I icon={Trash2} size={18} strokeWidth={3} />
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-xs font-black text-red-600 uppercase tracking-widest leading-none">Delete Account</Txt>
                                        <Txt className="text-[9px] font-bold text-red-400 mt-1">Permanently remove your account</Txt>
                                    </Box>
                                </Box>
                                <I icon={ChevronRight} size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
                            </Btn>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Slide-up Modals for Desktop/Mobile */}
            {activeModal && <Dialog visible={!!(activeModal)} onClose={() => setActiveModal(false)} className={`bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden    max-h-[85vh]`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Box className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
                            <Txt className="text-xl font-black text-gray-900 tracking-tight">
                                {activeModal === 'privacy' ? 'Privacy & Security' : 'Information'}
                            </Txt>
                            <Btn onPress={() => setActiveModal(null)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
                                <I icon={X} size={20} />
                            </Btn>
                        </Box>
                        <Scroll contentClassName="p-8 pt-6" className="flex-shrink" nestedScrollEnabled>
                            {activeModal === 'privacy' && <Box className="space-y-4">
                                    <Box className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                                        <I icon={Shield} size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <Txt className="text-[10px] text-red-700 leading-tight">Your data is fully encrypted. We never share your financials with third parties.</Txt>
                                    </Box>
                                </Box>}
                        </Scroll>
                        <Box className="p-8 border-t border-gray-50">
                            <Btn onPress={() => setActiveModal(null)} className="w-full bg-[#843D9B] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#843D9B]/20 active:scale-95 transition-all">
                                Close Information
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && <Dialog visible={!!(showDeleteModal)} onClose={() => setShowDeleteModal(false)} className={`bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5`}>
<Box className="flex-shrink flex flex-col space-y-5">
                        <Box className="flex flex-col items-center text-center gap-3">
                            <Box className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                                <I icon={AlertTriangle} size={28} className="text-red-600" />
                            </Box>
                            <Txt className="text-lg font-black text-gray-900 tracking-tight">Delete Account?</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">This action is <Txt className="font-bold text-red-600">permanent</Txt> and cannot be undone. All your data and earnings history will be lost forever.</Txt>
                        </Box>
                        <Box>
                            <Txt className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Type DELETE to confirm</Txt>
                            <Input value={deleteConfirmText} onChangeText={e => setDeleteConfirmText(e)} placeholder="DELETE" autoCapitalize="characters" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-center tracking-widest focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" />
                        </Box>
                        <Box className="flex gap-3">
                            <Btn onPress={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all">
                                Cancel
                            </Btn>
                            <Btn onPress={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || isDeleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {isDeleting ? 'Deleting...' : 'Delete Forever'}
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}

            {/* Edit Profile Modal */}
            {isEditing && <Dialog visible={!!(isEditing)} onClose={() => setIsEditing(false)} className={`bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden h-[85vh] flex flex-col`}>
<Box className="flex-1 flex flex-col overflow-hidden">
                        <Box className="px-8 pt-8 pb-4 border-b border-gray-50 flex items-center justify-between shrink-0">
                            <Txt className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</Txt>
                            <Btn onPress={() => setIsEditing(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all shadow-sm">
                                <I icon={X} size={20} />
                            </Btn>
                        </Box>
                        <Scroll contentClassName="p-8 pt-6" className="flex-1 custom-scrollbar" nestedScrollEnabled>
                            <Box className="space-y-5">
                                <Box>
                                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</Txt>
                                    <Input value={editForm.name} onChangeText={e => setEditForm({
                  ...editForm,
                  name: e
                })} className={`w-full px-4 py-3 bg-gray-50 border ${editErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#843D9B] transition-all`} placeholder="Your Name" />
                                    {editErrors.name && <Txt className="text-[10px] text-red-500 font-bold mt-1">{editErrors.name}</Txt>}
                                </Box>
                                
                                <Box>
                                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Address</Txt>
                                    <Input value={editForm.address} onChangeText={e => setEditForm({
                  ...editForm,
                  address: e
                })} className={`w-full px-4 py-3 bg-gray-50 border ${editErrors.address ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#843D9B] transition-all min-h-[80px] resize-none`} placeholder="Full residential address" multiline />
                                    {editErrors.address && <Txt className="text-[10px] text-red-500 font-bold mt-1">{editErrors.address}</Txt>}
                                </Box>

                                <Box>
                                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Aadhar Number (Optional)</Txt>
                                    <Input value={editForm.aadharNumber} onChangeText={e => setEditForm({
                  ...editForm,
                  aadharNumber: e.replace(/\D/g, '')
                })} maxLength={12} keyboardType="number-pad" className={`w-full px-4 py-3 bg-gray-50 border ${editErrors.aadharNumber ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#843D9B] transition-all`} placeholder="12 Digit Aadhar Number" />
                                    {editErrors.aadharNumber && <Txt className="text-[10px] text-red-500 font-bold mt-1">{editErrors.aadharNumber}</Txt>}
                                </Box>

                                <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Txt className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Emergency Contact</Txt>
                                    <Box className="space-y-4">
                                        <Box>
                                            <Txt className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Contact Name</Txt>
                                            <Input value={editForm.emergencyContactName} onChangeText={e => setEditForm({
                      ...editForm,
                      emergencyContactName: e
                    })} className={`w-full px-3 py-2 bg-white border ${editErrors.emergencyContactName ? 'border-red-400' : 'border-gray-200'} rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-[#843D9B] transition-all`} placeholder="Name" />
                                            {editErrors.emergencyContactName && <Txt className="text-[9px] text-red-500 font-bold mt-1">{editErrors.emergencyContactName}</Txt>}
                                        </Box>
                                        <Box>
                                            <Txt className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Contact Phone</Txt>
                                            <Input value={editForm.emergencyContactPhone} onChangeText={e => setEditForm({
                      ...editForm,
                      emergencyContactPhone: e.replace(/\D/g, '')
                    })} maxLength={10} keyboardType="phone-pad" className={`w-full px-3 py-2 bg-white border ${editErrors.emergencyContactPhone ? 'border-red-400' : 'border-gray-200'} rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-[#843D9B] transition-all`} placeholder="10 Digit Mobile" />
                                            {editErrors.emergencyContactPhone && <Txt className="text-[9px] text-red-500 font-bold mt-1">{editErrors.emergencyContactPhone}</Txt>}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Scroll>
                        <Box className="p-8 border-t border-gray-50 shrink-0">
                            <Btn onPress={handleEditSubmit} disabled={isUpdating} className="w-full bg-[#843D9B] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#843D9B]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isUpdating ? <><Spin size={14} className="animate-spin" /> Updating...</> : 'Save Changes'}
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}
        </Box>
        </>;
};
export default Profile;
