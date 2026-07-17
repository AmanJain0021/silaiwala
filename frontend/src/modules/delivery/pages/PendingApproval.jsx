import React, { useState } from 'react';
import { Clock, RefreshCcw, LogOut, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import deliveryService from '../services/deliveryService';
import { toast } from 'react-hot-toast';

const PendingApproval = () => {
    const { logout, updateUser } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await deliveryService.getProfile();
            // Try to extract user.isActive from various possible response shapes
            const profile = res.data || res;
            const userObj = profile.user || profile;
            
            if (userObj.isActive) {
                toast.success('Your account has been approved!');
                updateUser({ isActive: true });
                window.location.reload();
            } else {
                toast('Still pending approval.', { icon: '⏳' });
            }
        } catch (error) {
            console.error('Failed to check status', error);
            toast.error('Failed to check status. Please try again later.');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-slate-800 -z-10 rounded-t-3xl" />
                
                <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 mt-4 relative z-10">
                    <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                    Application Under Review
                </h1>
                
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Thank you for registering as a Delivery Partner. Our team is currently reviewing your profile and documents. We will notify you once your account is approved.
                </p>

                <div className="bg-amber-50 rounded-2xl p-5 mb-8 text-left border border-amber-100">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-900 text-sm mb-1">What happens next?</h3>
                            <p className="text-amber-700/80 text-sm leading-relaxed">
                                Our verification team usually takes 24-48 hours to review new partner applications. Make sure all your submitted documents are clear and valid.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Checking Status...' : 'Check Status'}
                    </button>
                    
                    <button
                        onClick={logout}
                        className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </div>
            
            <p className="text-slate-400 text-sm mt-8">
                Need help? Contact support at <a href="mailto:support@sewzella.com" className="text-slate-600 hover:underline">support@sewzella.com</a>
            </p>
        </div>
    );
};

export default PendingApproval;
