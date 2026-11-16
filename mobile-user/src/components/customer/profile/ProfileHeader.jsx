// Port of modules/customer/components/profile/ProfileHeader.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../../../lib/nav';
import React, { useState } from "react";
import { Camera, QrCode, Bell, Settings, Edit3, ShoppingBag, Star, Heart, Gift } from "lucide-react-native";
import { SOCKET_URL } from "../../../lib/config";
import useBrandingStore from "../../../store/brandingStore";
import { Box, Img, Txt, I, Btn, Scroll } from '../../ui/primitives';
const ProfileHeader = ({
  user,
  stats
}) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const appName = useBrandingStore(state => state.appName);
  const getProfileImageSrc = raw => {
    if (!raw || typeof raw !== 'string' || raw === 'default_profile.png') return null;
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    const base = SOCKET_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`;
  };
  const imgSrc = getProfileImageSrc(user?.profileImage);

  // Format phone
  const formattedPhone = (() => {
    const p = user?.phone || user?.phoneNumber || '';
    const cleaned = ('' + p).replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    return p || 'Add Phone Number';
  })();
  const firstName = (user?.name || user?.email || 'Customer').split(' ')[0];
  return <Box className="relative pt-6 md:pt-10 px-4 md:px-6 pb-20 md:pb-24 flex flex-col w-full max-w-[412px] mx-auto rounded-b-[2rem] bg-[#843D9B]">
            {/* Background Texture (Subtle) */}
            
            <Box className="relative z-10 w-full">
                {/* Second Row: Avatar, Info, Progress */}
                <Box className="flex flex-row items-center gap-3">
                    {/* Avatar */}
                    <Box className="relative shrink-0">
                        <Box className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-white/10 flex items-center justify-center">
                            {imgSrc && !imgError ? <Img src={imgSrc} alt={user?.name || 'User'} className="w-full h-full object-cover" /> : <Txt className="text-2xl font-black text-white">{firstName.charAt(0).toUpperCase()}</Txt>}
                        </Box>
                        <Box className="absolute bottom-0 -right-1 bg-[#843D9B] border-2 border-white text-white p-1 rounded-full shadow-sm">
                            <I icon={Camera} size={10} />
                        </Box>
                    </Box>

                    {/* Middle Info */}
                    <Box className="flex-1 min-w-0 flex flex-col justify-center">
                        <Txt className="text-base font-bold text-white tracking-tight truncate">{user?.name || 'Customer'}</Txt>
                        <Txt className="text-[10px] md:text-[11px] font-medium text-white/80 mb-1.5 truncate">{formattedPhone}</Txt>
                        <Box className="flex flex-wrap items-center gap-1">
                            <Txt className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white text-green-600 text-[7px] md:text-[8px] font-bold uppercase tracking-wider rounded-sm shadow-sm whitespace-nowrap">
                                <Txt className="w-2.5 h-2.5 rounded-full bg-green-500 text-white flex items-center justify-center text-[5px]">✓</Txt>
                                VERIFIED ACCOUNT
                            </Txt>
                            <Txt className="px-1.5 py-0.5 bg-white text-[#843D9B] text-[7px] md:text-[8px] font-bold uppercase tracking-wider rounded-sm shadow-sm whitespace-nowrap">
                                ELITE MEMBER
                            </Txt>
                        </Box>
                    </Box>

                    {/* Right Info (Profile Complete & Edit) */}
                    <Box className="flex flex-col items-end justify-center shrink-0 w-[100px] md:w-[110px]">
                        <Box className="w-full flex justify-between items-center mb-1">
                            <Txt className="text-[8px] md:text-[9px] font-medium text-white/90">Profile Complete</Txt>
                            <Txt className="text-[9px] md:text-[10px] font-bold text-white">85%</Txt>
                        </Box>
                        <Box className="w-full h-1.5 bg-white/20 rounded-full mb-2.5 overflow-hidden">
                            <Box className="h-full bg-white rounded-full w-[85%]"></Box>
                        </Box>
                        <Btn onPress={() => navigate("/user/profile/edit")} className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/40 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all">
                            <I icon={Edit3} size={10} />
                            <Txt className="text-[9px] font-bold">Edit Profile</Txt>
                        </Btn>
                    </Box>
                </Box>
            </Box>

            {/* Stats Grid (Absolute positioned overlapping the bottom) */}
            <Box className="absolute left-4 right-4 -bottom-10 z-20">
                <Box className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex justify-between items-center p-3 md:p-4">
                    <Box className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <Box className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center mb-1.5">
                            <I icon={ShoppingBag} size={28} color="#843D9B" />
                        </Box>
                        <Txt className="text-sm font-black text-gray-900">{stats?.totalOrders || 0}</Txt>
                        <Txt className="text-[8px] md:text-[9px] text-gray-500 font-medium">Total Orders</Txt>
                    </Box>
                    <Box className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <Box className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center mb-1.5">
                            <I icon={Star} size={28} color="#f97316" />
                        </Box>
                        <Txt className="text-sm font-black text-gray-900">{stats?.reviewsGiven || 0}</Txt>
                        <Txt className="text-[8px] md:text-[9px] text-gray-500 font-medium">Reviews Given</Txt>
                    </Box>
                    <Box className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <Box className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center mb-1.5">
                            <I icon={Heart} size={28} color="#e11d48" />
                        </Box>
                        <Txt className="text-sm font-black text-gray-900">{stats?.savedDesigns || 0}</Txt>
                        <Txt className="text-[8px] md:text-[9px] text-gray-500 font-medium">Saved Designs</Txt>
                    </Box>
                    <Box className="flex flex-col items-center justify-center flex-1">
                        <Box className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center mb-1.5">
                            <I icon={Gift} size={28} color="#16a34a" />
                        </Box>
                        <Txt className="text-sm font-black text-gray-900">{stats?.rewardPoints || 0}</Txt>
                        <Txt className="text-[8px] md:text-[9px] text-gray-500 font-medium">Reward Points</Txt>
                    </Box>
                </Box>
            </Box>
        </Box>;
};
export default ProfileHeader;
