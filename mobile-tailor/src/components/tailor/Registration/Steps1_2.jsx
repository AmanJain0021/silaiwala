// Port of modules/tailor/components/Registration/Steps1_2.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import { rnField } from '../../../lib/rnForm';
import { pickImage } from '../../../lib/files';
import { isPickedFile } from '../../../lib/files';
import React, { useState, useRef, useEffect } from "react";
import { Input } from "../UIElements";
import api from "../../../lib/api";
import toast from '../../../lib/toast';
import { Navigation, Lock, Eye, EyeOff, Camera, CheckCircle2 } from "lucide-react-native";
import useUnifiedLocation from "../../../shared/hooks/useUnifiedLocation";
import { validatePassword } from "../../../utils/validation";
import PlacesAutocompleteField from "../../shared/PlacesAutocompleteField";
import { GOOGLE_MAPS_LIBRARIES } from "../../../lib/config";
import { Box, Btn, Img, I, Txt, Scroll, Input as PInput } from '../../ui/primitives';
export const Step1Basic = ({
  register,
  errors,
  setValue,
  watch,
  setError,
  clearErrors
}) => {
  const field = rnField(register, watch, setValue);
  const profileImage = watch('profileImage');
  const phone = watch('phone');
  const isPhoneVerified = watch('isPhoneVerified') || false;
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const profileInputRef = useRef(null);
  const handleSendOTP = async () => {
    if (phone && /^[6-9]\d{9}$/.test(phone)) {
      setIsSending(true);
      try {
        // 1. Verify phone doesn't already exist
        const checkRes = await api.post('/auth/check-user', {
          phoneNumber: phone
        });
        if (checkRes.data.exists) {
          toast.error(checkRes.data.message || 'This phone number is already registered');
          if (setError) setError('phone', {
            type: 'manual',
            message: 'Phone number is already registered'
          });
          setIsSending(false);
          return;
        }

        // 2. Send OTP
        const response = await api.post('/auth/send-otp', {
          phoneNumber: phone
        });
        if (response.data.success) {
          setOtpSent(true);
          toast.success('OTP sent successfully!');
        } else {
          toast.error(response.data.message || 'Failed to send OTP');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error sending OTP');
      } finally {
        setIsSending(false);
      }
    } else {
      toast.error('Enter a valid 10-digit mobile number starting with 6-9');
      if (setError) setError('phone', {
        type: 'manual',
        message: 'Invalid 10-digit mobile number starting with 6-9'
      });
    }
  };
  const handleVerifyOTP = async () => {
    const otpVal = watch('otp');
    if (!otpVal || otpVal.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phone,
        otp: otpVal
      });
      if (res.data.success) {
        setValue('isPhoneVerified', true, {
          shouldValidate: true
        });
        if (clearErrors) clearErrors(['phone', 'otp']);
        toast.success('Mobile number verified!');
      } else {
        toast.error(res.data.message || 'Invalid OTP');
        if (setError) setError('otp', {
          type: 'manual',
          message: res.data.message || 'Invalid OTP'
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP verification');
      if (setError) setError('otp', {
        type: 'manual',
        message: error.response?.data?.message || 'Invalid OTP'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  return <Box className="space-y-4 animate-in slide-in-from-right duration-300">
            {/* Circular & Compact Profile Picture Container */}
            <Box className="flex flex-col items-center justify-center mb-4">
                <Btn className={`block ${`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed ${errors.profileImage ? 'border-red-400 bg-red-50/50' : 'border-[#843D9B] bg-purple-50/50 hover:border-[#E04D79]'} flex items-center justify-center cursor-pointer overflow-hidden group transition-all shadow-sm`}`} onPress={async () => {
          const file = await pickImage();
          if (file) {
            setValue('profileImage', file, { shouldValidate: true });
            if (clearErrors) clearErrors('profileImage');
          }
        }}>
                    {profileImage ? <Img src={isPickedFile(profileImage) ? profileImage.uri : profileImage} alt="Profile" className="w-full h-full object-cover" /> : <Box className="flex flex-col items-center text-center p-2">
                            <I icon={Camera} className="w-6 h-6 text-[#843D9B] group-hover:text-[#E04D79] mb-0.5" />
                            <Txt className="text-[9px] font-bold text-gray-500 uppercase">Upload</Txt>
                        </Box>}
                </Btn>
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Profile Picture (Optional)</Txt>
                {errors.profileImage && <Txt className="text-[10px] text-red-500 font-bold mt-1">{errors.profileImage.message}</Txt>}
            </Box>

            <Input label="Full Name" placeholder="Enter your full name" {...field('fullName', {
      required: 'Name is required',
      validate: v => v && v.trim().length >= 2 || 'Name cannot be empty or spaces only',
      pattern: {
        value: /^[A-Za-z\s]+$/,
        message: 'Name can only contain alphabets'
      },
      onChange: e => {
        const sanitized = e.target.value.replace(/[^A-Za-z\s]/g, '');
        setValue('fullName', sanitized, {
          shouldValidate: true
        });
        if (clearErrors && sanitized.trim()) clearErrors('fullName');
      }
    })} error={errors.fullName?.message} />

            <Box className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-end w-full">
                <Box className="flex-1 space-y-1.5 group">
                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#843D9B]">Phone Number</Txt>
                    <Box className={`flex items-center px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus-within:bg-white transition-all duration-300 ${errors.phone ? 'border-red-300 bg-red-50/40' : 'border-transparent focus-within:border-[#843D9B]'}`}>
                        <Txt className="text-gray-800 font-medium text-sm mr-2 select-none pointer-events-none">+91</Txt>
                        <Input placeholder="00000 00000" maxLength={10} {...field('phone', {
            required: 'Phone is required',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Invalid 10-digit mobile number starting with 6-9'
            },
            onChange: e => {
              const sanitized = e.target.value.replace(/\D/g, '');
              setValue('phone', sanitized, {
                shouldValidate: true
              });
              setValue('isPhoneVerified', false);
              if (clearErrors && sanitized.length === 10) clearErrors('phone');
            }
          })} disabled={isPhoneVerified} className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm text-gray-900 placeholder:text-gray-300 outline-none w-full disabled:opacity-60" keyboardType="phone-pad" />
                        {isPhoneVerified && <I icon={CheckCircle2} className="w-5 h-5 text-emerald-500 shrink-0 ml-1" />}
                    </Box>
                    {errors.phone && <Txt className="text-[10px] text-red-500 font-bold pl-2">{errors.phone.message}</Txt>}
                </Box>
                {!isPhoneVerified && <Btn onPress={handleSendOTP} disabled={!phone || !/^[6-9]\d{9}$/.test(phone) || isSending} className="w-full sm:w-auto px-5 py-3 h-[48px] sm:h-[52px] bg-[#843D9B] hover:bg-[#E04D79] text-white rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[#843D9B]/20 sm:mb-1">
                        {isSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </Btn>}
            </Box>

            {otpSent && !isPhoneVerified && <Box className="animate-in slide-in-from-top-2 duration-300 space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                    <Txt className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest">Enter 6-Digit OTP</Txt>
                    <Box className="flex gap-2">
                        <Input placeholder="••••••" maxLength={6} {...field('otp', {
          required: 'OTP is required',
          pattern: {
            value: /^\d{6}$/,
            message: 'OTP must be 6 digits'
          },
          onChange: e => {
            const val = e.target.value.replace(/\D/g, '');
            setValue('otp', val, {
              shouldValidate: true
            });
            if (clearErrors && val.length === 6) clearErrors('otp');
          }
        })} className="flex-1 px-4 py-3 bg-white border border-purple-200 rounded-xl font-bold text-center tracking-[0.3em] text-lg focus:outline-none focus:border-[#843D9B]" />
                        <Btn onPress={handleVerifyOTP} disabled={isVerifying || !watch('otp') || watch('otp').length !== 6} className="px-6 py-3 bg-[#843D9B] hover:bg-[#E04D79] text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all">
                            {isVerifying ? 'Verifying...' : 'Verify OTP'}
                        </Btn>
                    </Box>
                    {errors.otp && <Txt className="text-[10px] text-red-500 font-bold pl-1">{errors.otp.message}</Txt>}
                </Box>}

            <Input label="Email Address" type="email" placeholder="tailor@example.com" {...field('email', {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      },
      onChange: e => {
        setValue('email', e.target.value, {
          shouldValidate: true
        });
        if (clearErrors && e.target.value.includes('@')) clearErrors('email');
      }
    })} error={errors.email?.message} />

            <Box className="flex flex-col space-y-1.5 w-full group">
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#843D9B]">Password</Txt>
                <Box className={`flex items-center px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus-within:bg-white transition-all duration-300 ${errors.password ? 'border-red-300 bg-red-50/40' : 'border-transparent focus-within:border-[#843D9B]'}`}>
                    <I icon={Lock} className={`w-4 h-4 mr-3 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#843D9B]'}`} />
                    <Input placeholder="Password (min. 6 characters)" {...field('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters long'
          },
          validate: v => {
            if (!v || !v.trim()) return 'Password is required';
            if (v.length < 6) return 'Password must be at least 6 characters long';
            return true;
          },
          onChange: e => {
            setValue('password', e.target.value, {
              shouldValidate: true
            });
            if (clearErrors && e.target.value.length >= 6) clearErrors('password');
          }
        })} className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm text-gray-900 placeholder:text-gray-300 outline-none w-full" />
                    <Btn onPress={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#843D9B] shrink-0">
                        {showPassword ? <I icon={EyeOff} className="w-4 h-4" /> : <I icon={Eye} className="w-4 h-4" />}
                    </Btn>
                </Box>
                {errors.password && <Txt className="text-[10px] text-red-500 font-bold pl-2">{errors.password?.message || (typeof errors.password === 'string' ? errors.password : '')}</Txt>}
            </Box>
        </Box>;
};
export const Step2Business = ({
  register,
  errors,
  setValue,
  clearErrors,
  watch
}) => {
  const field = rnField(register, watch, setValue);
  const {
    detectLocation,
    isLocating
  } = useUnifiedLocation({
    fetchAddress: true
  });
  const isLoaded = true;
  const loadError = null;
  const currentAddress = watch ? watch('address') : '';
  const currentLat = watch ? watch('latitude') : null;
  const currentLng = watch ? watch('longitude') : null;
  useEffect(() => {
    register('address', {
      required: 'Shop address is required',
      validate: v => v && v.trim().length >= 5 || 'Shop address must be at least 5 characters'
    });
  }, [register]);
  const handleAutoLocation = async () => {
    try {
      const data = await detectLocation();
      if (data) {
        setValue('address', data.address, {
          shouldValidate: true
        });
        setValue('city', data.city || '', {
          shouldValidate: true
        });
        setValue('pincode', data.pincode || '', {
          shouldValidate: true
        });
        setValue('latitude', data.latitude);
        setValue('longitude', data.longitude);
        if (clearErrors) clearErrors(['address', 'city', 'pincode']);
        toast.success('Current shop location detected!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Could not fetch address details automatically.");
    }
  };
  const handlePlaceSelect = placeData => {
    setValue('address', placeData.address, {
      shouldValidate: true
    });
    if (placeData.city) setValue('city', placeData.city, {
      shouldValidate: true
    });
    if (placeData.pincode) setValue('pincode', placeData.pincode, {
      shouldValidate: true
    });
    setValue('latitude', placeData.latitude);
    setValue('longitude', placeData.longitude);
    if (clearErrors) clearErrors(['address', 'city', 'pincode']);
  };
  return <Box className="space-y-4 animate-in slide-in-from-right duration-300">
            <Box className="flex justify-between items-center mb-2">
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Details</Txt>
                <Btn onPress={handleAutoLocation} disabled={isLocating} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer">
                    {isLocating ? <Spin size={12} className="text-primary" /> : <I icon={Navigation} size={12} className="fill-primary/10" />}
                    {isLocating ? 'Locating...' : 'Detect Location'}
                </Btn>
            </Box>
            <Input label="Shop Name" placeholder="e.g. Royal Stitches" {...field('shopName', {
      required: 'Shop name is required',
      validate: v => v && v.trim().length >= 2 || 'Shop name cannot be empty or spaces only',
      onChange: e => {
        setValue('shopName', e.target.value, {
          shouldValidate: true
        });
        if (clearErrors && e.target.value.trim()) clearErrors('shopName');
      }
    })} error={errors.shopName?.message} />

            {/* Shop Address with Google Places Autocomplete */}
            {isLoaded ? <Box>
                    <PlacesAutocompleteField label="Shop Address" placeholder="Start typing shop address, market, street..." required value={currentAddress || ''} error={errors.address?.message} onChange={val => {
        setValue('address', val, {
          shouldValidate: true
        });
        if (clearErrors && val.trim().length >= 5) clearErrors('address');
      }} onClear={() => setValue('address', '', {
        shouldValidate: true
      })} onPlaceSelect={handlePlaceSelect} />
                    {currentLat && currentLng && <Txt className="text-[10px] text-emerald-600 font-semibold -mt-1 mb-2 flex items-center gap-1">
                            ✓ Pinned on Map: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
                        </Txt>}
                </Box> : <Input label="Shop Address" placeholder="Street, Landmark, Area" {...field('address', {
      required: 'Address is required',
      validate: v => v && v.trim().length >= 5 || 'Shop address cannot be empty or spaces only',
      onChange: e => {
        setValue('address', e.target.value, {
          shouldValidate: true
        });
        if (clearErrors && e.target.value.trim().length >= 5) clearErrors('address');
      }
    })} error={errors.address?.message} />}
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="City" placeholder="e.g. Mumbai" {...field('city', {
        required: 'City is required',
        validate: v => v && v.trim().length >= 2 || 'City cannot be empty or spaces only',
        pattern: {
          value: /^[A-Za-z\s]+$/,
          message: 'City can only contain alphabets'
        },
        onChange: e => {
          const sanitized = e.target.value.replace(/[^A-Za-z\s]/g, '');
          setValue('city', sanitized, {
            shouldValidate: true
          });
          if (clearErrors && sanitized.trim()) clearErrors('city');
        }
      })} error={errors.city?.message} />
                <Input label="Pincode" placeholder="400001" maxLength={6} {...field('pincode', {
        required: 'Pincode is required',
        pattern: {
          value: /^\d{6}$/,
          message: 'Enter a valid 6-digit pincode'
        },
        onChange: e => {
          const sanitized = e.target.value.replace(/\D/g, '');
          setValue('pincode', sanitized, {
            shouldValidate: true
          });
          if (clearErrors && sanitized.length === 6) clearErrors('pincode');
        }
      })} error={errors.pincode?.message} />
            </Box>
            <Input label="Experience (Years)" type="number" placeholder="e.g. 5" {...field('experienceInYears', {
      required: 'Experience is required',
      min: {
        value: 0,
        message: 'Invalid experience'
      },
      onChange: e => {
        setValue('experienceInYears', e.target.value, {
          shouldValidate: true
        });
        if (clearErrors && e.target.value !== '') clearErrors('experienceInYears');
      }
    })} error={errors.experienceInYears?.message} />
            <Input label="Specializations (Comma separated)" placeholder="e.g. Suits, Bridal, Alterations" {...field('specializations', {
      required: 'Specializations are required',
      validate: v => v && v.trim().length >= 2 || 'Specializations cannot be empty or spaces only',
      onChange: e => {
        setValue('specializations', e.target.value, {
          shouldValidate: true
        });
        if (clearErrors && e.target.value.trim()) clearErrors('specializations');
      }
    })} error={errors.specializations?.message} />
        </Box>;
};
