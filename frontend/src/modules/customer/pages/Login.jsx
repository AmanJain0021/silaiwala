import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import useAuthStore from '../../../store/authStore';
import { validatePhone } from '../../../utils/validation';
import LocationSplashScreen from '../../../components/Common/LocationSplashScreen';
import api from '../../../utils/api';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate();
    const { otpLogin, sendOTP, isLoading } = useAuthStore();

    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);

    const handleSendOtp = async () => {
        setError('');
        
        const phoneErr = validatePhone(mobileNumber);
        if (phoneErr) return setError(phoneErr);
        
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            setError('Please enter a valid 10-digit mobile number starting with 6-9');
            return;
        }

        setSendingOtp(true);
        try {
            // First check if user is registered
            const checkRes = await api.post('/auth/check-user', { phoneNumber: mobileNumber });
            if (!checkRes.data.exists) {
                setError('First you must register, then login');
                setSendingOtp(false);
                return;
            }

            await sendOTP(mobileNumber);
            setOtpSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sendingOtp) return;
        setError('');

        if (!otpSent) {
            handleSendOtp();
            return;
        }

        if (!mobileNumber || !otp) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const user = await otpLogin(mobileNumber, otp);
            setLoggedInUser(user);
            setIsLocating(true);
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        }
    };

    const handleLocationComplete = () => {
        setIsLocating(false);
        const redirectPath = {
            tailor: '/partner',
            delivery: '/delivery/dashboard',
            admin: '/admin'
        }[loggedInUser?.role] || '/user';
        navigate(redirectPath);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const user = await useAuthStore.getState().googleLogin(credentialResponse.credential);
            setLoggedInUser(user);
            setIsLocating(true);
        } catch (err) {
            if (err.message.includes('create an account first')) {
                setError('Account not found. Please create an account first.');
            } else {
                setError(err.message || 'Google Login failed');
            }
        }
    };

    const handleGoogleError = () => {
        setError('Google Login Failed');
    };

    if (isLocating && loggedInUser) {
        return <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full flex flex-col"
        >
            <div className="text-left mb-10 sm:mb-12">
                <h2 className="text-2xl md:text-4xl font-black text-[#843D9B] tracking-tight leading-tight">
                    Welcome to <br className="hidden md:block" />
                    Sewzella
                </h2>
                <p className="text-xs md:text-sm font-bold text-slate-500 mt-4 sm:mt-5 max-w-[250px]">
                    Please login to continue
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 flex-1">
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-[#F8FAFC] rounded-[1.2rem] sm:rounded-[1.5rem] p-1 border border-slate-50 shadow-inner group transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                        <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3">
                            <span className="text-black font-bold text-base tracking-wide">+91</span>
                            <div className="w-px h-6 bg-slate-200" />
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                required
                                disabled={otpSent || sendingOtp}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-black font-bold placeholder:text-gray-500 placeholder:font-medium tracking-wide outline-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-2 text-xs font-bold text-red-500 flex items-center gap-1.5"
                        >
                            <span className="w-1 h-1 bg-red-500 rounded-full" />
                            {error}
                        </motion.div>
                    )}

                    {!otpSent && (
                        <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md ${!mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-[#843D9B] hover:bg-[#E04D79] text-white shadow-[#843D9B]/20 hover:shadow-lg'
                                }`}
                        >
                            {sendingOtp ? 'Sending...' : (
                                <span className="flex items-center justify-center gap-2">
                                    CONTINUE <span className="text-lg">›</span>
                                </span>
                            )}
                        </Button>
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
                            <div className="bg-[#F8FAFC] rounded-[1.2rem] sm:rounded-[1.5rem] p-1 border border-slate-50 shadow-inner group transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                                <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3">
                                    <input
                                        type="text"
                                        placeholder="Verification Code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        required
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-black font-bold placeholder:text-gray-500 placeholder:font-medium placeholder:tracking-normal placeholder:text-sm tracking-[0.5em] text-center outline-none"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 sm:h-12 rounded-full bg-[#843D9B] hover:bg-[#E04D79] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#843D9B]/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : (
                                    <span className="flex items-center justify-center gap-2">
                                        VERIFY & SIGN IN <span className="text-lg">›</span>
                                    </span>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="w-full text-[10px] font-black text-indigo-400 hover:text-indigo-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 mt-2"
                            >
                                ← Change mobile number
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Google Login Divider and Button */}
                {!otpSent && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                    >
                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Or</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        
                        <div className="flex justify-center w-full pb-2" style={{ minHeight: '44px' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                shape="pill"
                                theme="outline"
                                size="large"
                            />
                        </div>
                    </motion.div>
                )}
            </form>
            <div className="mt-auto pt-6 text-center sm:text-left">
                <p className="text-xs md:text-sm font-bold text-slate-400">
                    Don't have an account?{' '}
                    <button 
                        onClick={() => navigate('/user/register')}
                        className="text-[#843D9B] font-black hover:underline ml-1"
                    >
                        Create Account
                    </button>
                </p>
                <div className="mt-8 text-[10px] text-gray-400 font-medium">
                    By logging in, you agree to our <button onClick={() => navigate('/user/legal/terms-and-conditions')} className="text-[#843D9B] hover:underline mx-1">Terms & Conditions</button> and <button onClick={() => navigate('/user/legal/privacy-policy')} className="text-[#843D9B] hover:underline mx-1">Privacy Policy</button>.
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
