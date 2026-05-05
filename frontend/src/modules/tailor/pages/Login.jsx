import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTailorAuth } from '../context/AuthContext';
import { FiUser } from 'react-icons/fi';
import api from '../services/api';

const TailorLogin = () => {
    const { login } = useTailorAuth();
    const navigate = useNavigate();

    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const { register, handleSubmit, watch, formState: { errors }, setError: setFormError, clearErrors } = useForm();
    const mobileNumber = watch('mobileNumber');

    const handleSendOTP = async () => {
        if (!mobileNumber || mobileNumber.length < 10) {
            setFormError('root', { type: 'manual', message: 'Enter a valid 10-digit number' });
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="text-left mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] tracking-tight mb-2">Welcome Back!</h2>
                <p className="text-sm font-medium text-gray-500">
                    {otpSent ? 'Enter the verification code sent to your mobile' : 'Login to manage your orders and customers'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center justify-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        {errors.root.message}
                    </motion.div>
                )}

                <div className="space-y-4">
                    {/* Mobile Number Field */}
                    <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-pink-300">
                        <div className="flex items-center px-3 py-2 gap-2">
                            <FiUser className="text-[#D86580] text-lg" />
                            <span className="text-gray-500 font-bold text-sm border-r border-gray-100 pr-2">+91</span>
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                maxLength={10}
                                {...register('mobileNumber', {
                                    required: 'Mobile number is required',
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: 'Invalid mobile number'
                                    }
                                })}
                                disabled={otpSent || sendingOtp}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium placeholder:text-gray-400 outline-none w-full disabled:opacity-60"
                            />
                        </div>
                    </div>
                    {errors.mobileNumber && <p className="text-xs text-red-500 pl-2 -mt-2">{errors.mobileNumber.message}</p>}

                    {!otpSent && (
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-12 rounded-xl font-bold transition-all duration-300 ${
                                !mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#D86580] hover:bg-[#b8526a] text-white shadow-md shadow-indigo-200'
                            }`}
                        >
                            {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {otpSent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden pt-2"
                        >
                            {/* OTP Field */}
                            <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-pink-300">
                                <div className="flex items-center px-3 py-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        maxLength={6}
                                        {...register('otp', {
                                            required: 'OTP is required',
                                        })}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium tracking-[0.5em] text-center outline-none w-full"
                                    />
                                </div>
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-12 rounded-xl font-bold text-white transition-all duration-300 ${
                                    isLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-[#D86580] hover:bg-[#b8526a] shadow-md shadow-indigo-200'
                                }`}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </motion.div>
    );
};

export default TailorLogin;
