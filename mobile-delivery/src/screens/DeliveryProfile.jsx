// Port of modules/delivery/pages/Profile/DeliveryProfile.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { pickImage } from '../lib/files';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from '../lib/nav';
import useAuthStore from "../store/authStore";
import { User, CreditCard, ShieldCheck, Bell, FileText, LogOut, ChevronRight, Wallet, Star, Edit3, CheckCircle2, X, LifeBuoy, Book, Send, UploadCloud, Loader2, Globe, Camera, Lock, Phone, Mail } from "lucide-react-native";
import { Trash2, AlertTriangle } from "lucide-react-native";
import MenuOption from "../components/customer/profile/MenuOption";
import deliveryService from "../lib/deliveryService";
import toast from '../lib/toast';
import useBrandingStore from "../store/brandingStore";
import api from "../lib/api";
import { Box, Img, Txt, Btn, I, Input, Scroll } from '../components/ui/primitives';
const DeliveryProfile = () => {
  const navigate = useNavigate();
  const {
    user,
    updateUser
  } = useAuthStore();
  const {
    supportEmail,
    supportPhone
  } = useBrandingStore();
  const logout = useAuthStore(state => state.logout);
  const [isEditing, setIsEditing] = useState(null); // 'personal' | 'bank' | null
  const {
    isOnline,
    setIsOnline,
    toggleAvailability
  } = useOutletContext() || {
    isOnline: true,
    setIsOnline: () => {}
  };
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
    previewImage: null
  });
  const [bankInfo, setBankInfo] = useState({
    accountName: 'Partner Name',
    bank: 'HDFC Bank',
    accountNo: '**** **** 9921',
    ifsc: 'HDFC0001234'
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
            previewImage: data.user.profileImage || null
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
              ifsc: data.bankDetails.ifscCode || 'HDFC0001234'
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
    if (toggleAvailability) {
      await toggleAvailability();
      return;
    }
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await deliveryService.updateStatus({
        isAvailable: newStatus,
        status: newStatus ? 'active' : 'inactive'
      });
      try {
        const store = useDeliveryAuthStore.getState();
        if (store.deliveryBoy) {
          store.deliveryBoy.isAvailable = newStatus;
          store.deliveryBoy.status = newStatus ? 'available' : 'offline';
        }
      } catch (_) {}
      toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      setIsOnline(!newStatus); // Revert on failure
      toast.error('Failed to update status');
    }
  };
  const handleSave = async section => {
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
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            profileImageUrl = uploadRes.data.data[0];
            toast.success('Photo uploaded', {
              id: toastId
            });
          } catch (err) {
            toast.error('Photo upload failed', {
              id: toastId
            });
            return;
          }
        }
        const res = await deliveryService.updateProfile({
          name: personalInfo.name,
          phoneNumber: personalInfo.phone,
          emergencyContact: personalInfo.emergencyPhone,
          vehicleNumber: personalInfo.vehicle,
          ...(profileImageUrl && {
            profileImage: profileImageUrl
          })
        });
        if (res.success) {
          setDeliveryProfile(res.data);
        }
        if (updateUser) {
          updateUser({
            name: personalInfo.name,
            phoneNumber: personalInfo.phone
          });
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
      toast.success('Ticket submitted successfully! Support will contact you shortly.', {
        id: toastId
      });
      setSupportIssue('');
      fetchMyTickets();
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to submit ticket. Please try again.', {
        id: toastId
      });
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
      const documents = [{
        name: 'Aadhar/Voter ID',
        url: aadharImage
      }, {
        name: 'Driving License',
        url: licenseImage
      }];
      await deliveryService.submitDocuments(documents);
      setKycStatus('Under Review');
      setShowKYCModal(false);
      toast.success('KYC Documents submitted successfully', {
        id: toastId
      });
    } catch (error) {
      console.error('KYC Submission failed:', error);
      toast.error('KYC Submission failed', {
        id: toastId
      });
    }
  };
  return <Box className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-4 -mt-1">
            {/* Profile Hero Card */}
            <Box className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden mx-0.5">
                <Box className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-0 opacity-70"></Box>
                <Box className="relative z-10 flex items-center gap-4">
                    <Box className="relative">
                        <Box className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-indigo-50 flex items-center justify-center shrink-0">
                            {deliveryProfile?.user?.profileImage || user?.profileImage ? <Img src={deliveryProfile?.user?.profileImage || user?.profileImage} alt="Profile" className="w-full h-full object-cover" /> : <Txt className="text-indigo-600 font-black text-2xl sm:text-3xl">{(deliveryProfile?.user?.name || user?.name)?.charAt(0) || 'S'}</Txt>}
                        </Box>
                        <Box className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                            <Box className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </Box>
                    </Box>
                    <Box className="flex-1 min-w-0">
                        <Txt className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5 truncate">{deliveryProfile?.user?.name || user?.name || 'Partner'}</Txt>
                        <Box className="flex items-center gap-2 flex-wrap">
                            <Box className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                <Txt className="text-amber-500 font-black text-xs">★</Txt>
                                <Txt className="text-amber-700 font-extrabold text-xs">{deliveryProfile?.rating || '4.8'}</Txt>
                            </Box>
                            <Txt className="text-slate-300">•</Txt>
                            <Txt className="text-slate-500 font-bold text-xs uppercase tracking-wider">ID: {(deliveryProfile?.user?._id || user?._id)?.slice(-6).toUpperCase() || '882190'}</Txt>
                        </Box>
                        <Box className="flex items-center gap-2 mt-2">
                            <Box className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                <Txt className="text-emerald-700 font-black text-xs uppercase tracking-wider">{deliveryProfile?.totalDeliveries || 0} Deliveries Completed</Txt>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Duty Status */}
            <Box className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between relative z-20 mx-0.5">
                <Box className="text-left">
                    <Txt className="text-lg font-black text-slate-900 tracking-tight">Availability Status</Txt>
                    <Txt className={`text-xs font-bold tracking-wider mt-0.5 transition-colors capitalize ${isOnline ? 'text-[#843D9B]' : 'text-slate-400'}`}>
                        {isOnline ? 'Active & Receiving Tasks' : 'Currently Off Duty'}
                    </Txt>
                </Box>

                {/* Interactive Toggle Switch */}
                <Btn onPress={handleToggleDuty} className={`w-14 h-8 rounded-full p-1 transition-colors duration-500 relative flex items-center shadow-inner ${isOnline ? 'bg-[#843D9B]' : 'bg-slate-200'}`}>
                    <Box className={`w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-500 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}>
                        {isOnline && <Box className="w-2 h-2 bg-[#843D9B] rounded-full animate-pulse"></Box>}
                    </Box>
                </Btn>
            </Box>

            {/* 1. Identity & Duty */}
            <Box className="mx-0.5">
                <Txt className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-2 italic">Identity & Performance</Txt>
                <Box className="space-y-1.5">
                    <MenuOption icon={User} color="bg-[#843D9B]" label="Identity Profile" subLabel={deliveryProfile?.kycStatus === 'verified' ? "Verified Partner" : "Update personal details"} onPress={() => {
          setPersonalInfo({
            name: deliveryProfile?.user?.name || user?.name || '',
            phone: deliveryProfile?.user?.phoneNumber || deliveryProfile?.user?.phone || user?.phoneNumber || user?.phone || '+91 98765 43210',
            emergencyPhone: deliveryProfile?.emergencyContact || '',
            vehicle: deliveryProfile?.vehicleNumber || deliveryProfile?.vehicle || user?.vehicleNumber || user?.vehicle || 'MH-12-DL-2024',
            profileImage: null,
            previewImage: deliveryProfile?.user?.profileImage || user?.profileImage || null
          });
          setIsEditing('personal');
        }} />
                    <MenuOption icon={Star} color="bg-[#843D9B]" label="Performance Rating" subLabel="Your overall service score" extra={<Txt className="bg-amber-50 text-xs font-black px-3 py-1 rounded-full text-amber-700 border border-amber-200 italic">{deliveryProfile?.rating?.toFixed(1) || '0.0'}</Txt>} onPress={() => toast.success('Performance details coming soon!')} />
                </Box>
            </Box>

            {/* 2. Financials */}
            <Box className="mx-0.5">
                <Txt className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-2 italic">Earnings & Bank</Txt>
                <Box className="space-y-1.5">
                    <MenuOption icon={Wallet} color="bg-[#843D9B]" label="Wallet & Earnings" subLabel="Check payout & balance" extra={<Txt className="bg-green-50 text-xs font-black px-3 py-1 rounded-full text-green-700 border border-green-200 italic">₹ {deliveryProfile?.walletBalance || 0}</Txt>} to="/delivery/wallet" />
                    <MenuOption icon={CreditCard} color="bg-[#843D9B]" label="Financial Routing" subLabel="Manage account & IFSC details" onPress={() => {
          if (deliveryProfile?.bankDetails) {
            setBankInfo({
              accountName: deliveryProfile.bankDetails.accountName || '',
              bank: deliveryProfile.bankDetails.bankName || '',
              accountNo: deliveryProfile.bankDetails.accountNumber || '',
              ifsc: deliveryProfile.bankDetails.ifscCode || ''
            });
          }
          setIsEditing('bank');
        }} />
                </Box>
            </Box>

            {/* 3. Settings & Support */}
            <Box className="mx-0.5">
                <Txt className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-2 italic">Platform Settings</Txt>
                <Box className="space-y-1.5">
                    <MenuOption icon={Bell} color="bg-[#843D9B]" label="Notifications" subLabel={notificationsEnabled ? "Alerts are active" : "Alerts are muted"} hideArrow={true} extra={<Box className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative flex items-center shadow-inner ${notificationsEnabled ? 'bg-[#843D9B]' : 'bg-slate-200'}`}>
                                <Box className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}>
                                </Box>
                            </Box>} onPress={() => {
          setNotificationsEnabled(!notificationsEnabled);
          toast.success(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`);
        }} />

                    <MenuOption icon={FileText} color="bg-[#843D9B]" label="KYC Documents" subLabel={kycStatus} onPress={() => setShowKYCModal(true)} />
                    <MenuOption icon={LifeBuoy} color="bg-[#843D9B]" label="Help & Support" subLabel="Raise support ticket" onPress={() => setShowSupport(true)} />
                </Box>
            </Box>

            {/* Logout & Delete Actions */}
            <Box className="pt-3 pb-4 space-y-3">
                <Btn onPress={async () => {
        try {
          const { testPushToThisDevice } = await import('../lib/push');
          await testPushToThisDevice();
          toast.success('Test push sent to this device!');
        } catch (err) {
          toast.error('Failed to send test push: ' + (err.response?.data?.message || err.message));
        }
      }} className="w-full bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <Box className="flex items-center gap-3.5">
                        <Box className="h-11 w-11 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:rotate-6 transition-transform">
                            <I icon={Bell} size={20} strokeWidth={2.5} />
                        </Box>
                        <Box className="text-left">
                            <Txt className="text-sm font-black text-indigo-700 uppercase tracking-wider italic leading-none">Test Notification</Txt>
                            <Txt className="text-xs font-bold text-indigo-400 mt-1">Send a test push alert to device</Txt>
                        </Box>
                    </Box>
                    <I icon={ChevronRight} size={18} className="text-indigo-400" />
                </Btn>

                <Btn onPress={async () => {
        await logout();
        navigate('/delivery/login');
      }} className="w-full bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <Box className="flex items-center gap-3.5">
                        <Box className="h-11 w-11 bg-[#843D9B] rounded-2xl flex items-center justify-center text-[#E2C17D] shadow-md shadow-purple-200 group-hover:rotate-6 transition-transform">
                            <I icon={LogOut} size={20} strokeWidth={2.5} />
                        </Box>
                        <Box className="text-left">
                            <Txt className="text-sm font-black text-red-600 uppercase tracking-wider italic leading-none">Secure Logout</Txt>
                            <Txt className="text-xs font-bold text-red-400 mt-1">Sign out of SewZelaa partner app</Txt>
                        </Box>
                    </Box>
                    <I icon={ChevronRight} size={18} className="text-red-300" />
                </Btn>

                <Btn onPress={() => setShowDeleteModal(true)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <Box className="flex items-center gap-3.5">
                        <Box className="h-11 w-11 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-100 group-hover:rotate-6 transition-transform">
                            <I icon={Trash2} size={20} strokeWidth={2.5} />
                        </Box>
                        <Box className="text-left">
                            <Txt className="text-sm font-black text-red-600 uppercase tracking-wider italic leading-none">Delete Account</Txt>
                            <Txt className="text-xs font-bold text-red-400 mt-1">Permanently remove your account</Txt>
                        </Box>
                    </Box>
                    <I icon={ChevronRight} size={18} className="text-red-300" />
                </Btn>
                <Txt className="text-center mt-6 text-xs font-black text-slate-400 uppercase tracking-widest opacity-60">SewZelaa • Version 1.2 (Beta)</Txt>
            </Box>

            {/* Platform Rules Modal */}
            <React.Fragment>
                {showRules && <Sheet visible={!!(showRules)} onClose={() => setShowRules(false)} className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border border-slate-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                            <Btn onPress={() => setShowRules(false)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20">
                                <I icon={X} size={18} />
                            </Btn>
                            <Box className="flex items-center gap-3.5 mb-6">
                                <Box className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <I icon={Book} size={28} />
                                </Box>
                                <Box>
                                    <Txt className="text-2xl font-black text-slate-900 tracking-tight">Platform Rules</Txt>
                                    <Txt className="text-xs tracking-widest font-bold text-slate-400 uppercase mt-0.5">Strict Partner Compliance</Txt>
                                </Box>
                            </Box>
                            <Box className="space-y-4">
                                <Box className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
                                    <Txt className="text-xs font-black text-rose-600 tracking-widest mb-1.5 uppercase">Fabric Liability</Txt>
                                    <Txt className="text-xs sm:text-sm text-rose-500/90 font-medium leading-relaxed">Delivery partners are strictly liable for any damage or loss of fabric during transit. Capture clear proof at pickup.</Txt>
                                </Box>
                                <Box className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                    <Txt className="text-xs font-black text-slate-700 tracking-widest mb-1.5 uppercase">C.O.D Remittance</Txt>
                                    <Txt className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">Cash On Delivery collected for readymade orders must be settled with the platform within 24 hours.</Txt>
                                </Box>
                                <Box className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                    <Txt className="text-xs font-black text-slate-700 tracking-widest mb-1.5 uppercase">Professionalism</Txt>
                                    <Txt className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">Maintain a professional demeanor with customers and tailors. Severe complaints may lead to account suspension.</Txt>
                                </Box>
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>

            {/* Help & Support Modal */}
            <React.Fragment>
                {showSupport && <Sheet visible={!!(showSupport)} onClose={() => setShowSupport(false)} className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border border-slate-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                            <Btn onPress={() => setShowSupport(false)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20">
                                <I icon={X} size={18} />
                            </Btn>
                            <Box className="flex items-center gap-3.5 mb-6">
                                <Box className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <I icon={LifeBuoy} size={28} />
                                </Box>
                                <Box>
                                    <Txt className="text-2xl font-black text-slate-900 tracking-tight">Help & Support</Txt>
                                    <Txt className="text-xs tracking-widest font-bold text-slate-400 uppercase mt-0.5">Raise Support Ticket</Txt>
                                </Box>
                            </Box>
                            <Box className="space-y-4">
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-2 block uppercase">Describe your issue</Txt>
                                    <Input rows="4" value={supportIssue} onChangeText={e => setSupportIssue(e)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all resize-none shadow-sm" placeholder="I need assistance with..." multiline></Input>
                                </Box>
                                <Btn onPress={handleSupportSubmit} className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black tracking-wider text-sm sm:text-base hover:bg-black active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2.5 uppercase">
                                    <I icon={Send} size={18} /> Submit Ticket
                                </Btn>

                                {/* Direct Helpline & Email Channels */}
                                <Box className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <Btn onPress={() => Linking.openURL(`tel:${(supportPhone || '+91 9429692921').replace(/[^+\d]/g, '')}`)} className="p-3 bg-purple-50 hover:bg-purple-100/70 border border-purple-100 rounded-xl flex items-center gap-2.5 transition-colors group">
                                        <Box className="w-8 h-8 rounded-lg bg-[#843D9B] text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <I icon={Phone} size={14} />
                                        </Box>
                                        <Box className="min-w-0">
                                            <Txt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Helpline</Txt>
                                            <Txt className="text-xs font-black text-slate-800 truncate font-mono">{supportPhone || '+91 9429692921'}</Txt>
                                        </Box>
                                    </Btn>
                                    <Btn onPress={() => Linking.openURL(`mailto:${supportEmail || 'support@silaiwala.com'}?subject=Delivery Partner Support Request`)} className="p-3 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 rounded-xl flex items-center gap-2.5 transition-colors group">
                                        <Box className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <I icon={Mail} size={14} />
                                        </Box>
                                        <Box className="min-w-0">
                                            <Txt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Support</Txt>
                                            <Txt className="text-xs font-black text-slate-800 truncate">{supportEmail || 'support@silaiwala.com'}</Txt>
                                        </Box>
                                    </Btn>
                                </Box>
                                
                                {myTickets.length > 0 && <Scroll contentClassName="pt-6 pr-2" className="mt-8 border-t border-slate-100 max-h-[300px]" nestedScrollEnabled>
                                        <Txt className="text-xs font-black text-slate-400 tracking-widest mb-4 uppercase sticky top-0 bg-white z-10 py-1">Recent Tickets</Txt>
                                        <Box className="space-y-4">
                                            {myTickets.map(ticket => <Box key={ticket._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                    <Box className="flex items-center justify-between mb-2">
                                                        <Txt className="text-xs font-bold text-slate-900">{new Date(ticket.createdAt).toLocaleDateString()}</Txt>
                                                        <Txt className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {ticket.status}
                                                        </Txt>
                                                    </Box>
                                                    <Txt className="text-sm text-slate-700 mb-3 font-medium">{ticket.message}</Txt>
                                                    {ticket.adminResponse && <Box className="bg-white border border-slate-200 rounded-xl p-3.5">
                                                            <Txt className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Support Response</Txt>
                                                            <Txt className="text-sm text-slate-800 font-semibold">{ticket.adminResponse}</Txt>
                                                        </Box>}
                                                </Box>)}
                                        </Box>
                                    </Scroll>}
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>

            {/* KYC Upload Modal */}
            <React.Fragment>
                {showKYCModal && <Sheet visible={!!(showKYCModal)} onClose={() => setShowKYCModal(false)} className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[88vh] overflow-y-auto border border-slate-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                            <Btn onPress={() => setShowKYCModal(false)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20">
                                <I icon={X} size={18} />
                            </Btn>

                            <Box className="text-center mb-8">
                                <Box className="w-16 h-16 bg-indigo-50 text-[#843D9B] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-indigo-100">
                                    <I icon={ShieldCheck} size={36} />
                                </Box>
                                <Txt className="text-2xl font-black text-slate-900 tracking-tight">Identity Verification</Txt>
                                <Txt className="text-xs font-bold text-slate-400 tracking-wider mt-1 uppercase">Submit valid documents for partner approval</Txt>
                            </Box>

                            <Box className="space-y-5 mb-6">
                                {/* Aadhar Card Upload */}
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-2 flex items-center gap-2 uppercase">
                                        <Box className="w-2 h-2 rounded-full bg-[#843D9B]"></Box>
                                        Aadhar Card / Voter ID
                                    </Txt>
                                    <Btn onPress={() => pickImage({ camera: true }).then(file => file && (async e => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                      const res = await api.post('/upload', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data'
                        }
                      });
                      setAadharImage(res.data.data);
                      toast.success('Aadhar uploaded');
                    } catch (err) {
                      toast.error('Aadhar upload failed');
                    }
                  }
                })({ target: { files: [file], value: file.name } }))} className="w-full h-28 sm:h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center hover:bg-purple-50/50 hover:border-[#843D9B] hover:text-[#843D9B] transition-all text-slate-400 group cursor-pointer relative overflow-hidden shadow-sm">
                                        
                                        {aadharImage ? <Box className="absolute inset-0 w-full h-full bg-slate-900/10 flex items-center justify-center backdrop-blur-sm">
                                                <Img src={aadharImage} alt="Aadhar" className="w-full h-full object-cover opacity-60" />
                                                <I icon={CheckCircle2} size={36} className="text-[#843D9B] absolute drop-shadow-md bg-white rounded-full" />
                                            </Box> : <>
                                                <I icon={UploadCloud} size={28} className="mb-2 group-hover:-translate-y-1 transition-transform text-[#843D9B]" />
                                                <Txt className="text-xs font-extrabold tracking-wider uppercase">Tap to Upload Document</Txt>
                                            </>}
                                    </Btn>
                                </Box>

                                {/* Driving License Upload */}
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-2 flex items-center gap-2 uppercase">
                                        <Box className="w-2 h-2 rounded-full bg-slate-500"></Box>
                                        Valid Driving License
                                    </Txt>
                                    <Btn onPress={() => pickImage({ camera: true }).then(file => file && (async e => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                      const res = await api.post('/upload', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data'
                        }
                      });
                      setLicenseImage(res.data.data);
                      toast.success('License uploaded');
                    } catch (err) {
                      toast.error('License upload failed');
                    }
                  }
                })({ target: { files: [file], value: file.name } }))} className="w-full h-28 sm:h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700 transition-all text-slate-400 group cursor-pointer relative overflow-hidden shadow-sm">
                                        
                                        {licenseImage ? <Box className="absolute inset-0 w-full h-full bg-slate-900/10 flex items-center justify-center backdrop-blur-sm">
                                                <Img src={licenseImage} alt="License" className="w-full h-full object-cover opacity-60" />
                                                <I icon={CheckCircle2} size={36} className="text-[#843D9B] absolute drop-shadow-md bg-white rounded-full" />
                                            </Box> : <>
                                                <I icon={UploadCloud} size={28} className="mb-2 group-hover:-translate-y-1 transition-transform text-slate-500" />
                                                <Txt className="text-xs font-extrabold tracking-wider uppercase">Tap to Upload License</Txt>
                                            </>}
                                    </Btn>
                                </Box>
                            </Box>

                            <Btn onPress={handleKYCSubmit} className="w-full bg-[#843D9B] hover:bg-[#6e3082] text-white rounded-2xl py-4 font-black tracking-widest text-sm sm:text-base active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2.5 uppercase">
                                <I icon={CheckCircle2} size={18} /> Submit Documents
                            </Btn>

                            <Txt className="text-center mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                Documents are encrypted securely.
Verification completed within 24 hours.
                            </Txt>
                        </Box>
</Sheet>}
            </React.Fragment>

            {/* Edit Profile (Identity Profile) Full Page / Bottom Sheet Modal */}
            <React.Fragment>
                {isEditing === 'personal' && <Sheet visible={isEditing === 'personal'} onClose={() => setIsEditing(null)} className={`bg-white w-full h-full sm:h-auto sm:max-w-lg p-6 sm:p-8 sm:rounded-[2.5rem] shadow-2xl relative overflow-y-auto flex flex-col justify-between`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box>
                                <Box className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                                <Btn onPress={() => setIsEditing(null)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-colors z-20 shadow-sm">
                                    <I icon={X} size={20} />
                                </Btn>

                                <Box className="flex items-center gap-3.5 mb-6">
                                    <Box className="w-14 h-14 bg-fuchsia-50 text-[#843D9B] rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-fuchsia-100">
                                        <I icon={User} size={28} />
                                    </Box>
                                    <Box>
                                        <Txt className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Identity Profile</Txt>
                                        <Txt className="text-xs tracking-wider font-extrabold text-slate-400 uppercase mt-0.5">Partner Profile Details</Txt>
                                    </Box>
                                </Box>

                                <Box className="space-y-4">
                                    <Box className="flex flex-col items-center mb-4">
                                        <Btn onPress={() => pickImage({ camera: true }).then(file => file && (e => {
                    const file = e.target.files[0];
                    if (file) {
                      setPersonalInfo({
                        ...personalInfo,
                        profileImage: file,
                        previewImage: file.uri
                      });
                    }
                  })({ target: { files: [file], value: file.name } }))} className="relative cursor-pointer group">
                                            <Box className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-dashed border-[#843D9B] overflow-hidden flex items-center justify-center bg-fuchsia-50 group-hover:bg-fuchsia-100 transition-all shadow-md">
                                                {personalInfo.previewImage ? <Img src={personalInfo.previewImage} alt="Profile" className="w-full h-full object-cover" /> : <I icon={User} size={36} className="text-[#843D9B]" />}
                                            </Box>
                                            <Box className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <I icon={Camera} size={28} className="text-white" />
                                            </Box>
                                            
                                        </Btn>
                                        <Txt className="text-xs font-black text-[#843D9B] uppercase tracking-wider mt-2.5">Update Profile Photo</Txt>
                                    </Box>

                                    <Box>
                                        <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">
                                            Full Name
                                        </Txt>
                                        <Input value={personalInfo.name} onChangeText={e => {
                  let val = e.replace(/[^A-Za-z0-9 ]/g, '');
                  if (val.length > 0) {
                    val = val.charAt(0).toUpperCase() + val.slice(1);
                  }
                  setPersonalInfo({
                    ...personalInfo,
                    name: val
                  });
                }} placeholder="Enter your full name" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm" />
                                    </Box>

                                    {/* Registered Phone Number - Non-editable */}
                                    <Box>
                                        <Box className="flex items-center justify-between mb-1.5">
                                            <Txt className="text-xs font-black text-slate-700 tracking-wider flex items-center gap-1.5 uppercase">
                                                Phone Number (Registered)
                                            </Txt>
                                            <Txt className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                <I icon={Lock} size={10} /> Non-editable
                                            </Txt>
                                        </Box>
                                        <Box className="relative">
                                            <Input value={personalInfo.phone || deliveryProfile?.user?.phoneNumber || deliveryProfile?.user?.phone || user?.phoneNumber || user?.phone || '+91 98765 43210'} readOnly className="w-full bg-slate-100/90 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-bold text-slate-700 cursor-not-allowed opacity-90 shadow-none select-none pr-10" keyboardType="phone-pad" />
                                            <I icon={Lock} size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </Box>
                                        <Txt className="text-[10px] font-extrabold text-slate-400 mt-1">Phone number is locked by admin for account security</Txt>
                                    </Box>

                                    <Box>
                                        <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">
                                            Emergency Contact Number
                                        </Txt>
                                        <Input value={personalInfo.emergencyPhone} onChangeText={e => {
                  let val = e.replace(/[^0-9]/g, '');
                  if (val.length > 10) val = val.slice(0, 10);
                  setPersonalInfo({
                    ...personalInfo,
                    emergencyPhone: val
                  });
                }} placeholder="10 digit mobile number" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm" keyboardType="phone-pad" />
                                    </Box>

                                    {/* Vehicle Number - Non-editable */}
                                    <Box>
                                        <Box className="flex items-center justify-between mb-1.5">
                                            <Txt className="text-xs font-black text-slate-700 tracking-wider flex items-center gap-1.5 uppercase">
                                                Vehicle Number
                                            </Txt>
                                            <Txt className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                <I icon={Lock} size={10} /> Non-editable
                                            </Txt>
                                        </Box>
                                        <Box className="relative">
                                            <Input value={personalInfo.vehicle || deliveryProfile?.vehicleNumber || deliveryProfile?.vehicle || user?.vehicleNumber || user?.vehicle || 'MH-12-DL-2024'} readOnly className="w-full bg-slate-100/90 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-bold text-slate-700 cursor-not-allowed uppercase opacity-90 shadow-none select-none pr-10" />
                                            <I icon={Lock} size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </Box>
                                        <Txt className="text-[10px] font-extrabold text-slate-400 mt-1">Vehicle registration verified by partner admin</Txt>
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="pt-4 mt-2">
                                <Btn onPress={() => handleSave('personal')} className="w-full bg-[#843D9B] hover:bg-[#6e3082] text-white rounded-2xl py-4 font-black tracking-widest text-sm sm:text-base hover:shadow-xl hover:shadow-[#843D9B]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 uppercase shadow-lg">
                                    <I icon={CheckCircle2} size={18} /> Save Changes
                                </Btn>
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>

            {/* Edit Bank Modal */}
            <React.Fragment>
                {isEditing === 'bank' && <Sheet visible={isEditing === 'bank'} onClose={() => setIsEditing(null)} className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                            <Btn onPress={() => setIsEditing(null)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-colors z-20">
                                <I icon={X} size={18} />
                            </Btn>

                            <Box className="flex items-center gap-3.5 mb-6">
                                <Box className="w-14 h-14 bg-fuchsia-50 text-[#843D9B] rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                    <I icon={CreditCard} size={28} />
                                </Box>
                                <Box>
                                    <Txt className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Financial Routing</Txt>
                                    <Txt className="text-xs tracking-wider font-extrabold text-slate-400 uppercase mt-0.5">Update bank details for payouts</Txt>
                                </Box>
                            </Box>

                            <Box className="space-y-4">
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">Account Holder Name</Txt>
                                    <Input value={bankInfo.accountName} onChangeText={e => {
                let val = e.replace(/[^A-Za-z0-9 ]/g, '');
                if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1);
                setBankInfo({
                  ...bankInfo,
                  accountName: val
                });
              }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm" />
                                </Box>
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">Bank Name</Txt>
                                    <Input value={bankInfo.bank} onChangeText={e => {
                let val = e.replace(/[^A-Za-z0-9 ]/g, '');
                if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1);
                setBankInfo({
                  ...bankInfo,
                  bank: val
                });
              }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm" />
                                </Box>
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">Account Number</Txt>
                                    <Input value={bankInfo.accountNo} onChangeText={e => {
                let val = e.replace(/[^0-9]/g, '');
                if (val.length > 18) val = val.slice(0, 18);
                setBankInfo({
                  ...bankInfo,
                  accountNo: val
                });
              }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm tracking-wider" />
                                </Box>
                                <Box>
                                    <Txt className="text-xs font-black text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5 uppercase">IFSC Code</Txt>
                                    <Input value={bankInfo.ifsc} onChangeText={e => {
                let val = e.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                if (val.length > 11) val = val.slice(0, 11);
                setBankInfo({
                  ...bankInfo,
                  ifsc: val
                });
              }} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base font-black text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/10 transition-all shadow-sm tracking-widest" />
                                </Box>
                                <Btn onPress={() => handleSave('bank')} className="w-full bg-[#843D9B] hover:bg-[#6e3082] text-white rounded-2xl py-4 font-black tracking-widest text-sm sm:text-base hover:shadow-xl hover:shadow-[#843D9B]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 uppercase mt-3 shadow-lg">
                                    <I icon={CheckCircle2} size={18} /> Save Changes
                                </Btn>
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && <Dialog visible={!!(showDeleteModal)} onClose={() => setShowDeleteModal(false)} className={`bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 space-y-6`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Box className="flex flex-col items-center text-center gap-3">
                            <Box className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                                <I icon={AlertTriangle} size={32} className="text-red-600" />
                            </Box>
                            <Txt className="text-xl font-black text-slate-900 tracking-tight">Delete Account?</Txt>
                            <Txt className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">This action is <Txt className="font-bold text-red-600">permanent</Txt> and cannot be undone. All your delivery data, earnings, and history will be lost forever.</Txt>
                        </Box>
                        <Box>
                            <Txt className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block text-center">Type DELETE to confirm</Txt>
                            <Input value={deleteConfirmText} onChangeText={e => setDeleteConfirmText(e)} placeholder="DELETE" className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl text-base font-black text-center tracking-widest focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all" />
                        </Box>
                        <Box className="flex gap-3">
                            <Btn onPress={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all">
                                Cancel
                            </Btn>
                            <Btn onPress={async () => {
            if (deleteConfirmText !== 'DELETE') return;
            setIsDeleting(true);
            try {
              await api.delete('/auth/delete-account');
              await logout();
              navigate('/delivery/login');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to delete account');
            } finally {
              setIsDeleting(false);
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }
          }} disabled={deleteConfirmText !== 'DELETE' || isDeleting} className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">
                                {isDeleting ? 'Deleting...' : 'Delete Forever'}
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}
        </Box>;
};
export default DeliveryProfile;
