import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiMail, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDeliveryAuthStore } from '../store/deliveryStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const DeliveryForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, isLoading } = useDeliveryAuthStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request');
  const [codes, setCodes] = useState(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 'verify' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
  }, []);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }

    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('If the email exists, reset OTP has been sent.');
      setStep('verify');
      startResendTimer();
    } catch {
      // Global API interceptor shows toast
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('OTP resent successfully.');
      setCodes(Array(OTP_LENGTH).fill(''));
      startResendTimer();
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch {
      // Global API interceptor shows toast
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;
    const next = [...codes];
    next[index] = value;
    setCodes(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;
    setCodes(pasted.split(''));
    inputRefs.current[OTP_LENGTH - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = codes.join('');
    if (otp.length !== OTP_LENGTH) {
      toast.error('Please enter the full OTP.');
      return;
    }

    try {
      await verifyResetOtp(email.trim().toLowerCase(), otp);
      toast.success('OTP verified. Please set your new password.');
      navigate(`/delivery/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      // Global API interceptor shows toast
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-left mb-8">
        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Forgot Password</h2>
        <p className="text-gray-500 font-medium mt-1">
          {step === 'request'
            ? 'Enter your delivery account email to receive OTP.'
            : `Enter the OTP sent to ${email}`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div className="relative group">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="delivery@email.com"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex justify-center gap-2">
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-11 h-11 text-center text-lg font-bold bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#4CAF50] text-gray-800 transition-all"
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading || resendTimer > 0}
              className="text-sm text-[#4CAF50] hover:underline font-bold disabled:text-gray-400 inline-flex items-center gap-2"
            >
              <FiRefreshCw className={resendTimer > 0 ? '' : 'animate-none'} />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              Change Email
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || codes.some((c) => !c)}
            className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <><FiCheck /> Verify OTP</>}
          </button>
        </form>
      )}

      <div className="text-center pt-6">
        <Link to="/delivery/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4CAF50] font-bold transition-colors">
          <FiArrowLeft />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
};

export default DeliveryForgotPassword;
