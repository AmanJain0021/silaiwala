import React, { useState } from 'react';
import { Input } from '../UIElements';
import ImageUploader from '../../../../components/Common/ImageUploader';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const Step1Basic = ({ register, errors, setValue, watch }) => {
    const profileImage = watch('profileImage');
    const phone = watch('phone');
    const [otpSent, setOtpSent] = useState(false);

    const [isSending, setIsSending] = useState(false);

    const handleSendOTP = async () => {
        if (phone && /^[6-9]\d{9}$/.test(phone)) {
            setIsSending(true);
            try {
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
            <Input
                label="Create Password"
                type="password"
                placeholder="Secure password"
                {...register('password', { 
                    required: 'Password is required',
                    validate: (value) => {
                        if (value.length < 8) return "Password must be at least 8 characters long";
                        if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter";
                        if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
                        if (!/[0-9]/.test(value)) return "Password must contain a number";
                        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Password must contain a special character";
                        return true;
                    }
                })}
                error={errors.password?.message}
            />
        </div>

    );
};

export const Step2Business = ({ register, errors }) => {
    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
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
            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Service Area</label>
                <select
                    {...register('serviceArea', { required: 'Area is required' })}
                    className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-2 rounded-2xl focus:outline-none transition-all text-sm font-medium ${errors.serviceArea ? 'border-red-400 focus:border-red-500 bg-red-50/50' : 'border-gray-50 focus:border-primary focus:bg-white'}`}
                >
                    <option value="">Select Region</option>
                    <option value="north">North India</option>
                    <option value="south">South India</option>
                    <option value="east">East India</option>
                    <option value="west">West India</option>
                    <option value="central">Central India</option>
                </select>
            </div>
        </div>
    );
};
