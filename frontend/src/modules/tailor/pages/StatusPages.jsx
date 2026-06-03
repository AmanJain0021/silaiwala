import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContainer from '../../../components/Common/AppContainer';
import { Button } from '../components/UIElements';
import { Clock, ShieldAlert, LogOut, MessageCircle } from 'lucide-react';
import { useTailorAuth, TAILOR_STATUS } from '../context/AuthContext';

export const UnderReview = () => {
    const { logout, status } = useTailorAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (status === TAILOR_STATUS.APPROVED) {
            navigate('/partner');
        }
    }, [status, navigate]);

    return (
        <AppContainer>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                <div className="h-24 w-24 bg-indigo-50 text-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/5">
                    <Clock size={40} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Under Review</h2>
                <p className="text-gray-500 mt-4 leading-relaxed font-medium">
                    Our team is currently verifying your documents and business details. This usually takes 24-48 hours.
                </p>

                <div className="w-full space-y-4 mt-12">
                    <Button variant="secondary" className="border-gray-100 text-gray-600" onClick={() => { logout(); navigate('/partner/login'); }}>
                        <LogOut size={18} /> Sign Out
                    </Button>
                    <Button variant="ghost" className="text-primary">
                        <MessageCircle size={18} /> Contact Support
                    </Button>
                </div>
            </div>
        </AppContainer>
    );
};

export const RejectedPage = () => {
    const { user, logout } = useTailorAuth();
    const navigate = useNavigate();

    return (
        <AppContainer>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                <div className="h-24 w-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-red-500/5">
                    <ShieldAlert size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Application Rejected</h2>
                <div className="mt-6 p-6 bg-red-50 rounded-3xl border border-red-100 w-full space-y-4">
                    <p className="text-sm text-red-800 font-bold text-left italic">"Your application was not approved. Please contact support for more information regarding your rejection."</p>
                </div>
                <p className="text-gray-500 mt-6 leading-relaxed font-medium">
                    Please re-apply with correct information to get your account approved.
                </p>

                <div className="w-full space-y-4 mt-12">
                    <Button onClick={() => navigate('/partner/register')}>
                        Re-apply Now
                    </Button>
                    <Button variant="secondary" className="border-gray-100 text-gray-600" onClick={() => { logout(); navigate('/partner/login'); }}>
                        Sign Out
                    </Button>
                </div>
            </div>
        </AppContainer>
    );
};
