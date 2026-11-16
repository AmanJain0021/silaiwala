// Port of modules/customer/pages/EditProfile.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../lib/storage';
import Screen from '../components/common/Screen';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Navigation, Map, Loader2, X, Search, Check } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import useAuthStore from "../store/authStore";
import ImageUploader from "../components/common/ImageUploader";
import { validateName, validateEmail, validatePhone } from "../utils/validation";
import useUserStore from "../store/userStore";
import useLocationStore from "../store/locationStore";
import LocationModal from "../components/customer/LocationModal";
import toast from '../lib/toast';
import api from "../lib/api";
import { placesAutocomplete, placeDetails } from '../lib/places';
import { getCurrentPosition } from '../lib/location';
import { reverseGeocode } from '../utils/reverseGeocode';
import { Box, Btn, I, Txt, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const EditProfile = () => {
  const navigate = useNavigate();
  const {
    user: authUser
  } = useAuthStore(state => state);
  const {
    updateProfile,
    profile
  } = useUserStore();
  const storeAddress = useLocationStore(state => state.address);
  const isGoogleLoaded = true;
  const storedUser = React.useMemo(() => {
    try {
      const stored = storage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);
  const activeUser = React.useMemo(() => {
    const merged = {
      ...(storedUser || {}),
      ...(authUser || {}),
      ...(profile || {})
    };
    const rawImg = merged.profileImage || merged.user?.profileImage || merged.profile?.profileImage || authUser?.profileImage || authUser?.user?.profileImage || storedUser?.profileImage || null;
    return {
      ...merged,
      profileImage: typeof rawImg === 'string' ? rawImg : null
    };
  }, [profile, authUser, storedUser]);
  const [formData, setFormData] = useState({
    name: activeUser.name || '',
    email: activeUser.email || '',
    phone: activeUser.phone || activeUser.phoneNumber || '',
    location: activeUser.location || '',
    profileImage: activeUser.profileImage || null
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Location Suggestions State
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Sync selected address from LocationModal / LocationStore
  useEffect(() => {
    if (storeAddress) {
      const formatted = typeof storeAddress === 'string' ? storeAddress : storeAddress.area || storeAddress.city || storeAddress.formatted_address || '';
      if (formatted) {
        setFormData(prev => ({
          ...prev,
          location: formatted
        }));
      }
    }
  }, [storeAddress]);


  // Search location suggestions (Google Places + OpenStreetMap fallback)
  const fetchLocationSuggestions = useCallback(async query => {
    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }
    setIsSearchingLocation(true);
    const tryNominatim = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => {
            const parts = (item.display_name || '').split(', ');
            const mainText = parts[0] || item.name || item.display_name;
            const secondaryText = parts.slice(1, 4).join(', ');
            return {
              description: item.display_name,
              mainText,
              secondaryText,
              lat: item.lat ? parseFloat(item.lat) : undefined,
              lng: item.lon ? parseFloat(item.lon) : undefined
            };
          });
          setLocationSuggestions(mapped);
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
        }
      } catch (err) {
        console.warn('Nominatim search failed:', err);
        setLocationSuggestions([]);
      } finally {
        setIsSearchingLocation(false);
      }
    };

    // Try Google Places Autocomplete first
    try {
      const predictions = await placesAutocomplete(query);
      if (predictions.length > 0) {
        setLocationSuggestions(predictions.map(p => ({ description: p.description, mainText: p.main, secondaryText: p.secondary, placeId: p.placeId })));
        setShowSuggestions(true);
        setIsSearchingLocation(false);
      } else {
        tryNominatim();
      }
    } catch (e) {
      tryNominatim();
    }
  }, []);
  const handleLocationInputChange = val => {
    setFormData(prev => ({
      ...prev,
      location: val
    }));
    setShowSuggestions(true);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (!val || val.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }
    setIsSearchingLocation(true);
    searchDebounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(val);
    }, 200);
  };
  const handleSelectSuggestion = suggestion => {
    const addressText = suggestion.description || suggestion.mainText;
    setFormData(prev => ({
      ...prev,
      location: addressText
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
    if (suggestion.placeId) {
      placeDetails(suggestion.placeId).then(place => {
        useLocationStore.getState().setLocation(place.formatted_address || addressText, place.lat, place.lng);
      }).catch(() => {});
    } else if (suggestion.lat && suggestion.lng) {
      try {
        useLocationStore.getState().setLocation(addressText, suggestion.lat, suggestion.lng);
      } catch (e) {}
    }
  };
  const handleDetectLocation = async () => {
    setIsLocating(true);
    const onPosition = async position => {
      const {
        latitude,
        longitude
      } = position.coords;
      try {
        let detectedAddress = '';

        // 1. Google Geocoding
        try {
          const geo = await reverseGeocode(latitude, longitude);
          if (geo?.source === 'google' && geo.formattedAddress) detectedAddress = geo.formattedAddress;
        } catch (e) { /* fall through */ }

        // 2. BigDataCloud reverse geocode fallback
        if (!detectedAddress) {
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data) {
              const parts = [data.locality || data.city, data.principalSubdivision, data.countryName].filter(Boolean);
              if (parts.length > 0) detectedAddress = parts.join(', ');
            }
          } catch (e) {
            console.warn('BigDataCloud reverse geocode failed:', e);
          }
        }

        // 3. Nominatim OpenStreetMap fallback
        if (!detectedAddress) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            if (data?.display_name) {
              detectedAddress = data.display_name;
            }
          } catch (e) {
            console.warn('Nominatim reverse geocode failed:', e);
          }
        }
        const finalLocation = detectedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setFormData(prev => ({
          ...prev,
          location: finalLocation
        }));
        toast.success('Current location fetched!');
      } catch (err) {
        toast.error('Failed to fetch location address');
      } finally {
        setIsLocating(false);
      }
    };
    try {
      const position = await getCurrentPosition({ timeout: 10000 });
      await onPosition(position);
    } catch (error) {
      setIsLocating(false);
      if (error.code === 'denied') {
        toast.error('Location access denied by browser');
      } else {
        toast.error('Could not retrieve current GPS position');
      }
    }
  };
  const handleSubmit = async e => {
    const newErrors = {};
    const nameErr = validateName(formData.name);
    if (nameErr) newErrors.name = nameErr;
    if (formData.email) {
      const emailErr = validateEmail(formData.email);
      if (emailErr) newErrors.email = emailErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      let uploadedImageUrl = typeof formData.profileImage === 'string' ? formData.profileImage : undefined;
      if (formData.profileImage && typeof formData.profileImage === 'object' && formData.profileImage.name) {
        const uploadData = new FormData();
        uploadData.append('file', formData.profileImage);
        const uploadRes = await api.post('/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (uploadRes.data?.success) {
          uploadedImageUrl = uploadRes.data.data;
        }
      }
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        location: formData.location,
        profileImage: uploadedImageUrl
      });
      const updateUser = useAuthStore.getState().updateUser;
      if (updateUser) {
        updateUser({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          location: formData.location,
          ...(uploadedImageUrl && {
            profileImage: uploadedImageUrl
          })
        });
      }
      toast.success('Profile updated successfully!');
      navigate('/user/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  return <Screen className="bg-white"><Box className="flex-1 bg-white font-sans text-gray-900">
            {/* 1. Header */}
            <Box className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between pt-safe">
                <Box className="flex items-center gap-3">
                    <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                        <I icon={ArrowLeft} size={20} />
                    </Btn>
                    <Txt className="text-lg font-bold">Edit Profile</Txt>
                </Box>
                <Btn onPress={handleSubmit} className="p-2 text-[#843D9B] hover:bg-indigo-50 rounded-full transition-colors font-black" disabled={isLoading}>
                    <I icon={Save} size={20} />
                </Btn>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="p-6 space-y-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 2. Profile Photo */}
                <Box className="flex flex-col items-center">
                    <ImageUploader compact value={formData.profileImage} onChange={file => setFormData({
          ...formData,
          profileImage: file
        })} />
                </Box>

                {/* 3. Form Fields */}
                <Box className="space-y-6">
                    <Box className="space-y-1.5">
                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</Txt>
                        <Box className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <I icon={User} size={18} className="text-gray-400" />
                            <Input value={formData.name} onChangeText={e => setFormData({
              ...formData,
              name: e
            })} className="bg-transparent text-sm font-bold w-full focus:outline-none" placeholder="Enter your name" />
                        </Box>
                        {errors.name && <Txt className="text-[10px] text-red-500 font-bold ml-2">{errors.name}</Txt>}
                    </Box>

                    <Box className="space-y-1.5">
                        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</Txt>
                        <Box className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.email ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <I icon={Mail} size={18} className="text-gray-400" />
                            <Input value={formData.email} onChangeText={e => setFormData({
              ...formData,
              email: e
            })} className="bg-transparent text-sm font-bold w-full focus:outline-none" placeholder="Enter email" keyboardType="email-address" />
                        </Box>
                        {errors.email && <Txt className="text-[10px] text-red-500 font-bold ml-2">{errors.email}</Txt>}
                    </Box>

                    <Box className="space-y-1.5">
                        <Box className="flex justify-between items-center ml-1">
                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</Txt>
                            <Txt className="text-[9px] font-bold text-gray-400">{formData.phone?.length || 0}/10 digits</Txt>
                        </Box>
                        <Box className={`flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border ${errors.phone || formData.phone && formData.phone.length > 0 && formData.phone.length < 10 ? 'border-red-300' : 'border-gray-100'} focus-within:border-[#843D9B] focus-within:bg-white transition-all`}>
                            <I icon={Phone} size={18} className="text-gray-400" />
                            <Input maxLength={10} value={formData.phone} onChangeText={e => {
              const val = e.replace(/\D/g, '').slice(0, 10);
              setFormData({
                ...formData,
                phone: val
              });
            }} className="bg-transparent text-sm font-bold w-full focus:outline-none" placeholder="Enter 10-digit phone number" keyboardType="phone-pad" />
                        </Box>
                        {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && <Txt className="text-[10px] text-red-500 font-bold ml-2">Must be exactly 10 digits</Txt>}
                        {errors.phone && <Txt className="text-[10px] text-red-500 font-bold ml-2">{errors.phone}</Txt>}
                    </Box>

                    <Box className="space-y-1.5">
                        <Box className="flex justify-between items-center ml-1">
                            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City / Location</Txt>
                            <Btn onPress={() => setShowLocationModal(true)} className="text-[10px] font-extrabold text-[#843D9B] hover:underline flex items-center gap-1 uppercase tracking-wider">
                                <I icon={Map} size={11} /> Select on Map
                            </Btn>
                        </Box>
                        <Box className="relative">
                            <Box className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 focus-within:border-[#843D9B] focus-within:bg-white transition-all">
                                <I icon={MapPin} size={18} className="text-gray-400 shrink-0" />
                                <Input value={formData.location} onChangeText={e => handleLocationInputChange(e)} className="bg-transparent text-sm font-bold w-full focus:outline-none pr-28" placeholder="Type city, area, or address..." />
                                
                                {formData.location && <Btn onPress={() => {
                setFormData(prev => ({
                  ...prev,
                  location: ''
                }));
                setLocationSuggestions([]);
                setShowSuggestions(false);
              }} className="absolute right-24 text-gray-400 hover:text-gray-600 p-1">
                                        <I icon={X} size={14} />
                                    </Btn>}

                                <Btn onPress={handleDetectLocation} disabled={isLocating} className="absolute right-2 px-3 py-1.5 bg-[#843D9B] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#6B2F7E] transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                                    {isLocating ? <>
                                            <Spin size={12} className="animate-spin" />
                                            GPS...
                                        </> : <>
                                            <I icon={Navigation} size={12} />
                                            Current
                                        </>}
                                </Btn>
                            </Box>

                            {/* Floating Location Suggestions Dropdown */}
                            {showSuggestions && (isSearchingLocation || locationSuggestions.length > 0) && <Scroll className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-purple-100 shadow-2xl overflow-hidden max-h-64" style={{ elevation: 20 }} keyboardShouldPersistTaps="always" nestedScrollEnabled>
                                    {isSearchingLocation && <Box className="p-3.5 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                                            <Spin size={14} className="animate-spin text-[#843D9B]" />
                                            <Txt>Finding location suggestions...</Txt>
                                        </Box>}

                                    {locationSuggestions.map((suggestion, idx) => <Btn key={`loc-${idx}`} onPress={() => handleSelectSuggestion(suggestion)} className="block p-3 hover:bg-purple-50/50 cursor-pointer transition-colors flex items-start gap-2.5 text-left group">
                                            <Box className="w-6 h-6 rounded-lg bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                                <I icon={MapPin} size={13} />
                                            </Box>
                                            <Box className="flex-1 min-w-0">
                                                <Txt className="text-xs font-black text-gray-900 group-hover:text-[#843D9B] transition-colors truncate">
                                                    {suggestion.mainText}
                                                </Txt>
                                                {suggestion.secondaryText && <Txt className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                                        {suggestion.secondaryText}
                                                    </Txt>}
                                            </Box>
                                        </Btn>)}
                                </Scroll>}
                        </Box>
                    </Box>
                </Box>

                <Box className="pt-6">
                    <Btn onPress={handleSubmit} className="w-full bg-[#843D9B] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-[#6B2F7E] active:scale-95" disabled={isLoading}>
                        {isLoading ? <Spin size={20} className="text-white" /> : "Save Changes"}
                    </Btn>
                </Box>
            </Box>

                        </Scroll>
{showLocationModal && <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />}
        </Box></Screen>;
};
export default EditProfile;
