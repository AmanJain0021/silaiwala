import React, { useState } from 'react';
import { Clock, RefreshCcw, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { removeToken } from '../../../utils/auth';
import { toast } from 'react-hot-toast';

const PendingApproval = () => {
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await api.get('/measurement-executive/profile');
            const userObj = res.data?.data?.user || res.data?.user || res.data;
            
            if (userObj && userObj.isActive) {
                toast.success('Congratulations! Your account has been approved by Admin.');
                const updatedUser = { ...user, isActive: true };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                navigate('/executive/dashboard', { replace: true });
            } else {
                toast('Your account is still pending approval from Admin.', { icon: '⏳' });
            }
        } catch (error) {
            console.error('Failed to check approval status', error);
            toast.error('Failed to verify status. Please try again in a moment.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = () => {
        removeToken();
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/executive/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFD] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center relative overflow-hidden border border-gray-100">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#843D9B] to-[#E04D79] -z-0 rounded-t-3xl opacity-95" />
                
                <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 mt-4 relative z-10 border-4 border-white">
                    <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>

                <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Status: Pending Admin Approval
                    </span>

                    <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                        Application Under Review
                    </h1>
                    
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Your account application for <span className="font-bold text-gray-800">{user.email || user.name || 'Measurement Executive'}</span> has been received and is currently under review by our Admin team.
                    </p>

                    <div className="bg-amber-50/80 rounded-2xl p-4.5 mb-6 text-left border border-amber-100">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-amber-900 text-xs uppercase tracking-wider mb-1">What happens next?</h3>
                                <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
                                    Our admin team verifies your credentials and details. Once approved, you can log in and access your dashboard to accept measurement assignments.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="w-full h-13 py-3.5 px-4 bg-[#843D9B] hover:bg-[#6b317d] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#843D9B]/20 disabled:opacity-70"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Checking Approval Status...' : 'Check Approval Status'}
                        </button>
                        
                        <button
                            onClick={handleLogout}
                            className="w-full h-13 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <LogOut className="w-4 h-4 text-gray-500" />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
            
            <p className="text-gray-400 text-xs mt-6 text-center">
                Need assistance? Contact support at <a href="mailto:support@silaiwala.com" className="text-[#843D9B] font-bold hover:underline">support@silaiwala.com</a>
            </p>
        </div>
    );
};

export default PendingApproval;
