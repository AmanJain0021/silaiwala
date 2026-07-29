import React, { useState, useRef } from 'react';
import { Input } from '../UIElements';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Navigation, Lock, Eye, EyeOff, Camera, CheckCircle2 } from 'lucide-react';
import useUnifiedLocation from '../../../../shared/hooks/useUnifiedLocation';
import { validatePassword } from '../../../../utils/validation';

export const Step1Basic = ({ register, errors, setValue, watch, setError }) => {
    const profileImage = watch('profileImage');
    const phone = watch('phone');
    const [otpSent, setOtpSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const profileInputRef = useRef(null);

    const handleSendOTP = async () => {
        if (phone && /^[6-9]\d{9}$/.test(phone)) {
            setIsSending(true);
            try {
                // 1. Verify phone doesn't already exist
                const checkRes = await api.post('/auth/check-user', { phoneNumber: phone });
                if (checkRes.data.exists) {
                    toast.error(checkRes.data.message || 'This phone number is already registered');
                    setIsSending(false);
                    return;
                }

                // 2. Send OTP
                const response = await api.post('/auth/send-otp', { phoneNumber: phone });
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
            const res = await api.post('/auth/verify-otp', { phone, otp: otpVal });
            if (res.data.success) {
                setIsPhoneVerified(true);
                toast.success('Mobile number verified!');
            } else {
                toast.error(res.data.message || 'Invalid OTP');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP verification');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
            {/* Circular & Compact Profile Picture Container */}
            <div className="flex flex-col items-center justify-center mb-4">
                <div 
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-[#843D9B] bg-purple-50/50 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#E04D79] transition-all shadow-sm"
                    onClick={() => profileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={profileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setValue('profileImage', file, { shouldValidate: true });
                        }}
                        className="hidden" 
                    />
                    {profileImage ? (
                        <img 
                            src={profileImage instanceof File ? URL.createObjectURL(profileImage) : profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="flex flex-col items-center text-center p-2">
                            <Camera className="w-6 h-6 text-[#843D9B] group-hover:text-[#E04D79] mb-0.5" />
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Upload</span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Profile Picture *</p>
                {errors.profileImage && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.profileImage.message}</p>}
            </div>

            <Input
                label="Full Name"
                placeholder="Enter your full name"
                {...register('fullName', { 
                    required: 'Name is required',
                    validate: (v) => (v && v.trim().length >= 2) || 'Name cannot be empty or spaces only',
                    pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: 'Name can only contain alphabets'
                    },
                    onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    }
                })}
                error={errors.fullName?.message}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-end w-full">
                <div className="flex-1 space-y-1.5 group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#843D9B]">Phone Number</label>
                    <div className={`flex items-center px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus-within:bg-white transition-all duration-300 ${errors.phone ? 'border-red-100 bg-red-50/30' : 'border-transparent focus-within:border-[#843D9B]'}`}>
                        <span className="text-gray-800 font-medium text-sm mr-2 select-none pointer-events-none">+91</span>
                        <input
                            type="tel"
                            placeholder="00000 00000"
                            maxLength={10}
                            {...register('phone', {
                                required: 'Phone is required',
                                pattern: {
                                    value: /^[6-9]\d{9}$/,
                                    message: 'Invalid 10-digit mobile number starting with 6-9'
                                },
                                onChange: (e) => {
                                    e.target.value = e.target.value.replace(/\D/g, '');
                                    setIsPhoneVerified(false);
                                }
                            })}
                            disabled={isPhoneVerified}
                            className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm text-gray-900 placeholder:text-gray-300 outline-none w-full disabled:opacity-60"
                        />
                        {isPhoneVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-1" />}
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold pl-2">{errors.phone.message}</p>}
                </div>
                {!isPhoneVerified && (
                    <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={!phone || !/^[6-9]\d{9}$/.test(phone) || isSending}
                        className="w-full sm:w-auto px-5 py-3 h-[48px] sm:h-[52px] bg-[#843D9B] hover:bg-[#E04D79] text-white rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[#843D9B]/20 sm:mb-1"
                    >
                        {isSending ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}
                    </button>
                )}
            </div>

            {otpSent && !isPhoneVerified && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                    <label className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest">Enter 6-Digit OTP</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="••••••"
                            maxLength={6}
                            {...register('otp', {
                                required: 'OTP is required',
                                pattern: { value: /^\d{6}$/, message: 'OTP must be 6 digits' }
                            })}
                            className="flex-1 px-4 py-3 bg-white border border-purple-200 rounded-xl font-bold text-center tracking-[0.3em] text-lg focus:outline-none focus:border-[#843D9B]"
                        />
                        <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={isVerifying || !watch('otp') || watch('otp').length !== 6}
                            className="px-6 py-3 bg-[#843D9B] hover:bg-[#E04D79] text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </div>
                    {errors.otp && <p className="text-[10px] text-red-500 font-bold pl-1">{errors.otp.message}</p>}
                </div>
            )}

            <Input
                label="Email Address"
                type="email"
                placeholder="tailor@example.com"
                {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                    }
                })}
                error={errors.email?.message}
            />

            <div className="flex flex-col space-y-1.5 w-full group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#843D9B]">Password</label>
                <div className={`flex items-center px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus-within:bg-white transition-all duration-300 ${errors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus-within:border-[#843D9B]'}`}>
                    <Lock className={`w-4 h-4 mr-3 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#843D9B]'}`} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...register('password', {
                            required: 'Password is required',
                            validate: validatePassword
                        })}
                        className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm text-gray-900 placeholder:text-gray-300 outline-none w-full"
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-[#843D9B] shrink-0"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold pl-2">{errors.password?.message || (typeof errors.password === 'string' ? errors.password : '')}</p>}
            </div>
        </div>
    );
};

export const Step2Business = ({ register, errors, setValue }) => {
    const { detectLocation, isLocating } = useUnifiedLocation({ fetchAddress: true });

    const handleAutoLocation = async () => {
        try {
            const data = await detectLocation();
            if (data) {
                setValue('address', data.address, { shouldValidate: true });
                setValue('city', data.city || '', { shouldValidate: true });
                setValue('pincode', data.pincode || '', { shouldValidate: true });
                setValue('latitude', data.latitude);
                setValue('longitude', data.longitude);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Could not fetch address details automatically.");
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Details</h3>
                <button 
                    type="button"
                    onClick={handleAutoLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLocating ? (
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    ) : (
                        <Navigation size={12} className="fill-primary/10" />
                    )}
                    {isLocating ? 'Locating...' : 'Detect Location'}
                </button>
            </div>
            <Input
                label="Shop Name"
                placeholder="e.g. Royal Stitches"
                {...register('shopName', { 
                    required: 'Shop name is required',
                    validate: (v) => (v && v.trim().length >= 2) || 'Shop name cannot be empty or spaces only'
                })}
                error={errors.shopName?.message}
            />
            <Input
                label="Shop Address"
                placeholder="Street, Landmark, Area"
                {...register('address', { 
                    required: 'Address is required',
                    validate: (v) => (v && v.trim().length >= 5) || 'Shop address cannot be empty or spaces only'
                })}
                error={errors.address?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="City"
                    placeholder="e.g. Mumbai"
                    {...register('city', { 
                        required: 'City is required',
                        validate: (v) => (v && v.trim().length >= 2) || 'City cannot be empty or spaces only',
                        pattern: {
                            value: /^[A-Za-z\s]+$/,
                            message: 'City can only contain alphabets'
                        },
                        onChange: (e) => {
                            e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        }
                    })}
                    error={errors.city?.message}
                />
                <Input
                    label="Pincode"
                    placeholder="400001"
                    maxLength={6}
                    {...register('pincode', { 
                        required: 'Pincode is required',
                        pattern: {
                            value: /^\d{6}$/,
                            message: 'Enter a valid 6-digit pincode'
                        },
                        onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '');
                        }
                    })}
                    error={errors.pincode?.message}
                />
            </div>
            <Input
                label="Experience (Years)"
                type="number"
                placeholder="e.g. 5"
                {...register('experienceInYears', { required: 'Experience is required', min: { value: 0, message: 'Invalid experience' } })}
                error={errors.experienceInYears?.message}
            />
            <Input
                label="Specializations (Comma separated)"
                placeholder="e.g. Suits, Bridal, Alterations"
                {...register('specializations', { 
                    required: 'Specializations are required',
                    validate: (v) => (v && v.trim().length >= 2) || 'Specializations cannot be empty or spaces only'
                })}
                error={errors.specializations?.message}
            />
        </div>
    );
};
