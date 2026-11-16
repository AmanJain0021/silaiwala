// Port of modules/customer/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { Lock, KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useNavigate } from '../lib/nav';
import useAuthStore from '../store/authStore';
import { validatePhone } from '../utils/validation';
import api from '../lib/api';
import toast from '../lib/toast';
import AuthLayout from '../components/auth/AuthLayout';
import { Box, Txt, Btn, Input, I } from '../components/ui/primitives';

const inputCls = 'flex-1 text-xs text-[#0F172A] font-medium p-0 placeholder:text-[#94A3B8]';
const primaryCls = (disabled) => `w-full py-3.5 rounded-[22px] font-bold text-sm tracking-wide shadow-md text-center mt-2 ${disabled ? 'bg-[#E2D9F3] text-white shadow-none' : 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`;

const PasswordField = ({ label, value, onChange, placeholder, show, setShow }) => (
  <Box className="w-full text-left">
    <Txt className="text-xs font-semibold text-[#0F172A] mb-1.5">{label}</Txt>
    <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent">
      <I icon={Lock} size={18} color="#94A3B8" />
      <Input placeholder={placeholder} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} className={inputCls} />
      <Btn onPress={() => setShow(!show)} className="shrink-0" hitSlop={8}>
        <I icon={show ? EyeOff : Eye} size={18} color="#94A3B8" />
      </Btn>
    </Box>
  </Box>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendOTP, resetPassword, isLoading } = useAuthStore();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async () => {
    if (sendingOtp) return;
    Keyboard.dismiss();
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
        setError('No account found with this mobile number.');
        return;
      }
      if (checkRes.data.role !== 'customer') {
        setError('This number is not registered as a Customer.');
        return;
      }
      await sendOTP(mobileNumber);
      toast.success('OTP sent successfully!');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (verifyingOtp) return;
    Keyboard.dismiss();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-otp', { phoneNumber: mobileNumber, otp });
      toast.success('OTP verified successfully!');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (isLoading) return;
    Keyboard.dismiss();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(mobileNumber, otp, newPassword);
      toast.success('Password updated successfully!');
      navigate('/user/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <AuthLayout>
      <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2">
        <Box className="w-full mb-4 flex flex-row">
          <Btn onPress={() => navigate('/user/login', { replace: true })} className="flex items-center text-xs font-bold text-[#843D9B]">
            <I icon={ArrowLeft} size={16} className="mr-1" />
            <Txt>Back to Login</Txt>
          </Btn>
        </Box>

        <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
          <I icon={step === 'reset' ? CheckCircle2 : Lock} size={24} color="#843D9B" strokeWidth={2.2} />
        </Box>

        <Box className="text-center mb-6 w-full">
          <Txt className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">
            {step === 'request' ? 'Forgot Password' : step === 'verify' ? 'Verify OTP' : 'Set New Password'}
          </Txt>
          <Txt className="text-xs font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
            {step === 'request' ? 'Enter your registered mobile number to receive a verification code.' : step === 'verify' ? 'Enter the OTP sent to your mobile.' : 'Create a new, strong password for your account.'}
          </Txt>
        </Box>

        {!!error && (
          <Box className="w-full mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
            <Txt className="text-red-500 text-xs font-medium text-center">{error}</Txt>
          </Box>
        )}

        {step === 'request' && (
          <Box className="w-full space-y-4">
            <Box className="w-full text-left">
              <Txt className="text-xs font-semibold text-[#0F172A] mb-1.5">Mobile Number</Txt>
              <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent">
                <Box className="bg-white shadow-2xs rounded-xl px-3 py-2 mr-2.5 flex items-center justify-center shrink-0 border border-gray-100/80">
                  <Txt className="text-xs font-bold text-[#0F172A]">+91</Txt>
                </Box>
                <Input keyboardType="phone-pad" placeholder="Enter mobile number" value={mobileNumber} onChangeText={(t) => setMobileNumber(t.replace(/\D/g, ''))} maxLength={10} editable={!sendingOtp} className={inputCls} style={{ paddingVertical: 6 }} />
              </Box>
            </Box>
            <Btn onPress={handleSendOtp} disabled={!mobileNumber || sendingOtp} className={primaryCls(!mobileNumber || sendingOtp)}>
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </Btn>
          </Box>
        )}

        {step === 'verify' && (
          <Box className="w-full space-y-4">
            <Box className="space-y-1.5 text-left">
              <Box className="flex justify-between items-center mb-1.5">
                <Txt className="text-xs font-semibold text-[#0F172A]">Enter 6-Digit OTP</Txt>
                <Btn onPress={handleSendOtp} disabled={sendingOtp || verifyingOtp} className="text-xs font-semibold text-[#843D9B] disabled:opacity-50">
                  {sendingOtp ? 'Sending...' : 'Resend OTP'}
                </Btn>
              </Box>
              <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent">
                <I icon={KeyRound} size={18} color="#843D9B" />
                <Input keyboardType="number-pad" placeholder="Enter OTP" value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, ''))} maxLength={6} editable={!verifyingOtp} textContentType="oneTimeCode" autoComplete="sms-otp" className={`${inputCls} tracking-widest`} />
              </Box>
            </Box>
            <Btn onPress={handleVerifyOtp} disabled={!otp || otp.length !== 6 || verifyingOtp} className={primaryCls(!otp || otp.length !== 6 || verifyingOtp)}>
              {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
            </Btn>
            <Box className="text-center mt-3">
              <Btn onPress={() => { setStep('request'); setOtp(''); setError(''); }} className="text-xs font-medium text-gray-500">Change Mobile Number</Btn>
            </Box>
          </Box>
        )}

        {step === 'reset' && (
          <Box className="w-full space-y-4">
            <PasswordField label="New Password" placeholder="Enter new password" value={newPassword} onChange={setNewPassword} show={showPassword} setShow={setShowPassword} />
            <PasswordField label="Confirm Password" placeholder="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} setShow={setShowConfirmPassword} />
            <Btn onPress={handleResetPassword} disabled={!newPassword || !confirmPassword || isLoading} className={primaryCls(!newPassword || !confirmPassword || isLoading)}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Btn>
          </Box>
        )}
      </Box>
    </AuthLayout>
  );
};

export default ForgotPassword;
