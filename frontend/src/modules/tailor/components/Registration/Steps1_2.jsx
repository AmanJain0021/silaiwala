import React, { useState } from 'react';
import { Input, FileUpload } from '../UIElements';

export const Step1Basic = ({ register, errors, setValue, watch }) => {
    const profileImage = watch('profileImage');
    const phone = watch('phone');
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOTP = () => {
        // Here you would typically make an API call to send the OTP
        if (phone && phone.length >= 10) {
            setOtpSent(true);
            // Mocking OTP send success
            console.log('OTP Sent to', phone);
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="flex flex-col items-center gap-3 mb-2">
                <div className="relative h-20 w-20 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group">
                    {profileImage ? (
                        <img src={URL.createObjectURL(profileImage)} className="h-full w-full object-cover" alt="Profile" />
                    ) : (
                        <div className="text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setValue('profileImage', e.target.files[0])}
                    />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">
                    Upload Profile Picture
                </p>
            </div>

            <Input
                label="Full Name"
                placeholder="Enter your full name"
                {...register('fullName', { required: 'Name is required' })}
                error={errors.fullName?.message}
            />
            <div className="flex gap-2 items-end w-full">
                <div className="flex-1">
                    <Input
                        label="Phone Number"
                        placeholder="+91 00000 00000"
                        {...register('phone', { required: 'Phone is required' })}
                        error={errors.phone?.message}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={!phone || phone.length < 10 || otpSent}
                    className="px-4 py-3 h-[52px] bg-primary text-white rounded-2xl font-bold text-sm whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-indigo-900/10 mb-1"
                >
                    {otpSent ? 'OTP Sent' : 'Send OTP'}
                </button>
            </div>
            <Input
                label="Email Address"
                type="email"
                placeholder="tailor@example.com"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message}
            />
            <Input
                label="Create Password"
                type="password"
                placeholder="Secure password"
                {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
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
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="City"
                    placeholder="e.g. Mumbai"
                    {...register('city', { required: 'City is required' })}
                    error={errors.city?.message}
                />
                <Input
                    label="Pincode"
                    placeholder="400001"
                    {...register('pincode', { required: 'Pincode is required' })}
                    error={errors.pincode?.message}
                />
            </div>
            <Input
                label="Experience (Years)"
                type="number"
                placeholder="e.g. 5"
                {...register('experienceInYears', { required: 'Experience is required' })}
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
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-2xl focus:outline-none transition-all ${errors.serviceArea ? 'border-red-400 focus:border-red-500 bg-red-50/50' : 'border-gray-50 focus:border-primary focus:bg-white'}`}
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
