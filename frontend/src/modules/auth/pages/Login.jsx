import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import useAuthStore from '../../../store/authStore';
import { validatePhone } from '../../../utils/validation';
import LocationSplashScreen from '../../../components/common/LocationSplashScreen';

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
        setError('');

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

    if (isLocating && loggedInUser) {
        return <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
        >
            <div className="text-left mb-10 sm:mb-12">
                <h2 className="text-2xl md:text-4xl font-black text-[#2D2F6E] tracking-tight leading-tight">
                    Welcome to <br className="hidden md:block" />
                    Sewzella
                </h2>
                <p className="text-xs md:text-sm font-bold text-slate-500 mt-4 sm:mt-5 max-w-[250px]">
                    Please login to continue
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-6 sm:space-y-8">
                    <div className="bg-[#F8FAFC] rounded-[1.2rem] sm:rounded-[1.5rem] p-1 border border-slate-50 shadow-inner group transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                        <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3">
                            <span className="text-gray-800 font-bold text-sm">+91</span>
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

                    {!otpSent && (
                        <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md ${!mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-[#2D2F6E] hover:bg-[#E04D79] text-white shadow-[#2D2F6E]/20 hover:shadow-lg'
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
                                className="w-full h-11 sm:h-12 rounded-full bg-[#2D2F6E] hover:bg-[#E04D79] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#2D2F6E]/20"
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
            </form>
            <div className="mt-10 md:mt-12 text-center sm:text-left">
                <p className="text-xs md:text-sm font-bold text-slate-400">
                    Don't have an account?{' '}
                    <button 
                        onClick={() => navigate('/signup')}
                        className="text-[#2D2F6E] font-black hover:underline ml-1"
                    >
                        Create Account
                    </button>
                </p>
            </div>
        </motion.div>
    );
};

export default Login;
