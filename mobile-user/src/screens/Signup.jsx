// Port of modules/customer/pages/Signup.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Gift, UserPlus, ShieldCheck, Check } from 'lucide-react-native';
import { useNavigate, useLocation } from '../lib/nav';
import useAuthStore from '../store/authStore';
import storage from '../lib/storage';
import { validateEmail, validatePhone, validateName, validatePassword } from '../utils/validation';
import AuthLayout from '../components/auth/AuthLayout';
import { Box, Txt, Btn, Input, I } from '../components/ui/primitives';

export const FormError = ({ error }) =>
  error ? (
    <Box className="w-full mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
      <Box className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
      <Txt className="text-xs font-bold text-red-600 flex-1">{typeof error === 'string' ? error : 'Please check your input details'}</Txt>
    </Box>
  ) : null;

const Field = ({ label, icon, children, iconColor = '#94A3B8' }) => (
  <Box className="w-full text-left">
    <Txt className="text-xs font-semibold text-[#0F172A] mb-1">{label}</Txt>
    <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3 gap-3 border border-transparent">
      <I icon={icon} size={18} color={iconColor} />
      {children}
    </Box>
  </Box>
);

const inputCls = 'flex-1 text-xs text-[#0F172A] font-medium p-0 placeholder:text-[#94A3B8]';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = location.state?.from;
  const redirectTo = rawFrom && !rawFrom.includes('/login') && !rawFrom.includes('/register') && !rawFrom.includes('/signup') ? rawFrom : '/user';
  const { signup, sendOTP, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') navigate(redirectTo, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState('info');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = storage.getItem('customerSignupData');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) { /* ignore */ }
    }
    return { name: '', email: '', phoneNumber: '', password: '', referralCode: '' };
  });
  const [error, setError] = useState('');

  useEffect(() => {
    storage.setItem('customerSignupData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (name, raw) => {
    let value = raw;
    if (name === 'name') value = value.replace(/[^a-zA-Z\s]/g, '');
    if (name === 'phoneNumber') value = value.replace(/\D/g, '');
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    // paste of the whole code
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const next = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) next[index + i] = d; });
      setOtp(next);
      otpRefs.current[Math.min(5, index + digits.length)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleSendOTP = async () => {
    setError('');
    const nameErr = validateName(formData.name, 'Full Name');
    if (nameErr) return setError(nameErr);
    const emailErr = validateEmail(formData.email);
    if (emailErr) return setError(emailErr);
    const phoneErr = validatePhone(formData.phoneNumber);
    if (phoneErr) return setError(phoneErr);
    if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) return setError('Please enter a valid 10-digit mobile number starting with 6-9');
    const passErr = validatePassword(formData.password);
    if (passErr) return setError(passErr);
    if (!agreedToTerms) return setError('Please agree with Terms & Conditions');
    try {
      await sendOTP(formData.phoneNumber);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your number.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }
    try {
      await signup({ ...formData, role: 'customer', otp: fullOtp });
      storage.removeItem('customerSignupData');
      navigate('/user', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    }
  };

  const onPrimary = () => {
    if (isLoading) return;
    Keyboard.dismiss();
    if (step === 'info') handleSendOTP();
    else handleSubmit();
  };

  const primaryDisabled = isLoading || (step === 'info' && !agreedToTerms);

  return (
    <AuthLayout>
      <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2">
        <Box className="w-full flex flex-row justify-start mb-1">
          <Btn onPress={() => (step === 'otp' ? setStep('info') : navigate('/user/login'))} className="p-1 -ml-1" hitSlop={8}>
            <I icon={ArrowLeft} size={20} strokeWidth={2.2} color="#0F172A" />
          </Btn>
        </Box>

        <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto">
          <I icon={step === 'info' ? UserPlus : ShieldCheck} size={28} color="#843D9B" />
        </Box>

        <Box className="text-center mb-5 w-full">
          <Txt className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">{step === 'info' ? 'Create Account' : 'Verify Code'}</Txt>
          {step === 'info' ? (
            <Txt className="text-xs font-medium text-[#64748B] max-w-[250px] mx-auto leading-relaxed">Create your account to get started with our amazing services</Txt>
          ) : (
            <Box className="text-center">
              <Txt className="text-xs font-medium text-[#64748B] mb-0.5">Enter the 6-digit code sent to</Txt>
              <Txt className="text-xs font-bold text-[#843D9B]">+91 {formData.phoneNumber}</Txt>
            </Box>
          )}
        </Box>

        <FormError error={error} />

        <Box className="w-full space-y-3.5">
          {step === 'info' ? (
            <>
              <Field label="Full Name" icon={User}>
                <Input placeholder="John Doe" value={formData.name} onChangeText={(t) => handleChange('name', t)} autoCapitalize="words" className={inputCls} />
              </Field>
              <Field label="Email Address" icon={Mail}>
                <Input placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={formData.email} onChangeText={(t) => handleChange('email', t)} className={inputCls} />
              </Field>
              <Box className="w-full text-left">
                <Txt className="text-xs font-semibold text-[#0F172A] mb-1">Mobile Number</Txt>
                <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent">
                  <Box className="bg-white shadow-2xs rounded-xl px-3 py-2 mr-2.5 flex items-center justify-center shrink-0 border border-gray-100/80">
                    <Txt className="text-xs font-bold text-[#0F172A]">+91</Txt>
                  </Box>
                  <Input placeholder="9876543210" keyboardType="phone-pad" maxLength={10} value={formData.phoneNumber} onChangeText={(t) => handleChange('phoneNumber', t)} className={inputCls} style={{ paddingVertical: 6 }} />
                </Box>
              </Box>
              <Field label="Password" icon={Lock}>
                <Input placeholder="••••••••••••" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} value={formData.password} onChangeText={(t) => handleChange('password', t)} className={inputCls} />
                <Btn onPress={() => setShowPassword(!showPassword)} className="shrink-0" hitSlop={8}>
                  <I icon={showPassword ? EyeOff : Eye} size={18} color="#94A3B8" />
                </Btn>
              </Field>
              <Field label="Referral Code (Optional)" icon={Gift} iconColor="#843D9B">
                <Input placeholder="REF123" autoCapitalize="characters" value={formData.referralCode} onChangeText={(t) => handleChange('referralCode', t)} className="flex-1 text-xs text-[#843D9B] font-bold tracking-wider uppercase p-0 placeholder:text-[#94A3B8]" />
              </Field>

              <Box className="flex items-center gap-2 pt-1 px-0.5 text-left">
                <Btn onPress={() => setAgreedToTerms(!agreedToTerms)} className={`w-4 h-4 rounded-[5px] items-center justify-center border ${agreedToTerms ? 'bg-[#843D9B] border-[#843D9B]' : 'bg-white border-gray-400'}`} hitSlop={10}>
                  {agreedToTerms ? <I icon={Check} size={11} strokeWidth={3.5} color="#fff" /> : null}
                </Btn>
                <Txt className="text-xs text-[#64748B] font-medium flex-1" onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  {'I agree with '}
                  <Txt onPress={() => navigate('/user/legal/terms-and-conditions')} className="text-[#843D9B] font-semibold">Terms</Txt>
                  {'  &  '}
                  <Txt onPress={() => navigate('/user/legal/privacy-policy')} className="text-[#843D9B] font-semibold">Privacy Policy</Txt>
                </Txt>
              </Box>
            </>
          ) : (
            <Box className="space-y-6 py-2 w-full">
              <Box className="flex justify-between gap-2 px-1 my-4">
                {otp.map((digit, index) => (
                  <Box key={index} className="flex-1 max-w-[45px] aspect-square bg-[#F6F6F8] rounded-2xl border-2 border-gray-200 shadow-2xs overflow-hidden flex items-center justify-center">
                    <Input
                      ref={(el) => { otpRefs.current[index] = el; }}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? 6 : 1}
                      value={digit}
                      onChangeText={(t) => handleOtpChange(index, t)}
                      onKeyPress={(e) => handleKeyDown(index, e)}
                      textContentType="oneTimeCode"
                      autoComplete={index === 0 ? 'sms-otp' : 'off'}
                      className="w-full h-full text-center text-xl font-bold text-[#0F172A] p-0"
                    />
                  </Box>
                ))}
              </Box>
              <Box className="text-center space-y-1">
                <Btn onPress={() => setStep('info')} className="text-xs text-[#843D9B] font-bold">← Edit details</Btn>
              </Box>
            </Box>
          )}

          <Btn
            onPress={onPrimary}
            disabled={primaryDisabled}
            className={`w-full py-3.5 rounded-[22px] font-bold text-sm tracking-wide shadow-md text-center mt-2 ${primaryDisabled ? 'bg-[#E2D9F3] text-white shadow-none' : 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}
          >
            {isLoading ? (step === 'info' ? 'Sending...' : 'Verifying...') : step === 'info' ? 'Sign Up' : 'Verify & Complete'}
          </Btn>
        </Box>

        <Box className="mt-5 text-center w-full">
          <Txt className="text-xs font-medium text-[#64748B]">
            {'Already have an account? '}
            <Txt onPress={() => navigate('/user/login')} className="text-[#843D9B] font-bold">Sign In</Txt>
          </Txt>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default Signup;
