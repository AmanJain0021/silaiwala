// Port of modules/tailor/pages/ProfileSettings.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import { GOOGLE_MAPS_API_KEY } from '../lib/config';
import { alert } from '../lib/alert';
import { isPickedFile } from '../lib/files';
import Svg, { Path } from 'react-native-svg';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { useNavigate,  } from '../lib/nav';
import { ArrowLeft, Edit2, History, Bell, MapPin, Shield, LogOut, ChevronRight, FileText, Save, X, Phone, Mail, Wallet, Star, Ticket, Navigation, Trash2, AlertTriangle } from "lucide-react-native";
import MenuOption from "../components/customer/profile/MenuOption";
import { Input, Button } from "../components/tailor/UIElements";
import { useTailorAuth } from "../context/tailor/AuthContext";
import api from "../lib/api";
import toast from '../lib/toast';
import ImageUploader from "../components/common/ImageUploader";
import useUnifiedLocation from "../shared/hooks/useUnifiedLocation";
import PlacesAutocompleteField from "../components/shared/PlacesAutocompleteField";
import LocationPickerMap from "../components/shared/LocationPickerMap";
import { reverseGeocode } from "../utils/reverseGeocode";
import useBrandingStore from "../store/brandingStore";
import { I, Box, Txt, Btn, Img, Scroll, Input as PInput } from '../components/ui/primitives';
const ProfileSettings = () => {
  const navigate = useNavigate();
  const {
    logout
  } = useTailorAuth();
  const appName = useBrandingStore(state => state.appName);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'pickup', 'terms', 'privacy'
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isSubEnabled, setIsSubEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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
  const {
    detectLocation,
    isLocating
  } = useUnifiedLocation({
    fetchAddress: true
  });
  const isLoaded = true;
  const loadError = null;
  useEffect(() => {
    if (showDeleteModal || showLogoutModal || activeModal) {
    } else {
    }
    return () => {
    };
  }, [showDeleteModal, showLogoutModal, activeModal]);
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
            address: data.location?.address || '',
            latitude: data.location?.coordinates?.[1] || null,
            longitude: data.location?.coordinates?.[0] || null,
            profileImage: data.user?.profileImage || ''
          });
        }
        try {
          const cfgRes = await api.get('/subscriptions/config');
          if (cfgRes.data?.success && cfgRes.data.data?.tailorSubscriptionEnabled === false) {
            setIsSubEnabled(false);
          }
        } catch (e) {}
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
  const handleMapClick = async ({ latitude: lat, longitude: lng }) => {
    // web: google.maps.Geocoder; native: the same reverse-geocode tiers as the rest of the app
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const res = await reverseGeocode(lat, lng);
      if (res?.formattedAddress) setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address: res.formattedAddress }));
    } catch (_) { /* keep coordinates only, like the web on geocoder failure */ }
  };
  const handleSave = async e => {
    // Strict Owner Name validation (Letters and spaces only, no numbers or special chars)
    const cleanName = (formData.name || '').replace(/[^a-zA-Z\s]/g, '').trim();
    if (!cleanName) {
      toast.error('Owner name should contain only letters and spaces');
      return;
    }

    // Strict 10-digit Contact Number validation
    const cleanPhone = (formData.phoneNumber || '').replace(/\D/g, '');
    if (!cleanPhone) {
      toast.error('Contact number is required');
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error('Contact number must be exactly 10 digits');
      return;
    }
    setIsSaving(true);
    try {
      let uploadedImageUrl = formData.profileImage;
      if (isPickedFile(formData.profileImage)) {
        const formDataObj = new FormData();
        formDataObj.append('image', formData.profileImage);
        formDataObj.append('folder', 'tailor_profiles');
        try {
          const res = await api.post('/upload/public', formDataObj, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          uploadedImageUrl = res.data.data;
        } catch (err) {
          toast.error('Failed to upload image');
          setIsSaving(false);
          return;
        }
      }
      const payload = {
        ...formData,
        phoneNumber: cleanPhone,
        profileImage: uploadedImageUrl
      };
      const res = await api.patch('/tailors/profile', payload);
      if (res.data.success) {
        setProfile(res.data.data);
        setFormData({
          ...formData,
          phoneNumber: cleanPhone,
          profileImage: uploadedImageUrl
        });
        setIsEditing(false);
        toast.success("Profile details saved successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };
  const handleLogout = async () => {
    await logout();
    navigate('/partner/login');
  };
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await api.delete('/auth/delete-account');
      await logout();
      navigate('/partner/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };
  const menuOptions = [{
    icon: <I icon={Edit2} size={20} />,
    label: 'Edit Profile',
    action: () => setIsEditing(true)
  }, ...(isSubEnabled ? [{
    icon: <I icon={Ticket} size={20} />,
    label: 'Subscription Plan',
    path: '/partner/subscription'
  }] : []), {
    icon: <I icon={History} size={20} />,
    label: 'Order History',
    path: '/partner/orders'
  }, {
    icon: <I icon={Bell} size={20} />,
    label: 'Notifications',
    path: '/partner/notifications'
  }, {
    icon: <I icon={MapPin} size={20} />,
    label: 'Pick Up Information',
    action: () => setActiveModal('pickup')
  }, {
    icon: <I icon={FileText} size={20} />,
    label: 'Terms & Conditions',
    action: () => setActiveModal('terms')
  }, {
    icon: <I icon={Shield} size={20} />,
    label: 'Privacy & Security',
    action: () => setActiveModal('privacy')
  }];
  if (isLoading) {
    return <Box className="min-h-screen flex items-center justify-center bg-gray-50">
            <Spin size={48} className="text-primary" />
        </Box>;
  }
  const renderModalContent = () => {
    switch (activeModal) {
      case 'pickup':
        return <Box className="space-y-4">
                        <Box className="flex justify-between items-center">
                            <Txt className="text-lg font-black text-gray-900">Pick Up Information</Txt>
                            {!isEditingPickup && <Btn onPress={() => setIsEditingPickup(true)} className="p-2 bg-indigo-50 text-primary rounded-xl hover:bg-indigo-100 transition-colors">
                                    <I icon={Edit2} size={16} />
                                </Btn>}
                        </Box>
                        <Txt className="text-sm text-gray-600">Default pickup location is your registered shop address. Delivery partners will arrive between 10 AM - 6 PM.</Txt>
                        
                        {isEditingPickup ? <Box className="space-y-4 mt-4 animate-in fade-in zoom-in-95 duration-200">
                                {isLoaded ? <Box className="space-y-3">
                                        <PlacesAutocompleteField label="Shop Address" name="address" placeholder="Start typing your shop address..." required value={formData.address} onChange={val => setFormData({
                ...formData,
                address: val
              })} onClear={() => setFormData({
                ...formData,
                address: '',
                latitude: null,
                longitude: null
              })} onPlaceSelect={placeData => {
                setFormData(prev => ({
                  ...prev,
                  address: placeData.address,
                  latitude: placeData.latitude,
                  longitude: placeData.longitude
                }));
              }} />
                                        <Box className="h-48 w-full rounded-2xl overflow-hidden border border-gray-200 relative">
                                            <LocationPickerMap latitude={formData.latitude} longitude={formData.longitude} onPick={handleMapClick} />
                                            <Box className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-600 shadow-sm pointer-events-none">Tap map to set location</Box>
                                        </Box>
                                    </Box> : <Box className="space-y-1">
                                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">Shop Address</Txt>
                                        <PInput className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 focus:border-primary rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-semibold text-gray-900" value={formData.address} onChangeText={e => setFormData({
                ...formData,
                address: e
              })} />
                                    </Box>}
                                
                                {formData.latitude && formData.longitude && <Box className="flex items-center gap-2 mt-2">
                                        <Txt className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                            <I icon={MapPin} size={10} className="text-emerald-500" />
                                            GPS: {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}
                                        </Txt>
                                    </Box>}
                                
                                <Box className="flex justify-end gap-3 pt-2">
                                    <Btn onPress={() => setIsEditingPickup(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                        Cancel
                                    </Btn>
                                    <Btn disabled={isSaving} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50">
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Btn>
                                </Box>
                            </Box> : <Box className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                                <Txt className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Address</Txt>
                                <Txt className="text-sm font-medium text-gray-800">{formData.address}</Txt>
                                {formData.latitude && formData.longitude && <Txt className="text-[10px] font-mono text-emerald-600 font-bold mt-2 flex items-center gap-1">
                                        <I icon={MapPin} size={10} />
                                        GPS Logged
                                    </Txt>}
                            </Box>}
                    </Box>;
      case 'terms':
        return <Box className="space-y-4">
                        <Txt className="text-lg font-black text-gray-900">Terms & Conditions</Txt>
                        <Scroll contentClassName="space-y-2 pr-2" className="text-xs text-gray-600 h-48 custom-scrollbar leading-relaxed" nestedScrollEnabled>
                            <Txt>1. By using {appName}, you agree to fulfill all accepted orders within the specified deadline.</Txt>
                            <Txt>2. {formData.shopName} is responsible for the fabric quality if provided by the shop.</Txt>
                            <Txt>3. Payments are processed every Friday for completed orders.</Txt>
                            <Txt>4. Platform commission is fixed at 12% per transaction.</Txt>
                        </Scroll>
                    </Box>;
      case 'privacy':
        return <Box className="space-y-4">
                        <Txt className="text-lg font-black text-gray-900">Privacy & Security</Txt>
                        <Box className="space-y-3">
                            <Button onPress={() => alert("Change Password dialog opened")} variant="secondary" className="text-xs py-3 border-gray-200">Change Password</Button>
                            <Button onPress={() => alert("Manage Devices dialog opened")} variant="secondary" className="text-xs py-3 border-gray-200">Manage Devices</Button>
                            <Box className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                                <I icon={Shield} size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <Txt className="text-[10px] text-red-700 leading-tight">Your data is fully encrypted. We never share your shop financials with third parties.</Txt>
                            </Box>
                        </Box>
                    </Box>;
      default:
        return null;
    }
  };
  return <Box className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white pb-20">
            
            {/* ── MOBILE HEADER ── */}
            <Box className={`md:hidden relative bg-[#843D9B] pt-4 ${isEditing ? 'pb-12' : 'pb-16'} px-5 text-white overflow-hidden shrink-0 shadow-xl transition-all duration-300`}>
                <Box className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
                    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><Path fill="#ffffff" d="M0,100 C40,80 60,0 100,0 L100,100 Z" /></Svg>
                </Box>
                <Box className="relative z-10 flex items-center justify-between">
                    <Btn onPress={() => isEditing ? setIsEditing(false) : navigate(-1)} className="p-1.5 -ml-2 text-white hover:text-indigo-100 transition-colors">
                        {isEditing ? <I icon={X} size={20} /> : <I icon={ArrowLeft} size={20} />}
                    </Btn>
                    <Txt className="text-base font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase">
                        {isEditing ? 'Edit Profile' : 'Profile Settings'}
                    </Txt>
                </Box>
                <Box className="absolute -bottom-1 left-0 w-full leading-none">
                    <Svg width="100%" height={32} viewBox="0 0 100 20" preserveAspectRatio="none"><Path fill="#F5F5F5" d="M0,20 C30,0 70,0 100,20 L100,20 L0,20 Z" /></Svg>
                </Box>
            </Box>

            <Box className="flex-1 p-2 md:p-0">
                
                {/* ── DESKTOP TITLE ── */}
                <Box className="hidden md:block py-6">
                    <Txt className="text-2xl font-black text-gray-900 tracking-tight">Account & Security</Txt>
                    <Txt className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Manage your shop profile and platform preferences</Txt>
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
                                <Box className="h-24 w-24 bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center text-[#FDE5D2] shadow-2xl shadow-[#843D9B]/20 relative group-hover:scale-105 transition-transform duration-500">
                                    {profile?.user?.profileImage && profile?.user?.profileImage !== 'default_profile.png' ? <Img src={profile.user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-[2rem]" /> : <Txt className="text-3xl font-black">{profile?.shopName?.charAt(0) || formData.name?.charAt(0) || 'R'}</Txt>}
                                    <Btn onPress={() => setIsEditing(true)} className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-[#843D9B] hover:bg-[#843D9B] hover:text-white transition-all">
                                        <I icon={Edit2} size={14} />
                                    </Btn>
                                </Box>
                                <Box className="text-center md:text-left">
                                    <Txt className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{profile?.shopName || 'Luxury Stitches'}</Txt>
                                    <Box className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                        <Txt className="bg-indigo-50 text-[#843D9B] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                            Verified Partner
                                        </Txt>
                                        <Txt className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            Premium Tier
                                        </Txt>
                                    </Box>
                                </Box>
                            </Box>

                            {isEditing ? <Box className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    <Box className="space-y-1 mb-6">
                                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">Profile Image</Txt>
                                        <Box className="w-24 h-24">
                                            <ImageUploader value={formData.profileImage === 'default_profile.png' ? null : formData.profileImage} onChange={file => setFormData({
                    ...formData,
                    profileImage: file
                  })} />
                                        </Box>
                                    </Box>
                                    <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Box className="space-y-1">
                                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Shop Name</Txt>
                                            <PInput className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#843D9B]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900" value={formData.shopName} onChangeText={e => setFormData({
                    ...formData,
                    shopName: e
                  })} />
                                        </Box>
                                        <Box className="space-y-1">
                                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Owner Name</Txt>
                                            <PInput className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#843D9B]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900" placeholder="Enter owner name (Letters only)" value={formData.name} onChangeText={e => {
                    const cleanVal = e.replace(/[^a-zA-Z\s]/g, '');
                    setFormData({
                      ...formData,
                      name: cleanVal
                    });
                  }} />
                                        </Box>
                                        <Box className="space-y-1">
                                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</Txt>
                                            <PInput className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#843D9B]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900" value={formData.email} onChangeText={e => setFormData({
                    ...formData,
                    email: e
                  })} keyboardType="email-address" />
                                        </Box>
                                        <Box className="space-y-1">
                                            <Box className="flex justify-between items-center ml-2">
                                                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Number</Txt>
                                                <Txt className="text-[9px] font-bold text-gray-400">{formData.phoneNumber?.length || 0}/10 digits</Txt>
                                            </Box>
                                            <PInput className={`w-full px-5 py-3.5 bg-gray-50 border ${formData.phoneNumber && formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#843D9B]/20'} rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900`} maxLength={10} placeholder="Enter 10-digit mobile number" value={formData.phoneNumber} onChangeText={e => {
                    const val = e.replace(/\D/g, '').slice(0, 10);
                    setFormData({
                      ...formData,
                      phoneNumber: val
                    });
                  }} keyboardType="phone-pad" />
                                            {formData.phoneNumber && formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 && <Txt className="text-[10px] text-rose-500 font-bold ml-2">Must be exactly 10 digits</Txt>}
                                        </Box>
                                    </Box>
                                    <Box className="space-y-1">
                                        <Box className="flex justify-between items-center ml-2">
                                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Address</Txt>
                                            <Btn onPress={handleAutoLocation} disabled={isLocating} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50">
                                                {isLocating ? <Spin size={12} className="text-primary" /> : <I icon={Navigation} size={12} className="fill-primary/10" />}
                                                {isLocating ? 'Locating...' : 'Detect Exact Location'}
                                            </Btn>
                                        </Box>
                                        {isLoaded ? <Box className="space-y-3">
                                                <PlacesAutocompleteField label="" name="address" placeholder="Search or detect exact location" value={formData.address} onChange={val => setFormData({
                    ...formData,
                    address: val
                  })} onClear={() => setFormData({
                    ...formData,
                    address: '',
                    latitude: null,
                    longitude: null
                  })} onPlaceSelect={placeData => {
                    setFormData(prev => ({
                      ...prev,
                      address: placeData.address,
                      latitude: placeData.latitude,
                      longitude: placeData.longitude
                    }));
                  }} />
                                                <Box className="h-48 w-full rounded-2xl overflow-hidden border border-gray-200 relative">
                                                    <LocationPickerMap latitude={formData.latitude} longitude={formData.longitude} onPick={handleMapClick} />
                                                    <Box className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-600 shadow-sm pointer-events-none">Tap map to set location</Box>
                                                </Box>
                                            </Box> : <PInput className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-[#843D9B]/20 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900" value={formData.address} onChangeText={e => setFormData({
                  ...formData,
                  address: e
                })} placeholder="Detect exact location or enter address" />}
                                    </Box>
                                    <Box className="flex gap-4 pt-4">
                                        <Btn onPress={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                                            Cancel
                                        </Btn>
                                        <Btn disabled={isSaving} className="flex-[2] py-4 bg-[#843D9B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#843D9B]/20 hover:bg-[#4E2460] transition-all">
                                            {isSaving ? 'Saving Changes...' : 'Update Profile'}
                                        </Btn>
                                    </Box>
                                </Box> : <Box className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Box className="flex items-center gap-3 mb-1">
                                            <I icon={Phone} size={12} className="text-gray-400" />
                                            <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</Txt>
                                        </Box>
                                        <Txt className="text-sm font-black text-gray-900">{formData.phoneNumber || 'Not provided'}</Txt>
                                    </Box>
                                    <Box className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Box className="flex items-center gap-3 mb-1">
                                            <I icon={Mail} size={12} className="text-gray-400" />
                                            <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Access</Txt>
                                        </Box>
                                        <Txt className="text-sm font-black text-gray-900">{formData.email || 'Not provided'}</Txt>
                                    </Box>
                                </Box>}
                        </Box>
                    </Box>

                    {/* RIGHT: NAVIGATION MENU */}
                    <Box className="w-full lg:w-[400px] space-y-6">
                        
                        {/* Account Actions */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-1">
                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-3 mb-3">Quick Navigation</Txt>
                            <MenuOption icon={Wallet} color="bg-[#843D9B]" label="Wallet & Payouts" subLabel="Check your balance" extra={<Txt className="bg-green-50 text-[10px] font-black px-2.5 py-1 rounded-full text-green-600 border border-green-100">₹ 0</Txt>} to="/partner/wallet" />
                            {isSubEnabled && <MenuOption icon={Ticket} color="bg-[#843D9B]" label="Subscription Plan" subLabel="Manage your plan" to="/partner/subscription" />}
                            <MenuOption icon={MapPin} color="bg-[#843D9B]" label="Pick Up Info" subLabel="Manage addresses" onPress={() => setActiveModal('pickup')} />
                            <MenuOption icon={Shield} color="bg-[#843D9B]" label="Privacy & Terms" subLabel="Legal guidelines" onPress={() => setActiveModal('privacy')} />
                        </Box>

                        {/* Test Push Section */}
                        <Box className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <Btn onPress={async () => {
              try {
                const { testPushToThisDevice } = await import('../lib/push');
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
                            <Btn onPress={() => setShowLogoutModal(true)} className="w-full p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-100 flex items-center justify-between group transition-all">
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
                                {activeModal === 'pickup' ? 'Pick Up Information' : activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy & Security'}
                            </Txt>
                            <Btn onPress={() => setActiveModal(null)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
                                <I icon={X} size={20} />
                            </Btn>
                        </Box>
                        <Scroll contentClassName="p-8 pt-6" className="flex-1 custom-scrollbar" nestedScrollEnabled>
                            {renderModalContent()}
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
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Box className="flex flex-col items-center text-center gap-3">
                            <Box className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                                <I icon={AlertTriangle} size={28} className="text-red-600" />
                            </Box>
                            <Txt className="text-lg font-black text-gray-900 tracking-tight">Delete Account?</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">This action is <Txt className="font-bold text-red-600">permanent</Txt> and cannot be undone. All your shop data, orders, and earnings history will be lost forever.</Txt>
                        </Box>
                        <Box>
                            <Txt className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Type DELETE to confirm</Txt>
                            <PInput value={deleteConfirmText} onChangeText={e => setDeleteConfirmText(e)} placeholder="DELETE" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-center tracking-widest focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" />
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

            {/* Logout Confirmation Modal */}
            {showLogoutModal && <Dialog visible={!!(showLogoutModal)} onClose={() => setShowLogoutModal(false)} className={`bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Box className="flex flex-col items-center text-center gap-3">
                            <Box className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
                                <I icon={LogOut} size={28} className="text-rose-600" />
                            </Box>
                            <Txt className="text-lg font-black text-gray-900 tracking-tight">Logout Account?</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">Are you sure you want to end your current session? You will need to login again to access your account.</Txt>
                        </Box>
                        <Box className="flex gap-3">
                            <Btn onPress={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all">
                                Cancel
                            </Btn>
                            <Btn onPress={handleLogout} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all">
                                Logout
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}
        </Box>;
};
export default ProfileSettings;
