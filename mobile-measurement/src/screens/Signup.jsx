// Port of modules/measurement-executive/pages/Signup.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../lib/storage';
import React, { useState, useEffect } from "react";
import {  useNavigate } from '../lib/nav';
import useMeasurementStore from "../store/measurementExecutiveStore";
import toast from '../lib/toast';
import { Mail, Lock, User, Phone, MapPin, CreditCard, Eye, EyeOff, Ruler, Navigation } from "lucide-react-native";
import PlacesAutocompleteField from "../components/shared/PlacesAutocompleteField";
import Checkbox from "../components/ui/Checkbox";
import useUnifiedLocation from "../shared/hooks/useUnifiedLocation";
import { Box, I, Txt, Input, Btn, Scroll } from '../components/ui/primitives';
const Signup = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const {
    detectLocation,
    isLocating
  } = useUnifiedLocation({
    fetchAddress: true
  });
  const isLoaded = true;
  const loadError = null;
  const [formData, setFormData] = useState(() => {
    const defaults = {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      address: '',
      aadharNumber: '',
      serviceRadius: 10,
      coordinates: [77.2090, 28.6139]
    };
    const savedData = storage.getItem('execSignupData');
    if (savedData) {
      try {
        return {
          ...defaults,
          ...JSON.parse(savedData)
        };
      } catch (e) {
        console.error("Error parsing saved exec data", e);
      }
    }
    return defaults;
  });
  // The draft survives leaving the page, as on the web, but the password and Aadhaar are never written to device storage.
  useEffect(() => {
    const {
      password,
      aadharNumber,
      ...draft
    } = formData;
    storage.setItem('execSignupData', JSON.stringify(draft));
  }, [formData]);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    loading
  } = useMeasurementStore();
  const navigate = useNavigate();
  const handleAutoLocation = async () => {
    try {
      const data = await detectLocation();
      if (data) {
        setFormData(prev => ({
          ...prev,
          address: data.address,
          coordinates: [data.longitude, data.latitude]
        }));
        toast.success('Current location detected!');
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch location automatically. Please type your address.");
    }
  };
  const handlePlaceSelect = placeData => {
    setFormData(prev => ({
      ...prev,
      address: placeData.address,
      coordinates: [placeData.longitude, placeData.latitude]
    }));
  };
  const handleChange = e => {
    let {
      name,
      value
    } = e.target;
    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    if (name === 'phoneNumber') {
      value = value.replace(/\D/g, '');
    }
    if (name === 'aadharNumber') {
      const numericValue = value.replace(/\D/g, '');
      value = numericValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleSubmit = async e => {
    const name = (formData.name || '').trim();
    if (name.length < 2) {
      return toast.error("Please enter a valid full name (minimum 2 letters)");
    }
    const phone = (formData.phoneNumber || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return toast.error("Please enter a valid 10-digit mobile number starting with 6-9");
    }
    const email = (formData.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Please enter a valid email address");
    }
    if (!formData.password || formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    const address = (formData.address || '').trim();
    if (address.length < 5) {
      return toast.error("Please provide your full address / colony (minimum 5 characters)");
    }
    const cleanAadhar = (formData.aadharNumber || '').replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      return toast.error("Please enter a valid 12-digit Aadhaar number");
    }
    try {
      const rawCoords = formData.coordinates;
      const validCoords = Array.isArray(rawCoords) && Number.isFinite(Number(rawCoords[0])) && Number.isFinite(Number(rawCoords[1])) ? [Number(rawCoords[0]), Number(rawCoords[1])] : [77.2090, 28.6139];
      const registerData = {
        ...formData,
        name,
        email,
        phoneNumber: phone,
        phone: phone,
        address,
        aadharNumber: cleanAadhar,
        coordinates: validCoords
      };
      await register(registerData);
      storage.removeItem('execSignupData');
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/executive/login');
    } catch (error) {
      const errData = error.response?.data;
      const errorMsg = errData?.errors?.[0] || errData?.message || error.message || 'Registration failed';
      toast.error(errorMsg);
    }
  };
  return <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-1 sm:px-2">
            {/* Top Squircle Card with Icon */}
            <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <I icon={Ruler} className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </Box>

            {/* Title & Subtitle */}
            <Box className="text-center mb-5 w-full">
                <Txt className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Create Executive Account
                </Txt>
                <Txt className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    Register as a certified measurement executive
                </Txt>
            </Box>

            <Box className="w-full space-y-3.5">
                {/* 2-Column Responsive Grid */}
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                    {/* Full Name */}
                    <Box className="w-full text-left">
                        <Txt className="text-xs font-semibold text-[#0F172A] block mb-1">Full Name *</Txt>
                        <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <I icon={User} size={16} className="text-[#94A3B8] shrink-0" />
                            <Input placeholder="Enter full name" value={formData.name} onChangeText={value => handleChange({ target: { name: 'name', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                        </Box>
                    </Box>

                    {/* Phone Number */}
                    <Box className="w-full text-left">
                        <Txt className="text-xs font-semibold text-[#0F172A] block mb-1">Mobile Number *</Txt>
                        <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Box className="bg-white shadow-2xs rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0F172A] mr-2 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                                +91
                            </Box>
                            <Input placeholder="10-digit number" maxLength={10} value={formData.phoneNumber} onChangeText={value => handleChange({ target: { name: 'phoneNumber', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" keyboardType="phone-pad" />
                        </Box>
                    </Box>

                    {/* Email Address */}
                    <Box className="w-full text-left">
                        <Txt className="text-xs font-semibold text-[#0F172A] block mb-1">Email Address *</Txt>
                        <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <I icon={Mail} size={16} className="text-[#94A3B8] shrink-0" />
                            <Input placeholder="you@example.com" value={formData.email} autoCapitalize="none" autoCorrect={false} onChangeText={value => handleChange({ target: { name: 'email', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" keyboardType="email-address" />
                        </Box>
                    </Box>

                    {/* Password */}
                    <Box className="w-full text-left">
                        <Txt className="text-xs font-semibold text-[#0F172A] block mb-1">Password *</Txt>
                        <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <I icon={Lock} size={16} className="text-[#94A3B8] shrink-0" />
                            <Input placeholder="Create password" value={formData.password} secureTextEntry={!showPassword} autoCapitalize="none" onChangeText={value => handleChange({ target: { name: 'password', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                            <Btn onPress={() => setShowPassword(!showPassword)} className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer">
                                {showPassword ? <I icon={EyeOff} size={16} /> : <I icon={Eye} size={16} />}
                            </Btn>
                        </Box>
                    </Box>

                    {/* Address with Google Places Autocomplete & GPS */}
                    <Box className="w-full text-left sm:col-span-2">
                        <Box className="flex justify-between items-center mb-1">
                            <Txt className="text-xs font-semibold text-[#0F172A]">Full Address (Area / Colony) *</Txt>
                            <Btn onPress={handleAutoLocation} disabled={isLocating} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFFF] border border-[#E9DFFE] text-[#843D9B] text-[10px] font-bold rounded-lg hover:bg-[#ebdcfb] transition-all disabled:opacity-50 cursor-pointer">
                                <I icon={Navigation} size={11} className={isLocating ? "animate-spin" : ""} />
                                {isLocating ? "Detecting..." : "Detect Location"}
                            </Btn>
                        </Box>
                        {isLoaded ? <PlacesAutocompleteField name="address" placeholder="Start typing address, area, or landmark..." required value={formData.address} onChange={val => setFormData(prev => ({
            ...prev,
            address: val
          }))} onClear={() => setFormData(prev => ({
            ...prev,
            address: ''
          }))} onPlaceSelect={handlePlaceSelect} /> : <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <I icon={MapPin} size={16} className="text-[#94A3B8] shrink-0" />
                                <Input placeholder="Complete residential address" value={formData.address} onChangeText={value => handleChange({ target: { name: 'address', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                            </Box>}
                        {formData.coordinates && formData.coordinates[0] !== 77.2090 && <Box className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                ✓ Location pinned: {formData.coordinates[1]?.toFixed(4)}, {formData.coordinates[0]?.toFixed(4)}
                            </Box>}
                    </Box>

                    {/* Aadhaar Number */}
                    <Box className="w-full text-left">
                        <Txt className="text-xs font-semibold text-[#0F172A] block mb-1">Aadhaar Number *</Txt>
                        <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <I icon={CreditCard} size={16} className="text-[#94A3B8] shrink-0" />
                            <Input placeholder="12-digit Aadhaar number" maxLength={14} value={formData.aadharNumber} keyboardType="number-pad" onChangeText={value => handleChange({ target: { name: 'aadharNumber', value } })} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                        </Box>
                    </Box>
                </Box>

                {/* Terms Checkbox */}
                <Box className="flex items-center gap-2 pt-2 text-left select-none">
                    <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} />
                    <Txt className="text-xs text-[#64748B] font-medium cursor-pointer">
                        I agree to the{' '}
                        <Txt onPress={() => navigate('/executive/legal/terms-and-conditions')} className="text-[#843D9B] font-semibold hover:underline">
                            Terms & Conditions
                        </Txt>
                        {' '} & {' '}
                        <Txt onPress={() => navigate('/executive/legal/privacy-policy')} className="text-[#843D9B] font-semibold hover:underline">
                            Privacy Policy
                        </Txt>
                    </Txt>
                </Box>

                {/* Submit Button */}
                <Btn onPress={handleSubmit} disabled={loading || !agreedToTerms} className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${loading || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                    {loading ? 'Registering...' : 'Create Account'}
                </Btn>
            </Box>

            {/* Footer Navigation */}
            <Box className="mt-6 text-center w-full">
                <Txt className="text-xs font-medium text-[#64748B]">
                    Already have an account?{' '}
                    <Txt onPress={() => navigate("/executive/login")} className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer">
                        Sign In
                    </Txt>
                </Txt>
            </Box>
        </Box>;
};
export default Signup;
