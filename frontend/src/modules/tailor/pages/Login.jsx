import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTailorAuth } from '../context/AuthContext';
import { Phone, Lock, Eye, ArrowRight, EyeOff } from 'lucide-react';
import api from '../services/api';

const TailorLogin = () => {
    const { login } = useTailorAuth();
    const navigate = useNavigate();

    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const { register, handleSubmit, watch, formState: { errors }, setError: setFormError, clearErrors } = useForm();
    const mobileNumber = watch('mobileNumber');

    const handleSendOTP = async () => {
        if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
            setFormError('root', { type: 'manual', message: 'Enter a valid 10-digit number starting with 6-9' });
            return;
        }

        clearErrors('root');
        setSendingOtp(true);
        try {
            await api.post('/auth/send-otp', { phoneNumber: mobileNumber });
            setOtpSent(true);
        } catch (error) {
            setFormError('root', {
                type: 'manual',
                message: error.response?.data?.message || 'Failed to send OTP'
            });
        } finally {
            setSendingOtp(false);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        clearErrors('root');

        try {
            const response = await api.post('/auth/login', {
                email: data.mobileNumber,
                otp: data.otp
            });

            if (response.data.success) {
                const { token, data: userData } = response.data;

                if (userData.role !== 'tailor') {
                    setFormError('root', { type: 'manual', message: 'This portal is only for registered tailors.' });
                    return;
                }

                login(userData, token);
                navigate('/partner');
            }
        } catch (error) {
            const message = error.response?.data?.message || "Invalid OTP or server error";
            setFormError('root', { type: 'manual', message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#1e293b] mb-1">Welcome Tailor!</h2>
                <p className="text-sm font-medium text-gray-400">
                    {otpSent ? 'Verify your number' : 'Login to continue'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {errors.root && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {errors.root.message}
                    </motion.div>
                )}

                <div className="space-y-4">
                    {/* Mobile Number Field */}
                    <div className="group">
                        <div className={`flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 transition-all duration-300 ${errors.mobileNumber ? 'border-red-100' : 'border-transparent focus-within:border-[#2D2F6F] focus-within:bg-white'}`}>
                            <Phone className={`w-5 h-5 mr-2 transition-colors ${errors.mobileNumber ? 'text-red-400' : 'text-gray-400 focus-within:text-[#2D2F6F]'}`} />
                            <span className="text-gray-800 font-bold text-sm mr-2">+91</span>
                            <div className="w-px h-5 bg-slate-200 mr-2" />
                            <input
                                type="tel"
                                placeholder="00000 00000"
                                maxLength={10}
                                {...register('mobileNumber', {
                                    required: 'Mobile number is required',
                                    pattern: {
                                        value: /^[6-9]\d{9}$/,
                                        message: 'Invalid mobile number starting with 6-9'
                                    },
                                    onChange: (e) => {
                                        e.target.value = e.target.value.replace(/\D/g, '');
                                    }
                                })}
                                disabled={otpSent || sendingOtp}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full disabled:opacity-60"
                            />
                        </div>
                        {errors.mobileNumber && <p className="text-[10px] text-red-500 font-bold mt-1 pl-2">{errors.mobileNumber.message}</p>}
                    </div>

                    {!otpSent && (
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                                !mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-400'
                                    : 'bg-[#2D2F6F] hover:bg-[#4c1d95] shadow-lg shadow-purple-100'
                            }`}
                        >
                            {sendingOtp ? 'Sending...' : (
                                <>
                                    Send OTP <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {otpSent && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 pt-2"
                        >
                            {/* OTP Field */}
                            <div className="group">
                                <div className={`flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#2D2F6F] focus-within:bg-white transition-all duration-300`}>
                                    <Lock className="w-5 h-5 mr-3 text-[#2D2F6F]" />
                                    <input
                                        type={showOtp ? "text" : "password"}
                                        placeholder="Enter OTP"
                                        maxLength={6}
                                        {...register('otp', {
                                            required: 'OTP is required',
                                        })}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 placeholder:tracking-normal outline-none w-full tracking-[0.2em]"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowOtp(!showOtp)}
                                        className="text-gray-400 hover:text-[#2D2F6F]"
                                    >
                                        {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => setOtpSent(false)} className="text-xs font-bold text-[#2D2F6F] hover:underline">
                                    Resend OTP?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                                    isLoading ? 'bg-purple-300' : 'bg-[#2D2F6F] hover:bg-[#4c1d95] shadow-lg shadow-purple-100'
                                }`}
                            >
                                {isLoading ? 'Verifying...' : (
                                    <>
                                        Login <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </motion.div>
    );
};

export default TailorLogin;


