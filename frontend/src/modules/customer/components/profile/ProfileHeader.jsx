import React, { useState } from 'react';
import { Camera, QrCode, Bell, Settings, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SOCKET_URL } from '../../../../config/constants';
import useBrandingStore from '../../../../store/brandingStore';

const ProfileHeader = ({ user, stats }) => {
    const [imgError, setImgError] = useState(false);
    const appName = useBrandingStore(state => state.appName);

    const getProfileImageSrc = (raw) => {
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

    return (
        <div className="relative pt-6 md:pt-10 px-4 md:px-6 pb-20 md:pb-24 flex flex-col w-full max-w-[412px] mx-auto rounded-b-[2rem] bg-[#843D9B]">
            {/* Background Texture (Subtle) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 rounded-b-[2rem]" />
            
            <div className="relative z-10 w-full">
                {/* Second Row: Avatar, Info, Progress */}
                <div className="flex flex-row items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-white/10 flex items-center justify-center">
                            {imgSrc && !imgError ? (
                                <img 
                                    src={imgSrc} 
                                    alt={user?.name || 'User'} 
                                    className="w-full h-full object-cover" 
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-2xl font-black text-white">{firstName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 -right-1 bg-[#843D9B] border-2 border-white text-white p-1 rounded-full shadow-sm">
                            <Camera size={10} />
                        </div>
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h2 className="text-base font-bold text-white tracking-tight truncate">{user?.name || 'Customer'}</h2>
                        <p className="text-[10px] md:text-[11px] font-medium text-white/80 mb-1.5 truncate">{formattedPhone}</p>
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white text-green-600 text-[7px] md:text-[8px] font-bold uppercase tracking-wider rounded-sm shadow-sm whitespace-nowrap">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 text-white flex items-center justify-center text-[5px]">✓</span>
                                VERIFIED ACCOUNT
                            </span>
                            <span className="px-1.5 py-0.5 bg-white text-[#843D9B] text-[7px] md:text-[8px] font-bold uppercase tracking-wider rounded-sm shadow-sm whitespace-nowrap">
                                ELITE MEMBER
                            </span>
                        </div>
                    </div>

                    {/* Right Info (Profile Complete & Edit) */}
                    <div className="flex flex-col items-end justify-center shrink-0 w-[100px] md:w-[110px]">
                        <div className="w-full flex justify-between items-center mb-1">
                            <span className="text-[8px] md:text-[9px] font-medium text-white/90">Profile Complete</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-white">85%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full mb-2.5 overflow-hidden">
                            <div className="h-full bg-white rounded-full w-[85%]"></div>
                        </div>
                        <Link to="/user/profile/edit" className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/40 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all">
                            <Edit3 size={10} />
                            <span className="text-[9px] font-bold">Edit Profile</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid (Absolute positioned overlapping the bottom) */}
            <div className="absolute left-4 right-4 -bottom-10 z-20">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex justify-between items-center p-3 md:p-4">
                    <div className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center mb-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#843D9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        </div>
                        <span className="text-sm font-black text-gray-900">{stats?.totalOrders || 0}</span>
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">Total Orders</span>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center mb-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                        <span className="text-sm font-black text-gray-900">{stats?.reviewsGiven || 0}</span>
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">Reviews Given</span>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 border-r border-gray-100 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center mb-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </div>
                        <span className="text-sm font-black text-gray-900">{stats?.savedDesigns || 0}</span>
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">Saved Designs</span>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center mb-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                        </div>
                        <span className="text-sm font-black text-gray-900">{stats?.rewardPoints || 0}</span>
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">Reward Points</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
