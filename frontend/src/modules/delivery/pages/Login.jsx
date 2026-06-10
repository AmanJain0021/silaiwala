import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Eye, ArrowRight, EyeOff } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import LocationSplashScreen from '../../../components/Common/LocationSplashScreen';

const DeliveryLogin = () => {
    const navigate = useNavigate();
    const { sendOTP, otpLogin, isLoading } = useAuthStore();

    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [error, setError] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);

    const handleSendOTP = async () => {
        if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
            setError('Enter a valid 10-digit mobile number starting with 6-9');
            return;
        }

        setError('');
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
            setError('Please enter mobile number and OTP');
            return;
        }

        try {
            const user = await otpLogin(mobileNumber, otp);
            setLoggedInUser(user);
            setIsLocating(true);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        }
    };

    const handleLocationComplete = () => {
        setIsLocating(false);
        navigate('/delivery/dashboard');
    };

    if (isLocating && loggedInUser) {
        return <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="mb-4">
                <h2 className="text-xl font-black text-[#1e293b] mb-0.5">Welcome back!</h2>
                <p className="text-sm font-medium text-gray-400">
                    {otpSent ? 'Verify your number' : 'Login to continue'}
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-4">
                    {/* Mobile Number Field */}
                    <div className="group">
                        <div className={`flex items-center px-4 py-3 rounded-2xl bg-[#F8F9FD] border-2 transition-all duration-300 ${error && !otpSent ? 'border-red-100' : 'border-transparent focus-within:border-[#2D2F6F] focus-within:bg-white'}`}>
                            <Phone className={`w-5 h-5 mr-3 transition-colors ${error && !otpSent ? 'text-red-400' : 'text-[#2D2F6F]'}`} />
                            <input
                                type="tel"
                                placeholder="Mobile number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                disabled={otpSent || sendingOtp}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-bold placeholder:text-gray-400 outline-none w-full disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {!otpSent && (
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-12 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                                !mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-400'
                                    : 'bg-[#2D2F6F] hover:bg-[#1E1F4D] shadow-lg shadow-purple-100'
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
                                <div className={`flex items-center px-4 py-3 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#2D2F6F] focus-within:bg-white transition-all duration-300`}>
                                    <Lock className="w-5 h-5 mr-3 text-[#2D2F6F]" />
                                    <input
                                        type={showOtp ? "text" : "password"}
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-bold placeholder:text-gray-400 placeholder:tracking-normal outline-none w-full tracking-[0.2em]"
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
                                className={`w-full h-12 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                                    isLoading ? 'bg-purple-300' : 'bg-[#2D2F6F] hover:bg-[#1E1F4D] shadow-lg shadow-purple-100'
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

export default DeliveryLogin;

