import React, { useState } from 'react';
import { Input } from '../UIElements';
import ImageUploader from '../../../../components/Common/ImageUploader';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Navigation } from 'lucide-react';
import { useGoogleLocation } from '../../../../hooks/useGoogleLocation';

export const Step1Basic = ({ register, errors, setValue, watch }) => {
    const profileImage = watch('profileImage');
    const phone = watch('phone');
    const [otpSent, setOtpSent] = useState(false);

    const [isSending, setIsSending] = useState(false);

    const handleSendOTP = async () => {
        if (phone && /^[6-9]\d{9}$/.test(phone)) {
            setIsSending(true);
            try {
                // 1. First verify phone doesn't already exist
                const checkRes = await api.post('/auth/check-user', { phoneNumber: phone });
                if (checkRes.data.exists) {
                    toast.error(checkRes.data.message || 'This phone number is already registered');
                    setIsSending(false);
                    return;
                }

                // 2. If it doesn't exist, send OTP
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
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="mb-2">
                <ImageUploader 
                    label="Upload Profile Picture"
                    value={profileImage}
                    onChange={(file) => setValue('profileImage', file, { shouldValidate: true })}
                />
            </div>

            <Input
                label="Full Name"
                placeholder="Enter your full name"
                {...register('fullName', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                error={errors.fullName?.message}
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-end w-full">
                <div className="flex-1 space-y-1.5 group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 transition-colors group-focus-within:text-[#2D2F6F]">Phone Number</label>
                    <div className={`flex items-center px-4 sm:px-5 py-3 sm:py-3.5 bg-[#F8F9FD] border-2 rounded-2xl focus-within:bg-white transition-all duration-300 ${errors.phone ? 'border-red-100 bg-red-50/30' : 'border-transparent focus-within:border-[#2D2F6F]'}`}>
                        <span className="text-gray-800 font-bold text-sm mr-2">+91</span>
                        <div className="w-px h-5 bg-slate-200 mr-2" />
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
                                }
                            })}
                            className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm text-gray-900 placeholder:text-gray-300 outline-none w-full"
                        />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold pl-2">{errors.phone.message}</p>}
                </div>
                <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={!phone || !/^[6-9]\d{9}$/.test(phone) || otpSent || isSending}
                    className="w-full sm:w-auto px-4 py-3 h-[48px] sm:h-[52px] bg-primary text-white rounded-2xl font-bold text-sm whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-indigo-900/10 sm:mb-1"
                >
                    {isSending ? 'Sending...' : (otpSent ? 'OTP Sent' : 'Send OTP')}
                </button>
            </div>
            {otpSent && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <Input
                        label="Verification Code (OTP)"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        {...register('otp', { 
                            required: 'OTP is required',
                            pattern: {
                                value: /^\d{6}$/,
                                message: 'OTP must be 6 digits'
                            },
                            onChange: (e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                            }
                        })}
                        error={errors.otp?.message}
                    />
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
        </div>

    );
};

export const Step2Business = ({ register, errors, setValue }) => {
    const { detectLocation, isLocating } = useGoogleLocation();

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
                {...register('shopName', { required: 'Shop name is required' })}
                error={errors.shopName?.message}
            />
            <Input
                label="Shop Address"
                placeholder="Street, Landmark, Area"
                {...register('address', { required: 'Address is required' })}
                error={errors.address?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="City"
                    placeholder="e.g. Mumbai"
                    {...register('city', { required: 'City is required' })}
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
                {...register('specializations', { required: 'Specializations are required' })}
                error={errors.specializations?.message}
            />
        </div>
    );
};
