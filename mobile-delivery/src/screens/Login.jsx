// Port of modules/delivery/pages/Login.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import Checkbox from '../components/ui/Checkbox';
import React, { useState, useEffect } from "react";
import { useNavigate,  } from '../lib/nav';
import { Phone, Lock, Eye, EyeOff, Truck } from "lucide-react-native";
import useAuthStore from "../store/authStore";
import api from "../lib/api";
import { Box, I, Txt, Input, Btn, Scroll } from '../components/ui/primitives';
const DeliveryLogin = () => {
  const navigate = useNavigate();
  const {
    sendOTP,
    otpLogin,
    logout,
    isLoading,
    isAuthenticated,
    user
  } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && user?.role === 'delivery') {
      navigate('/delivery/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, user, navigate]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const handleSendOTP = async () => {
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9');
      return;
    }
    setError('');
    setSendingOtp(true);
    try {
      const checkRes = await api.post('/auth/check-user', {
        phoneNumber: mobileNumber
      });
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
  const handleSubmit = async e => {
    setError('');
    if (loginMethod === 'password') {
      if (!mobileNumber || !password) {
        setError('Please enter mobile number and password');
        return;
      }
      try {
        const checkRes = await api.post('/auth/check-user', {
          phoneNumber: mobileNumber
        });
        if (!checkRes.data.exists) {
          setError('First you must register, then login');
          return;
        }
        const user = await useAuthStore.getState().login(mobileNumber, password, 'delivery');
        if (user?.role !== 'delivery') {
          logout();
          setError('This portal is only for registered delivery partners.');
          return;
        }
        if (user && user.isActive === false) {
          logout();
          setError('⏳ Your application is pending admin approval. You will get dashboard access once approved by admin.');
          return;
        }
        navigate('/delivery/dashboard', {
          replace: true
        });
      } catch (err) {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
      return;
    }
    if (!mobileNumber || !otp) {
      setError('Please enter mobile number and OTP');
      return;
    }
    try {
      const user = await otpLogin(mobileNumber, otp, 'delivery');
      if (user?.role !== 'delivery') {
        logout();
        setError('This portal is only for registered delivery partners.');
        return;
      }
      if (user && user.isActive === false) {
        logout();
        setError('⏳ Your application is pending admin approval. You will get dashboard access once approved by admin.');
        return;
      }
      navigate('/delivery/dashboard', {
        replace: true
      });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  };
  return <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4">
            {/* Top Squircle Card with Icon */}
            <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <I icon={Truck} className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </Box>

            {/* Title & Subtitle */}
            <Box className="text-center mb-6 w-full">
                <Txt className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Delivery Partner Sign In
                </Txt>
                <Txt className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    {loginMethod === 'otp' && otpSent ? 'Enter the OTP sent to your number' : 'Welcome back! Login to your delivery partner account'}
                </Txt>
            </Box>

            <Box className="w-full space-y-4">
                {error && <Box className="w-full mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 flex items-center gap-2">
                        <Txt className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        {error}
                    </Box>}

                {/* Mobile Number Input Card */}
                <Box className="w-full text-left">
                    <Txt className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                        Mobile Number
                    </Txt>
                    <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <Box className="bg-white shadow-2xs rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] mr-2.5 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                            +91
                        </Box>
                        <Input placeholder="Enter mobile number" value={mobileNumber} onChangeText={e => setMobileNumber(e.replace(/\D/g, ''))} maxLength={10} disabled={otpSent || sendingOtp} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] disabled:opacity-60" keyboardType="phone-pad" />
                        {otpSent && <Btn onPress={() => {
            setOtpSent(false);
            setOtp('');
          }} className="text-xs font-bold text-[#843D9B] hover:underline shrink-0 pr-2">
                                Change
                            </Btn>}
                    </Box>
                </Box>

                {!otpSent && <Box className="space-y-4 w-full">
                        {loginMethod === 'password' && <Box className="w-full text-left">
                                <Box className="flex justify-between items-center mb-1.5">
                                    <Txt className="text-xs font-semibold text-[#0F172A]">
                                        Password
                                    </Txt>
                                    <Btn onPress={() => navigate('/delivery/forgot-password')} className="text-xs text-[#843D9B] font-bold hover:underline cursor-pointer">
                                        Forgot password?
                                    </Btn>
                                </Box>
                                <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                    <I icon={Lock} size={18} className="text-[#94A3B8] shrink-0" />
                                    <Input placeholder="Enter your password" value={password} onChangeText={e => setPassword(e)} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                                    <Btn onPress={() => setShowPassword(!showPassword)} className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer">
                                        {showPassword ? <I icon={EyeOff} size={18} /> : <I icon={Eye} size={18} />}
                                    </Btn>
                                </Box>
                            </Box>}

                        {/* Terms Checkbox */}
                        <Box className="flex items-center gap-2 pt-1 px-0.5 text-left">
                            <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} />
                            <Txt className="text-xs text-[#64748B] font-medium cursor-pointer select-none">
                                I agree with{' '}
                                <Txt onPress={() => Linking.openURL('/delivery/legal/terms-and-conditions')} className="text-[#843D9B] font-semibold hover:underline">
                                    Terms & Conditions
                                </Txt>
                                {' '} & {' '}
                                <Txt onPress={() => Linking.openURL('/delivery/legal/privacy-policy')} className="text-[#843D9B] font-semibold hover:underline">
                                    Privacy Policy
                                </Txt>
                            </Txt>
                        </Box>

                        {loginMethod === 'password' && <Box className="space-y-3 pt-1 w-full">
                                <Btn onPress={handleSubmit} disabled={isLoading || !agreedToTerms} className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center ${isLoading || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                                    {isLoading ? 'Logging in...' : 'Sign In'}
                                </Btn>
                                <Btn onPress={() => {
            setLoginMethod('otp');
            setError('');
          }} className="w-full text-xs font-bold text-[#843D9B] hover:underline transition-colors text-center cursor-pointer pt-1 block">
                                    Login with OTP instead
                                </Btn>
                            </Box>}

                        {loginMethod === 'otp' && <Box className="space-y-3 pt-1 w-full">
                                <Btn onPress={handleSendOTP} disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp || !agreedToTerms} className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center ${!mobileNumber || mobileNumber.length < 10 || sendingOtp || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                                    {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                                </Btn>
                                <Btn onPress={() => {
            setLoginMethod('password');
            setError('');
          }} className="w-full text-xs font-bold text-[#843D9B] hover:underline transition-colors text-center cursor-pointer">
                                    Login with Password instead
                                </Btn>
                            </Box>}
                    </Box>}

                <React.Fragment>
                    {loginMethod === 'otp' && otpSent && <Box className="space-y-4 pt-2 w-full text-left">
                            <Box className="w-full text-left">
                                <Txt className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                                    OTP Code
                                </Txt>
                                <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                    <I icon={Lock} size={18} className="text-[#843D9B] shrink-0" />
                                    <Input placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChangeText={e => setOtp(e.replace(/\D/g, ''))} className="w-full text-xs sm:text-sm text-[#0F172A] font-bold tracking-widest bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] placeholder:tracking-normal" />
                                    <Btn onPress={() => setShowOtp(!showOtp)} className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer">
                                        {showOtp ? <I icon={EyeOff} size={18} /> : <I icon={Eye} size={18} />}
                                    </Btn>
                                </Box>
                            </Box>

                            <Box className="flex justify-between items-center text-xs">
                                <Btn onPress={() => {
              setLoginMethod('password');
              setOtpSent(false);
            }} className="text-[#64748B] hover:text-[#843D9B] font-medium">
                                    ← Back to Password
                                </Btn>
                                <Btn onPress={() => setOtpSent(false)} className="text-[#843D9B] font-bold hover:underline">
                                    Resend OTP?
                                </Btn>
                            </Box>

                            <Btn onPress={handleSubmit} disabled={isLoading || !agreedToTerms} className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${isLoading || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                            </Btn>
                        </Box>}
                </React.Fragment>
            </Box>

            {/* Footer Navigation */}
            <Box className="mt-6 text-center w-full">
                <Txt className="text-xs font-medium text-[#64748B]">
                    New to SewZella Delivery?{' '}
                    <Txt onPress={() => navigate("/delivery/signup")} className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer">
                        Register Now
                    </Txt>
                </Txt>
            </Box>
        </Box>;
};
export default DeliveryLogin;
