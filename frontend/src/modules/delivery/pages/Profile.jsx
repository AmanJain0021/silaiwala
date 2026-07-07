import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { 
  FiUser, FiMail, FiPhone, FiTruck, FiEdit2, FiSave, FiX, FiLogOut, 
  FiCheckCircle, FiCreditCard, FiSmartphone, FiDollarSign, FiInfo, 
  FiAlertCircle, FiActivity, FiMapPin, FiCamera, FiImage
} from 'react-icons/fi';
import PageTransition from '../../../shared/components/PageTransition';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../shared/utils/helpers';
import api from '../../../utils/api';

import { useRef } from 'react';

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const avatarGalleryRef = useRef(null);
  const kycInputRef = useRef(null);
  const kycGalleryRef = useRef(null);
  const { deliveryBoy, updateProfile, fetchProfile, fetchProfileSummary, isLoading, logout } = useDeliveryAuthStore();
  
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'banking'
  const [isEditing, setIsEditing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  
  const [profileMetrics, setProfileMetrics] = useState({
    totalDeliveries: 0,
    completedToday: 0,
    earnings: 0,
    cashInHand: 0,
    totalCashCollected: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    emergencyContact: '',
    aadharNumber: '',
    kycDocument: '',
    upiId: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    }
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoadFailed(false);
      const profile = await fetchProfile();
      try {
        const summary = await fetchProfileSummary();
        setProfileMetrics({
          totalDeliveries: Number(summary?.totalDeliveries || 0),
          completedToday: Number(summary?.completedToday || 0),
          earnings: Number(summary?.earnings || 0),
          cashInHand: Number(summary?.cashInHand || 0),
          totalCashCollected: Number(summary?.totalCashCollected || 0),
        });
      } catch (err) {
        console.error("Summary fetch failed:", err);
        setProfileMetrics({
          totalDeliveries: Number(profile?.totalDeliveries || 0),
          completedToday: 0,
          earnings: 0,
          cashInHand: 0,
          totalCashCollected: 0,
        });
      }
    } catch {
      setLoadFailed(true);
    }
  }, [fetchProfile, fetchProfileSummary]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (deliveryBoy) {
      setFormData({
        name: deliveryBoy.name || '',
        email: deliveryBoy.email || '',
        phone: deliveryBoy.phone || '',
        vehicleType: deliveryBoy.vehicleType || '',
        vehicleNumber: deliveryBoy.vehicleNumber || '',
        emergencyContact: deliveryBoy.emergencyContact || '',
        aadharNumber: deliveryBoy.aadharNumber || '',
        kycDocument: (deliveryBoy.documents && deliveryBoy.documents.length > 0) ? deliveryBoy.documents[0].url : '',
        upiId: deliveryBoy.upiId || '',
        bankDetails: {
          accountHolderName: deliveryBoy.bankDetails?.accountHolderName || '',
          accountNumber: deliveryBoy.bankDetails?.accountNumber || '',
          ifscCode: deliveryBoy.bankDetails?.ifscCode || '',
          bankName: deliveryBoy.bankDetails?.bankName || '',
        }
      });
    }
  }, [deliveryBoy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Accept alphabet and spaces only for bank and holder name
    if (name === 'bankDetails.accountHolderName' || name === 'bankDetails.bankName' || name === 'name') {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    if (name.includes('.')) {
      const [field, subField] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field], [subField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) return toast.error('Name is required');
    if (!formData.email?.trim()) return toast.error('Email is required');
    
    try {
      await updateProfile({
        ...formData,
        email: formData.email.trim().toLowerCase(),
      });
      setIsEditing(false);
      toast.success('KYC & Profile details updated successfully');
    } catch {
      // Error handled by API interceptor
    }
  };

  const handleCancel = () => {
    if (deliveryBoy) {
      setFormData({
        name: deliveryBoy.name || '',
        email: deliveryBoy.email || '',
        phone: deliveryBoy.phone || '',
        vehicleType: deliveryBoy.vehicleType || '',
        vehicleNumber: deliveryBoy.vehicleNumber || '',
        emergencyContact: deliveryBoy.emergencyContact || '',
        aadharNumber: deliveryBoy.aadharNumber || '',
        kycDocument: (deliveryBoy.documents && deliveryBoy.documents.length > 0) ? deliveryBoy.documents[0].url : '',
        upiId: deliveryBoy.upiId || '',
        bankDetails: {
          accountHolderName: deliveryBoy.bankDetails?.accountHolderName || '',
          accountNumber: deliveryBoy.bankDetails?.accountNumber || '',
          ifscCode: deliveryBoy.bankDetails?.ifscCode || '',
          bankName: deliveryBoy.bankDetails?.bankName || '',
        }
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/delivery/login');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) return toast.error('Image size must be less than 2MB');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result;
        await updateProfile({ avatar: base64String });
        toast.success('Profile picture updated!');
      } catch (err) {
        toast.error('Failed to update profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKycChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be less than 5MB');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, kycDocument: base64String }));
        if (!isEditing) {
           await updateProfile({ ...formData, kycDocument: base64String });
           toast.success('KYC Document saved!');
        }
      } catch (err) {
        toast.error('Failed to upload document');
      }
    };
    reader.readAsDataURL(file);
  };

  const stats = [
    { label: 'Total Earnings', value: formatPrice(Number(deliveryBoy?.totalEarnings || 0)), icon: FiCreditCard, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    { label: 'Available Payout', value: formatPrice(Number(deliveryBoy?.availableBalance || 0)), icon: FiDollarSign, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Total Deliveries', value: Number(deliveryBoy?.totalDeliveries || 0), icon: FiTruck, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    { label: 'Completed Today', value: Number(profileMetrics.completedToday || 0), icon: FiCheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Cash in Hand', value: formatPrice(Number(profileMetrics.cashInHand || 0)), icon: FiActivity, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Avg Rating', value: Number(deliveryBoy?.rating || 0).toFixed(1), icon: FiUser, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  ];

  if (loadFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <FiAlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-slate-800">Connection Error</h2>
        <p className="text-slate-500 mt-2">Failed to load profile details. Please check your connection.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Retry</button>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Profile Header (Proper Logistics Style) */}
        <div className="bg-[#1E293B] pt-6 pb-12 px-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Partner Account</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status & Credentials</p>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-white">
                <FiEdit2 size={16} />
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">
                Editing Mode
              </div>
            )}
          </div>

          <div className="relative z-10 flex items-center gap-4">
             <div className="flex flex-col items-center gap-2">
               <div className="w-16 h-16 shrink-0 aspect-square bg-[#0F172A] rounded-2xl flex items-center justify-center border-2 border-white/10 shadow-xl relative overflow-hidden">
                 {deliveryBoy?.avatar ? (
                   <img src={deliveryBoy.avatar} alt="P" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-white text-xl font-bold">{deliveryBoy?.name?.charAt(0) || 'D'}</span>
                 )}
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-1 rounded hover:bg-white/20 transition-all flex items-center gap-1" title="Camera"><FiCamera /> Cam</button>
                  <button onClick={() => { if (avatarGalleryRef.current) avatarGalleryRef.current.click(); }} className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-1 rounded hover:bg-white/20 transition-all flex items-center gap-1" title="Gallery"><FiImage /> Gal</button>
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={handleImageChange} />
               <input type="file" ref={avatarGalleryRef} className="hidden" accept="image/*" onChange={handleImageChange} />
             </div>
            
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white tracking-tight truncate">{deliveryBoy?.name || 'Partner'}</h2>
                {deliveryBoy?.kycStatus === 'verified' && <FiCheckCircle size={14} className="text-emerald-400 shrink-0" />}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FiMail size={11} className="shrink-0" />
                  <span className="text-[10px] font-medium truncate max-w-[120px]">{deliveryBoy?.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FiPhone size={11} className="shrink-0" />
                  <span className="text-[10px] font-medium">{deliveryBoy?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-4 -mt-6 relative z-20 space-y-4 pb-24 max-w-lg mx-auto">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 gap-3">
             {stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center shrink-0`}>
                       <stat.icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                      <p className="text-[13px] font-bold text-slate-800 truncate">{stat.value}</p>
                    </div>
                  </div>
                </div>
             ))}
          </div>

          {/* Test Push Notification (Moved to top so it's always visible) */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-indigo-900">Push Notifications</h3>
                <p className="text-[10px] text-indigo-600 mt-0.5">Verify your device is receiving alerts</p>
              </div>
              <button 
                onClick={async () => {
                    try {
                        await api.post('/notifications/test-push');
                        toast.success('Test push sent successfully!');
                    } catch (err) {
                        toast.error('Failed to send test push: ' + (err.response?.data?.message || err.message));
                    }
                }} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all"
              >
                <FiAlertCircle size={14} /> Send Test
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/50 shadow-inner">
            {['personal', 'banking'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                 className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1E293B] text-white shadow-lg' : 'text-slate-400'}`}
               >
                 {tab === 'personal' ? 'Identity' : 'Settlement'}
               </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'personal' ? (
              <motion.div key="identity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-0.5 h-3 bg-indigo-600 rounded-full" />
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Ledger</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        {isEditing ? (
                          <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800" />
                        ) : (
                          <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800">{formData.name || 'Set Name'}</div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                          {isEditing ? (
                             <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800">
                               <option value="">Select Type</option>
                               <option value="Two Wheeler">Two Wheeler</option>
                               <option value="Three Wheeler">Three Wheeler</option>
                               <option value="Four Wheeler">Four Wheeler</option>
                             </select>
                          ) : (
                             <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800">{formData.vehicleType || 'Not Specified'}</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plate Number</label>
                          {isEditing ? (
                             <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800 uppercase" />
                          ) : (
                             <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800 uppercase">{formData.vehicleNumber || 'Registering...'}</div>
                          )}
                        </div>
                      </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Aadhar Number (KYC)</label>
                        {isEditing ? (
                          <input name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800" placeholder="XXXX XXXX XXXX XXXX" />
                        ) : (
                          <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800">{formData.aadharNumber || 'Not Set'}</div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">KYC Document (Aadhar/PAN)</label>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => { if (kycInputRef.current) kycInputRef.current.click(); }}
                              className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700"
                            >
                              <FiCamera size={12} /> Camera
                            </button>
                            <button 
                              onClick={() => { if (kycGalleryRef.current) kycGalleryRef.current.click(); }}
                              className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700"
                            >
                              <FiImage size={12} /> Gallery
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                          {formData.kycDocument || (deliveryBoy?.documents && deliveryBoy.documents.length > 0) ? (
                            <img src={formData.kycDocument || (deliveryBoy.documents && deliveryBoy.documents[0].url)} alt="KYC" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col gap-3 w-full px-4">
                              <button onClick={() => { if (kycInputRef.current) kycInputRef.current.click(); }} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                <FiCamera size={14} /> Open Camera
                              </button>
                              <button onClick={() => { if (kycGalleryRef.current) kycGalleryRef.current.click(); }} className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                <FiImage size={14} /> Upload from Gallery
                              </button>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            ref={kycInputRef} 
                            className="hidden" 
                            onChange={handleKycChange}
                          />
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={kycGalleryRef} 
                            className="hidden" 
                            onChange={handleKycChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
              </motion.div>
            ) : (
              <motion.div key="banking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${deliveryBoy?.kycStatus === 'verified' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${deliveryBoy?.kycStatus === 'verified' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    <FiCheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Verification Status</p>
                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
                      {deliveryBoy?.kycStatus === 'verified' ? 'System Verified' : 'Under Review'}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                   <div className="flex items-center gap-2 mb-1">
                    <div className="w-0.5 h-3 bg-indigo-600 rounded-full" />
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settlement Vault</h2>
                  </div>

                  <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Holder</label>
                        {isEditing ? (
                          <input name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800 uppercase" />
                        ) : (
                          <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800 uppercase">{formData.bankDetails.accountHolderName || 'Verify Bank'}</div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                        {isEditing ? (
                          <input name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800" />
                        ) : (
                          <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800">{formData.bankDetails.bankName || 'Not Set'}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account No.</label>
                          {isEditing ? (
                            <input name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800" />
                          ) : (
                            <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800 tracking-tighter">•••• {formData.bankDetails.accountNumber?.slice(-4) || 'XXXX'}</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">IFSC Code</label>
                          {isEditing ? (
                            <input name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-800 uppercase" />
                          ) : (
                            <div className="px-4 py-3 bg-slate-100/50 rounded-xl font-bold text-sm text-slate-800 uppercase">{formData.bankDetails.ifscCode || 'None'}</div>
                          )}
                        </div>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout Section */}
          {!isEditing && (
            <div className="flex flex-col gap-4 mt-6">
              <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-rose-100 text-rose-600 rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-sm active:scale-95 transition-all">
                <FiLogOut size={16} /> Sign Out Partner
              </button>
              <div className="text-center opacity-30">
                <p className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">Infrastructure Secure • v2.0.4</p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer for Edit Mode */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex gap-3 max-w-lg mx-auto"
            >
              <button onClick={handleCancel} disabled={isLoading} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isLoading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/20">
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave size={16} /> Save Changes</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default DeliveryProfile;
