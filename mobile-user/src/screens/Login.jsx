// Port of modules/customer/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { Lock, Eye, EyeOff, KeyRound, User } from 'lucide-react-native';
import { useNavigate, useLocation, useParams } from '../lib/nav';
import useAuthStore from '../store/authStore';
import { validatePhone } from '../utils/validation';
import api from '../lib/api';
import { getGoogleIdToken, isGoogleAuthAvailable } from '../lib/google';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleButton from '../components/auth/GoogleButton';
import LocationSplashScreen from '../components/common/LocationSplashScreen';
import { Box, Txt, Btn, Input, I } from '../components/ui/primitives';
import { FormError } from './Signup';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const rawFrom = location.state?.from || params.from;
  const redirectTo = rawFrom && !rawFrom.includes('/login') && !rawFrom.includes('/register') && !rawFrom.includes('/signup') ? rawFrom : '/user';
  const { otpLogin, sendOTP, isLoading, logout, isAuthenticated, user } = useAuthStore();

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer' && !isLocating) {
      navigate(redirectTo, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const checkRes = await api.post('/auth/check-user', { phoneNumber: mobileNumber });
      if (!checkRes.data.exists) {
        setError('First you must register, then login');
        setSendingOtp(false);
        return;
      }
      if (checkRes.data.role && checkRes.data.role !== 'customer') {
        setError(`This number is registered as a ${checkRes.data.role.toUpperCase()}. Customer login is for Customers only.`);
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

  const handleSubmit = async () => {
    if (sendingOtp || isLoading) return;
    Keyboard.dismiss();
    setError('');

    if (loginMethod === 'password') {
      if (!mobileNumber || !password) {
        setError('Please fill in all fields');
        return;
      }
      try {
        const u = await useAuthStore.getState().login(mobileNumber, password, 'customer');
        if (u?.role !== 'customer') {
          logout();
          setError('This login is for customers only.');
          return;
        }
        setLoggedInUser(u);
        setIsLocating(true);
      } catch (err) {
        setError(err.message || 'Invalid credentials');
      }
      return;
    }

    if (!otpSent) {
      handleSendOtp();
      return;
    }
    if (!mobileNumber || !otp) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const u = await otpLogin(mobileNumber, otp, 'customer');
      if (u?.role !== 'customer') {
        logout();
        setError('This login is for customers only.');
        return;
      }
      setLoggedInUser(u);
      setIsLocating(true);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    }
  };

  const handleLocationComplete = () => {
    setIsLocating(false);
    navigate(redirectTo, { replace: true });
  };

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      setError('');
      const credential = await getGoogleIdToken();
      if (!credential) return;
      const u = await useAuthStore.getState().googleLogin(credential);
      if (u?.role !== 'customer') {
        useAuthStore.getState().logout();
        const portalHint = { tailor: 'Partner', delivery: 'Delivery', admin: 'Admin', measurement_executive: 'Executive' }[u?.role] || 'appropriate';
        setError(`This login is for customers only. Please use the ${portalHint} portal.`);
        return;
      }
      setLoggedInUser(u);
      setIsLocating(true);
    } catch (err) {
      if (err.message?.includes('create an account first')) setError('Account not found. Please create an account first.');
      else setError(err.message || 'Google Login Failed');
    } finally {
      setGoogleBusy(false);
    }
  };

  const submitDisabled = !mobileNumber || (loginMethod === 'password' && !password) || (loginMethod === 'otp' && otpSent && !otp) || isLoading || sendingOtp;

  return (
    <>
      <AuthLayout>
        <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2">
          <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
            <I icon={User} size={24} color="#843D9B" strokeWidth={2.2} />
          </Box>

          <Box className="text-center mb-6 w-full">
            <Txt className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">Sign In</Txt>
            <Txt className="text-xs font-medium text-[#64748B] max-w-[250px] mx-auto leading-relaxed">Welcome back! Please sign in to your account</Txt>
          </Box>

          <FormError error={error} />

          <Box className="w-full space-y-4">
            <Box className="w-full text-left">
              <Txt className="text-xs font-semibold text-[#0F172A] mb-1.5">Mobile Number</Txt>
              <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent">
                <Box className="bg-white shadow-2xs rounded-xl px-3 py-2 mr-2.5 flex items-center justify-center shrink-0 border border-gray-100/80">
                  <Txt className="text-xs font-bold text-[#0F172A]">+91</Txt>
                </Box>
                <Input
                  keyboardType="phone-pad"
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  onChangeText={(t) => setMobileNumber(t.replace(/\D/g, ''))}
                  maxLength={10}
                  editable={!(otpSent || sendingOtp)}
                  className="flex-1 text-xs text-[#0F172A] font-medium p-0 placeholder:text-[#94A3B8]"
                  style={{ paddingVertical: 6 }}
                />
                {otpSent && (
                  <Btn onPress={() => { setOtpSent(false); setOtp(''); }} className="text-xs font-bold text-[#843D9B] shrink-0 pr-2">Change</Btn>
                )}
              </Box>
            </Box>

            {loginMethod === 'password' && (
              <Box className="w-full text-left">
                <Txt className="text-xs font-semibold text-[#0F172A] mb-1.5">Password</Txt>
                <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent">
                  <I icon={Lock} size={18} color="#94A3B8" />
                  <Input
                    secureTextEntry={!showPassword}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                    className="flex-1 text-xs text-[#0F172A] font-medium p-0 placeholder:text-[#94A3B8]"
                  />
                  <Btn onPress={() => setShowPassword(!showPassword)} className="shrink-0" hitSlop={8}>
                    <I icon={showPassword ? EyeOff : Eye} size={18} color="#94A3B8" />
                  </Btn>
                </Box>
                <Box className="flex justify-end pt-2">
                  <Btn onPress={() => navigate('/user/forgot-password')} className="text-xs font-bold text-[#843D9B]">Forgot Password?</Btn>
                </Box>
              </Box>
            )}

            {loginMethod === 'otp' && otpSent && (
              <Box className="space-y-1.5 text-left">
                <Txt className="text-xs font-semibold text-[#0F172A] mb-1.5">Enter 6-Digit OTP</Txt>
                <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent">
                  <I icon={KeyRound} size={18} color="#843D9B" />
                  <Input
                    keyboardType="number-pad"
                    placeholder="Enter OTP"
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    className="flex-1 text-xs text-[#0F172A] font-medium p-0 placeholder:text-[#94A3B8] tracking-widest"
                  />
                </Box>
                <Box className="flex justify-end pt-1">
                  <Btn onPress={handleSendOtp} disabled={sendingOtp} className="text-xs font-semibold text-[#843D9B] disabled:opacity-50">
                    {sendingOtp ? 'Sending...' : 'Resend OTP'}
                  </Btn>
                </Box>
              </Box>
            )}

            <Btn
              onPress={handleSubmit}
              disabled={submitDisabled}
              className={`w-full py-3.5 rounded-[22px] font-bold text-sm tracking-wide shadow-md text-center mt-2 ${submitDisabled ? 'bg-[#E2D9F3] text-white shadow-none' : 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}
            >
              {isLoading ? 'Logging in...' : sendingOtp ? 'Sending OTP...' : loginMethod === 'otp' && !otpSent ? 'Send OTP' : loginMethod === 'otp' && otpSent ? 'Verify & Login' : 'Sign In'}
            </Btn>

            <Box className="text-center pt-1">
              {loginMethod === 'password' ? (
                <Btn onPress={() => { setLoginMethod('otp'); setOtpSent(false); setError(''); }} className="text-xs font-semibold text-[#843D9B]">Login with OTP instead</Btn>
              ) : (
                <Btn onPress={() => { setLoginMethod('password'); setOtpSent(false); setError(''); }} className="text-xs font-semibold text-[#843D9B]">Login with Password instead</Btn>
              )}
            </Box>

            {!otpSent && isGoogleAuthAvailable() && (
              <Box className="space-y-4 pt-1 w-full">
                <Box className="relative flex items-center justify-center my-3 w-full">
                  <Box className="flex-1 border-t border-gray-200/80" />
                  <Txt className="shrink-0 mx-3 text-[#94A3B8] text-xs font-medium bg-white px-2">or continue with</Txt>
                  <Box className="flex-1 border-t border-gray-200/80" />
                </Box>
                <Box className="flex items-center justify-center w-full min-h-[46px]">
                  <GoogleButton onPress={handleGoogle} disabled={googleBusy} />
                </Box>
              </Box>
            )}
          </Box>

          <Box className="mt-5 text-center w-full">
            <Txt className="text-xs font-medium text-[#64748B]">
              {"Don't have an account? "}
              <Txt onPress={() => navigate('/user/register')} className="text-[#843D9B] font-bold">Sign Up</Txt>
            </Txt>
            <Txt className="mt-3 text-[10px] text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed text-center">
              {'By logging in, you agree to our '}
              <Txt onPress={() => navigate('/user/legal/terms-and-conditions')} className="text-[#843D9B]">Terms & Conditions</Txt>
              {' and '}
              <Txt onPress={() => navigate('/user/legal/privacy-policy')} className="text-[#843D9B]">Privacy Policy</Txt>
              .
            </Txt>
          </Box>
        </Box>
      </AuthLayout>
      {isLocating && loggedInUser && <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} />}
    </>
  );
};

export default Login;
