// Port of modules/measurement-executive/pages/PendingApproval.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import storage from '../lib/storage';
import React, { useState } from "react";
import { Clock, RefreshCcw, LogOut, ShieldAlert, CheckCircle2 } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import useAuthStore from "../store/authStore";
import Screen from "../components/common/Screen";
import toast from '../lib/toast';
import useBrandingStore from "../store/brandingStore";
import { Box, I, Txt, Btn, Scroll } from '../components/ui/primitives';
const PendingApproval = () => {
  const navigate = useNavigate();
  const {
    supportEmail
  } = useBrandingStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const emailDisplay = supportEmail || 'support@silaiwala.com';
  const user = JSON.parse(storage.getItem('user') || '{}');
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/measurement-executive/profile');
      const userObj = res.data?.data?.user || res.data?.user || res.data;
      if (userObj && userObj.isActive) {
        toast.success('Congratulations! Your account has been approved by Admin.');
        useAuthStore.getState().updateUser({
          isActive: true
        });
        navigate('/executive/dashboard', {
          replace: true
        });
      } else {
        toast('Your account is still pending approval from Admin.', {
          icon: '⏳'
        });
      }
    } catch (error) {
      console.error('Failed to check approval status', error);
      toast.error('Failed to verify status. Please try again in a moment.');
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleLogout = async () => {
    toast.success('Logged out successfully');
    await useAuthStore.getState().logout();
  };
  return <Screen className="bg-[#F8FAFD]"><Scroll className="flex-1" contentClassName="flex flex-col items-center justify-center p-4" contentContainerStyle={{ flexGrow: 1 }}>
            <Box className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center relative overflow-hidden border border-gray-100">
                {/* Header Decoration */}
                <Box className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#843D9B] to-[#E04D79] -z-0 rounded-t-3xl opacity-95" />
                
                <Box className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 mt-4 relative z-10 border-4 border-white">
                    <I icon={Clock} className="w-10 h-10 text-amber-500 animate-pulse" />
                </Box>

                <Box className="relative z-10">
                    <Box className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
                        <I icon={ShieldAlert} className="w-3.5 h-3.5" />
                        Status: Pending Admin Approval
                    </Box>

                    <Txt className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                        Application Under Review
                    </Txt>
                    
                    <Txt className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Your account application for <Txt className="font-bold text-gray-800">{user.email || user.name || 'Measurement Executive'}</Txt> has been received and is currently under review by our Admin team.
                    </Txt>

                    <Box className="bg-amber-50/80 rounded-2xl p-4.5 mb-6 text-left border border-amber-100">
                        <Box className="flex items-start gap-3">
                            <I icon={CheckCircle2} className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <Box>
                                <Txt className="font-black text-amber-900 text-xs uppercase tracking-wider mb-1">What happens next?</Txt>
                                <Txt className="text-amber-800/80 text-xs leading-relaxed font-medium">
                                    Our admin team verifies your credentials and details. Once approved, you can log in and access your dashboard to accept measurement assignments.
                                </Txt>
                            </Box>
                        </Box>
                    </Box>

                    <Box className="flex flex-col gap-3">
                        <Btn onPress={handleRefresh} disabled={isRefreshing} className="w-full py-3.5 px-4 bg-[#843D9B] hover:bg-[#6b317d] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#843D9B]/20 disabled:opacity-70">
                            <I icon={RefreshCcw} className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Checking Approval Status...' : 'Check Approval Status'}
                        </Btn>
                        
                        <Btn onPress={handleLogout} className="w-full py-3.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            <I icon={LogOut} className="w-4 h-4 text-gray-500" />
                            Back to Login
                        </Btn>
                    </Box>
                </Box>
            </Box>
            
            <Txt className="text-gray-400 text-xs mt-6 text-center">
                Need assistance? Contact support at <Txt onPress={() => Linking.openURL(`mailto:${emailDisplay}`)} className="text-[#843D9B] font-bold hover:underline">{emailDisplay}</Txt>
            </Txt>
        </Scroll></Screen>;
};
export default PendingApproval;
