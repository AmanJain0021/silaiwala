// Port of modules/measurement-executive/pages/Dashboard.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../components/ui/Sheet';
import { Linking, RefreshControl } from 'react-native';
import { API_URL } from '../lib/config';
import { Path, default as Svg } from 'react-native-svg';
import React, { useEffect, useState } from "react";
import { useNavigate } from '../lib/nav';
import useMeasurementStore from "../store/measurementExecutiveStore";
import { useMeasurementAuth } from "../components/executive/MeasurementAuthContext";
import { ClipboardList, CheckCircle, TrendingUp, MapPin, User, ChevronRight, AlertCircle, Power, Bell, Navigation, Phone, ArrowRight, X, Loader2, Ruler, ShieldCheck, Play, Video } from "lucide-react-native";
import toast from '../lib/toast';
import useUnifiedLocation from "../shared/hooks/useUnifiedLocation";
import useAuthStore from "../store/authStore";
import api from "../lib/api";
import ExecutiveMeasurementGuideModal from "../components/executive/ExecutiveMeasurementGuideModal";
import { Box, Txt, I, Btn, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const formatAddress = addr => {
  if (!addr) return 'Address details pending';
  if (typeof addr === 'string') return addr.trim() || 'Address details pending';
  if (typeof addr === 'object') {
    const parts = [addr.street || addr.addressLine1 || addr.address || addr.houseNo, addr.landmark, addr.city, addr.state, addr.pincode || addr.zipCode || addr.zip].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return 'Address details pending';
};
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    profile,
    stats,
    loading,
    error,
    fetchDashboard,
    toggleAvailability
  } = useMeasurementStore();
  const {
    isSocketConnected
  } = useMeasurementAuth();
  const {
    detectLocation
  } = useUnifiedLocation({
    fetchAddress: false
  });
  const executiveName = profile?.user?.name || profile?.name || 'Measurement Executive';
  const addressName = profile?.address || 'Location not set';
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Active Accepted Task State
  const [activeTask, setActiveTask] = useState(null);
  const [isLoadingActiveTask, setIsLoadingActiveTask] = useState(false);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Measurement Guide Video Modal State
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    await fetchActiveTask();
    setRefreshing(false);
  };
  const fetchActiveTask = async () => {
    try {
      setIsLoadingActiveTask(true);
      const res = await api.get('/measurement-executive/requests?status=active');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setActiveTask(res.data.data[0]);
      } else {
        setActiveTask(null);
      }
    } catch (error) {
      console.error('Failed to fetch active task:', error);
    } finally {
      setIsLoadingActiveTask(false);
    }
  };
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.data?.filter(n => !n.isRead).length || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };
  useEffect(() => {
    fetchDashboard();
    fetchActiveTask();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleRefreshLocation = async () => {
    setIsFetchingLocation(true);
    toast.loading('Fetching precise location...', {
      id: 'loc-toast-refresh'
    });
    try {
      const data = await detectLocation();
      if (data && data.latitude && data.longitude) {
        await useMeasurementStore.getState().updateLocation([data.longitude, data.latitude]);
        await fetchDashboard();
        toast.success(`Location updated`, {
          id: 'loc-toast-refresh'
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Failed to update location', {
        id: 'loc-toast-refresh'
      });
    } finally {
      setIsFetchingLocation(false);
    }
  };
  const handleToggleStatus = async () => {
    try {
      const newStatus = profile?.availabilityStatus === 'online' ? 'offline' : 'online';
      if (newStatus === 'online') {
        toast.loading('Going online...', {
          id: 'status-toast'
        });
        try {
          const data = await detectLocation();
          if (data && data.latitude && data.longitude) {
            await useMeasurementStore.getState().updateLocation([data.longitude, data.latitude]);
          }
        } catch (locErr) {
          console.warn('Location detection skipped or unavailable:', locErr?.message);
        }
        await toggleAvailability(newStatus);
        toast.success('You are now online', {
          id: 'status-toast'
        });
      } else {
        await toggleAvailability(newStatus);
        toast.success('You are now offline');
      }
    } catch {
      toast.error('Failed to update status', {
        id: 'status-toast'
      });
    }
  };
  if (loading) {
    return <Box className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <Spin size={32} className="text-[#843D9B] mb-3" />
                <Txt className="text-sm font-medium">Loading dashboard...</Txt>
            </Box>;
  }
  if (!profile) {
    return <Box className="p-6 flex flex-col items-center justify-center text-center mt-12 max-w-sm mx-auto">
                <Box className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                    <I icon={AlertCircle} size={36} />
                </Box>
                <Txt className="text-lg font-bold text-slate-800 mb-1.5">Error Loading Dashboard</Txt>
                <Txt className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {error || 'Unable to fetch dashboard data. Please check your network connection and try again.'}
                </Txt>
                <Box className="flex flex-col w-full gap-2.5">
                    <Btn onPress={() => {
          fetchDashboard();
          fetchActiveTask();
          fetchNotifications();
        }} className="w-full py-3 px-4 bg-[#843D9B] text-white rounded-xl text-xs font-semibold hover:bg-[#722f87] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                        Retry Now
                    </Btn>
                    <Btn onPress={() => {
          useAuthStore.getState().logout();
        }} className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer">
                        Sign In Again
                    </Btn>
                </Box>
            </Box>;
  }
  if (profile.verificationStatus !== 'verified') {
    return <Box className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                <Box className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <Box className="flex">
                        <Box className="flex-shrink-0">
                            <Svg width={20} height={20} viewBox="0 0 20 20" fill="#FACC15">
                                <Path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </Svg>
                        </Box>
                        <Box className="ml-3">
                            <Txt className="text-sm text-yellow-700">
                                Your account is currently <Txt>{profile.verificationStatus || 'pending'}</Txt>. You will be able to receive measurement requests once approved by an admin.
                            </Txt>
                        </Box>
                    </Box>
                </Box>
            </Box>;
  }
  const isOnline = profile?.availabilityStatus === 'online';
  return <>
        <>
            <Box className="flex-1 bg-gray-50 font-sans text-gray-900">
            {/* ── HEADER ── */}
            <Box className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm z-50">
                <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <Box className="w-11 h-11 bg-indigo-50 text-[#843D9B] font-black text-xl rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0 overflow-hidden">
                            {profile?.profilePhoto && profile.profilePhoto !== 'default_profile.png' ? <Img src={profile.profilePhoto.startsWith('http') ? profile.profilePhoto : `${API_URL}${profile.profilePhoto}`} alt={executiveName} className="w-full h-full object-cover" /> : profile?.user?.profileImage && profile.user.profileImage !== 'default_profile.png' ? <Img src={profile.user.profileImage.startsWith('http') ? profile.user.profileImage : `${API_URL}${profile.user.profileImage}`} alt={executiveName} className="w-full h-full object-cover" /> : executiveName.charAt(0).toUpperCase()}
                        </Box>
                        <Box className="flex-1 min-w-0 flex flex-col justify-center">
                            <Txt className="text-[15px] font-black text-gray-900 leading-tight tracking-tight truncate">
                                {executiveName}
                            </Txt>
                            <Box className="flex items-center mt-0.5">
                                <I icon={MapPin} size={10} className="text-[#843D9B] shrink-0 mr-1" />
                                <Txt className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                    {addressName}
                                </Txt>
                                <Btn onPress={handleRefreshLocation} className="ml-1.5 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0 border border-gray-100 flex items-center justify-center">
                                    <I icon={Navigation} size={9} className={`${isFetchingLocation ? 'animate-pulse text-[#843D9B]' : 'text-gray-400'}`} strokeWidth={3} />
                                </Btn>
                            </Box>
                        </Box>
                    </Box>

                    <Box className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Status Toggle */}
                        <Btn onPress={handleToggleStatus} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${isOnline ? 'bg-[#843D9B]/10 border-[#843D9B]/20 text-[#843D9B]' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                            <I icon={Power} size={10} />
                        </Btn>
                        
                        <Btn onPress={() => {
                setShowNotifications(true);
                fetchNotifications();
              }} className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-sm relative shrink-0">
                            <I icon={Bell} size={18} />
                            {unreadCount > 0 && <Box className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[6px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</Box>}
                        </Btn>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Scroll className="flex-1" contentClassName="pb-6" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#843D9B']} />}>
            <Box className="px-4 mt-6 w-full">
                
                {/* Purple Stats Card */}
                <Box className="bg-gradient-to-br from-[#6B2F7E] to-[#843D9B] rounded-[24px] p-6 shadow-xl relative overflow-hidden mb-6">
                    <Box className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <Box className="absolute left-10 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl -mb-10" />
                    
                    <Box className="relative z-10">
                        <Txt className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Today's Earnings</Txt>
                        <Txt className="text-5xl font-black text-white mb-2 tracking-tighter">₹{stats?.todayEarnings || 0}</Txt>
                        <Txt className="text-[11px] font-medium text-white/80 mb-6 max-w-[200px] leading-relaxed">
                            Completed measurements will update your today's earnings immediately.
                        </Txt>
                        
                        <Btn onPress={() => navigate('/executive/wallet')} className="bg-white text-[#843D9B] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full flex items-center gap-1 w-fit shadow-lg shadow-black/10 active:scale-95 transition-transform">
                            VIEW DETAILS <I icon={ChevronRight} size={14} />
                        </Btn>
                    </Box>

                    <Box className="absolute right-6 bottom-6 w-24 h-24 bg-[#5a246b] rounded-2xl rotate-12 opacity-50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        <Box className="w-4 h-4 rounded-full border-2 border-white/20" />
                    </Box>
                    <Box className="absolute right-24 bottom-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg rotate-12">
                        ₹
                    </Box>
                    <Box className="absolute right-4 bottom-20 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-[10px] shadow-lg -rotate-12">
                        ₹
                    </Box>
                </Box>

                {/* Stats Grid */}
                <Box className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex justify-between items-center mb-6">
                    <Box className="flex flex-col items-center gap-1.5 flex-1">
                        <Box className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-1">
                            <I icon={ClipboardList} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Earning</Txt>
                        <Txt className="text-sm font-black text-gray-900">₹{profile?.totalEarned || 0}</Txt>
                        <Txt className="text-[8px] font-bold text-gray-400">Earned</Txt>
                    </Box>

                    <Box className="w-px h-12 bg-gray-100" />

                    <Box className="flex flex-col items-center gap-1.5 flex-1">
                        <Box className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-1">
                            <I icon={AlertCircle} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending</Txt>
                        <Txt className="text-sm font-black text-gray-900">{stats?.totalPending || 0}</Txt>
                        <Txt className="text-[8px] font-bold text-gray-400">Tasks</Txt>
                    </Box>

                    <Box className="w-px h-12 bg-gray-100" />

                    <Box className="flex flex-col items-center gap-1.5 flex-1">
                        <Box className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1">
                            <I icon={TrendingUp} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</Txt>
                        <Txt className="text-sm font-black text-gray-900">{stats?.totalMeasurements || 0}</Txt>
                        <Txt className="text-[8px] font-bold text-gray-400">Tasks</Txt>
                    </Box>

                    <Box className="w-px h-12 bg-gray-100" />

                    <Box className="flex flex-col items-center gap-1.5 flex-1">
                        <Box className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-1">
                            <I icon={CheckCircle} size={18} />
                        </Box>
                        <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</Txt>
                        <Txt className={`text-sm font-black ${isSocketConnected ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {isSocketConnected ? '4.8' : '0.0'}
                        </Txt>
                        <Txt className={`text-[8px] font-bold ${isSocketConnected ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {isSocketConnected ? 'Excellent' : 'Offline'}
                        </Txt>
                    </Box>
                </Box>

                {/* ── MEASUREMENT VIDEO GUIDE BANNER CARD ── */}
                <Btn onPress={() => setShowGuideModal(true)} className="block bg-gradient-to-r from-purple-50 via-indigo-50/40 to-pink-50 border border-purple-100/90 rounded-[24px] p-4 mb-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]">
                    <Box className="flex items-center gap-3.5">
                        <Box className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#843D9B] to-[#6B2F7E] text-white flex items-center justify-center shadow-md shadow-[#843D9B]/25 group-hover:scale-105 transition-transform shrink-0 relative">
                            <I icon={Ruler} size={20} />
                            <Box className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center">
                                <I icon={Play} size={7} className="text-yellow-900 fill-yellow-900 ml-0.5" />
                            </Box>
                        </Box>
                        <Box>
                            <Box className="flex items-center gap-1.5">
                                <Txt className="text-[9px] font-black text-[#843D9B] uppercase tracking-wider bg-purple-100/80 px-2 py-0.5 rounded-md">
                                    Training Video
                                </Txt>
                            </Box>
                            <Txt className="text-sm font-black text-gray-900 mt-1 leading-tight group-hover:text-[#843D9B] transition-colors">
                                Measurement Guide
                            </Txt>
                            <Txt className="text-[10px] font-medium text-gray-500 mt-0.5">
                                Watch standard body measurement techniques
                            </Txt>
                        </Box>
                    </Box>
                    <Box className="w-8 h-8 rounded-full bg-white border border-purple-100 text-[#843D9B] flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#843D9B] group-hover:text-white transition-all ml-2">
                        <I icon={Play} size={12} className="fill-current ml-0.5" />
                    </Box>
                </Btn>

                {/* ── WHITE CLEAN ACTIVE TASK CARD (WHEN TASK IS ACCEPTED) ── */}
                {activeTask ? <Box className="bg-white rounded-[24px] p-6 shadow-md border border-purple-100 text-gray-900 mb-6 space-y-4 animate-in fade-in duration-300">
                        {/* Header Badge */}
                        <Box className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <Box className="flex items-center gap-2">
                                <Box className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></Box>
                                <Txt className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    ACTIVE VISIT IN PROGRESS
                                </Txt>
                            </Box>
                            <Txt className="text-[10px] font-black text-[#843D9B] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                                Order #{activeTask.order?.orderId || activeTask.orderIdStr || 'N/A'}
                            </Txt>
                        </Box>

                        {/* Customer Info Box */}
                        <Box className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                            <Box className="flex justify-between items-start">
                                <Box>
                                    <Txt className="text-base font-black text-gray-900">
                                        {activeTask.customer?.name || activeTask.customerName || 'Customer'}
                                    </Txt>
                                    <Txt className="text-[10px] font-bold text-[#843D9B] uppercase tracking-wider mt-0.5">
                                        EST. EARNINGS: ₹{activeTask.payout || 150}.00
                                    </Txt>
                                </Box>
                                {activeTask.customer?.phoneNumber && <Btn onPress={() => Linking.openURL(`tel:${activeTask.customer.phoneNumber}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all">
                                        <I icon={Phone} size={12} /> Call
                                    </Btn>}
                            </Box>

                            <Box className="flex items-start gap-2 text-gray-600 text-xs mt-2 pt-2 border-t border-gray-200/60">
                                <I icon={MapPin} size={14} className="text-[#843D9B] shrink-0 mt-0.5" />
                                <Txt className="font-medium">{formatAddress(activeTask.customerAddress || activeTask.address)}</Txt>
                            </Box>
                        </Box>

                        {/* Workflow Status Info */}
                        <Box className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                            <Box className="flex items-center gap-2">
                                <I icon={ShieldCheck} size={14} className="text-[#843D9B]" />
                                <Txt>Stage: <Txt className="text-gray-900 font-bold capitalize">{activeTask.status?.replace(/_/g, ' ')}</Txt></Txt>
                            </Box>
                            {activeTask.customerLocation?.coordinates?.length === 2 && <Btn onPress={() => Linking.openURL(`https://www.google.com/maps?q=${activeTask.customerLocation.coordinates[1]},${activeTask.customerLocation.coordinates[0]}`)} className="text-[10px] font-black text-[#843D9B] uppercase tracking-wider flex items-center gap-1 hover:underline">
                                    <I icon={Navigation} size={10} /> Maps
                                </Btn>}
                        </Box>

                        {/* Single Primary Action Button */}
                        <Btn onPress={() => navigate(`/executive/requests/${activeTask._id}`)} className="bg-[#843D9B] hover:bg-[#6B2F7E] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 w-full shadow-lg shadow-[#843D9B]/30 active:scale-95 transition-all mt-2 cursor-pointer">
                            <I icon={Ruler} size={16} /> TASK DETAILS <I icon={ArrowRight} size={16} />
                        </Btn>
                    </Box> : (/* Live Task Action Card (No active accepted task) */
          <Box className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-6">
                        <Box className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-4 rotate-3">
                            <I icon={ClipboardList} size={24} />
                        </Box>
                        {stats?.totalPending > 0 ? <>
                                <Txt className="text-[15px] font-black text-gray-800 mb-1">
                                    You have active tasks, there {stats.totalPending === 1 ? 'is' : 'are'} <Txt className="text-[#843D9B]">{stats.totalPending} pending</Txt> {stats.totalPending === 1 ? 'request' : 'requests'}!
                                </Txt>
                                <Btn onPress={() => navigate('/executive/requests')} className="mt-5 bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-[#843D9B]/30 hover:shadow-xl hover:shadow-[#843D9B]/40 active:scale-95 transition-all">
                                    VIEW LIVE POOL
                                </Btn>
                            </> : <>
                                <Txt className="text-[15px] font-black text-gray-800 mb-1">
                                    You have no active tasks currently.
                                </Txt>
                                <Txt className="text-xs text-gray-500 font-medium mt-1">Keep your status online to receive new requests.</Txt>
                                <Btn onPress={() => navigate('/executive/requests')} className="mt-5 bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-[#843D9B]/30 hover:shadow-xl hover:shadow-[#843D9B]/40 active:scale-95 transition-all">
                                    VIEW LIVE POOL
                                </Btn>
                            </>}
                    </Box>)}

                {/* Verification Warning */}
                {profile?.verificationStatus !== 'verified' && <Box className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <I icon={AlertCircle} className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <Box>
                            <Txt className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Verification Pending</Txt>
                            <Txt className="text-xs font-medium text-amber-700 leading-relaxed">
                                Your account is currently <Txt>{profile?.verificationStatus || 'pending'}</Txt>. You will be able to receive measurement requests once approved by an admin.
                            </Txt>
                        </Box>
                    </Box>}
            </Box>
            </Scroll>
        </Box>
        </>

        {/* Notifications Modal */}
        {showNotifications && <Dialog visible={!!(showNotifications)} onClose={() => setShowNotifications(false)} className={`bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden    h-[80vh] flex flex-col`}>
<Box className="flex-1 flex flex-col overflow-hidden">
                    <Box className="px-8 pt-8 pb-4 border-b border-gray-50 flex items-center justify-between shrink-0">
                        <Box className="flex items-center gap-3">
                            <Box className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                <I icon={Bell} size={20} strokeWidth={2.5} />
                            </Box>
                            <Box>
                                <Txt className="text-xl font-black text-gray-900 tracking-tight leading-none">Notifications</Txt>
                                <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Updates & Alerts</Txt>
                            </Box>
                        </Box>
                        <Btn onPress={() => setShowNotifications(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all shadow-sm">
                            <I icon={X} size={20} />
                        </Btn>
                    </Box>
                    
                    <Scroll contentClassName="p-6" className="flex-1 custom-scrollbar bg-gray-50/30" nestedScrollEnabled>
                        {isLoadingNotifications ? <Box className="flex items-center justify-center h-40">
                                <Spin size={32} className="text-[#843D9B]" />
                            </Box> : notifications.length > 0 ? <Box className="space-y-3">
                                {notifications.map((notif, idx) => <Box key={notif._id || idx} className={`p-4 rounded-2xl border transition-all ${notif.isRead ? 'bg-white border-gray-100' : 'bg-[#843D9B]/5 border-[#843D9B]/20 shadow-sm'}`}>
                                        <Box className="flex gap-3">
                                            <Box className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#843D9B] text-white'}`}>
                                                <I icon={Bell} size={14} />
                                            </Box>
                                            <Box className="flex-1 min-w-0">
                                                <Txt className={`text-sm font-bold ${notif.isRead ? 'text-gray-900' : 'text-[#843D9B]'}`}>{notif.title}</Txt>
                                                <Txt className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</Txt>
                                                <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </Txt>
                                            </Box>
                                            {!notif.isRead && <Box className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />}
                                        </Box>
                                    </Box>)}
                            </Box> : <Box className="flex flex-col items-center justify-center h-60 text-center">
                                <Box className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                    <I icon={Bell} className="w-6 h-6 text-gray-300" />
                                </Box>
                                <Txt className="text-sm font-bold text-gray-900">No Notifications</Txt>
                                <Txt className="text-xs text-gray-500 mt-1">You're all caught up!</Txt>
                            </Box>}
                    </Scroll>
                </Box>
</Dialog>}

        {/* Executive Measurement Guide Modal */}
        <ExecutiveMeasurementGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
        </>;
};
export default Dashboard;
