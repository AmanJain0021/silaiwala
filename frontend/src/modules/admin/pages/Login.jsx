import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
const AdminLogin = () => {
    const navigate = useNavigate();
    const { sendOTP, otpLogin, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('identifier'); // 'identifier' | 'otp'
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);

    const otpInputs = useRef([]);

    // Resend Timer Logic
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid administrative email address.');
            return;
        }

        try {
            await sendOTP(email);
            setStep('otp');
            setTimer(60); // 60 seconds reset
        } catch (err) {
            setError(err.message || 'Failed to send OTP to this admin email.');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }

        try {
            const user = await otpLogin(email, otpValue);

            if (user.role !== 'admin') {
                setError('Access Denied. Internal Admin accounts only.');
                useAuthStore.getState().logout();
                return;
            }
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Invalid verification code');
        }
    };

    const handleOtpChange = (value, index) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            otpInputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        if (data.length === 6 && data.every(char => !isNaN(char))) {
            setOtp(data);
            otpInputs.current[5].focus();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#2D2F6E] relative overflow-hidden font-sans">
            {/* Ambient Animated Gradients */}
            <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-pink-400 rounded-full blur-[140px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary-dark rounded-full blur-[120px] opacity-60"></div>

            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 mx-4 border border-white">
                <div className="p-8 sm:p-12 flex flex-col items-center">

                    {/* Brand Identity */}
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-gray-50 mb-8 transform transition-all hover:scale-105 active:rotate-6 overflow-hidden">
                        <img src="/sewzella_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                    </div>

                    <div className="text-center space-y-1 mb-10">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Gate</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
                    </div>

                    <div className="w-full">
                        {error && (
                            <div className="p-4 mb-6 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl text-center">
                                {error}
                            </div>
                        )}

                        {step === 'identifier' ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Work Email Address</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2D2F6E] transition-colors">
                                            <Mail size={18} />
                                        </span>
                                        <input
                                            type="email"
                                            placeholder="admin@sewzella.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] text-sm font-bold text-gray-900 outline-none focus:border-[#2D2F6E] focus:bg-white transition-all shadow-inner"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-[#2D2F6E] hover:bg-[#1E1F4D] text-white text-[11px] font-black rounded-2xl shadow-xl shadow-indigo-500/40 transition-all uppercase tracking-[0.15em] active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isLoading ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>Request Access Code <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-[#2D2F6E] rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2D2F6E] animate-ping"></div>
                                        Safety Token Sent
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Verify login for <span className="font-black text-gray-900">{email}</span></p>
                                </div>

                                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            ref={el => otpInputs.current[index] = el}
                                            className="w-12 h-14 text-center text-xl font-black bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#2D2F6E] focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-gray-900 shadow-sm"
                                            type="text"
                                            maxLength="1"
                                            value={data}
                                            onChange={e => handleOtpChange(e.target.value, index)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            onFocus={e => e.target.select()}
                                        />
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading || otp.join('').length !== 6}
                                        className="w-full py-5 bg-[#2D2F6E] hover:bg-[#1E1F4D] text-white text-[11px] font-black rounded-2xl shadow-xl shadow-indigo-500/40 transition-all uppercase tracking-[0.15em] active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <>Verify & Authorize <ShieldCheck size={18} /></>
                                        )}
                                    </button>

                                    <div className="flex flex-col items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep('identifier')}
                                            className="text-[10px] text-gray-400 font-bold uppercase hover:text-[#2D2F6E] transition-colors"
                                        >
                                            Change Email Address
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={timer > 0 || isLoading}
                                            className="text-[10px] text-[#2D2F6E] font-black uppercase tracking-widest disabled:text-gray-300"
                                        >
                                            {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Security Code'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer Assurance */}
                <div className="bg-gray-50/80 p-6 border-t border-gray-100 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-[#2D2F6E]" />
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Secure SSL Encrypted Session
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
