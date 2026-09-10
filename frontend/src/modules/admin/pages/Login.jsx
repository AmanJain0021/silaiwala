import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/brandingStore';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
    const [email, setEmail] = useState('admin@tailor.com');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { appName, logos } = useBrandingStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid administrative email address.');
            return;
        }

        if (!password) {
            setError('Please enter your admin password.');
            return;
        }

        try {
            const user = await login(email.trim().toLowerCase(), password);

            if (user.role !== 'admin' && user.role !== 'super_admin') {
                setError('Access Denied. Internal Admin accounts only.');
                useAuthStore.getState().logout();
                return;
            }

            navigate('/admin');
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.message?.toLowerCase().includes('cancel')) return;
            setError(err.message || 'Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#843D9B] relative overflow-hidden font-sans">
            {/* Ambient Animated Gradients */}
            <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-pink-400 rounded-full blur-[140px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary-dark rounded-full blur-[120px] opacity-60"></div>

            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 mx-4 border border-white">
                <div className="p-8 sm:p-12 flex flex-col items-center">

                    {/* Brand Identity */}
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-gray-50 mb-8 transform transition-all hover:scale-105 active:rotate-6 overflow-hidden">
                        <img src={logos.customer} alt={appName} className="w-full h-full object-contain" />
                    </div>

                    <div className="text-center space-y-1 mb-8">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Gate</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
                    </div>

                    <div className="w-full">
                        {error && (
                            <div className="p-4 mb-6 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Admin Email</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#843D9B] transition-colors">
                                        <Mail size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="admin@tailor.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] text-sm font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:bg-white transition-all shadow-inner"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Password</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#843D9B] transition-colors">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] text-sm font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:bg-white transition-all shadow-inner"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#843D9B] transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 py-5 bg-[#843D9B] hover:bg-[#6B2F7E] text-white text-[11px] font-black rounded-2xl shadow-xl shadow-indigo-500/40 transition-all uppercase tracking-[0.15em] active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isLoading ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <>Sign In to Admin Console <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Assurance */}
                <div className="bg-gray-50/80 p-6 border-t border-gray-100 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-[#843D9B]" />
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Secure SSL Encrypted Session
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
