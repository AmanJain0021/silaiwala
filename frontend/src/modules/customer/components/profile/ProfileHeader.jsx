import React from 'react';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileHeader = ({ user, stats }) => {
    return (
        <div className="relative mb-4">
            {/* Background Pattern */}
            <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-[#843D9B] md:rounded-b-3xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>

            <div className="relative pt-8 md:pt-12 px-6 flex flex-col items-center">
                {/* Avatar with Edit Badge */}
                <div className="relative mb-3 group">
                    <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden bg-gray-50 flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
                        {user?.profileImage && user.profileImage !== 'default_profile.png' ? (
                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-black text-[#843D9B] italic">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <Link to="/user/profile/edit" className="absolute -bottom-0.5 -right-0.5 bg-gray-900 text-white p-1.5 rounded-xl shadow-lg hover:bg-[#843D9B] transition-all transform hover:scale-110">
                        <Camera size={12} />
                    </Link>
                </div>

                {/* Name & Role */}
                <h2 className="text-xl font-black text-gray-900 mb-1 tracking-tight italic">{user?.name || 'Guest User'}</h2>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-green-100 italic">
                        Verified Account
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-[#843D9B] text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 italic">
                        Elite Member
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-sm md:max-w-lg mt-4 pb-2">
                    <div className="bg-white py-3 px-1 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#843D9B]/20 transition-all">
                        <span className="block text-lg font-black text-gray-900 group-hover:text-[#843D9B] transition-colors">{stats?.totalOrders || 0}</span>
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1">Orders</span>
                    </div>
                    <div className="bg-white py-3 px-1 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#843D9B]/20 transition-all">
                        <span className="block text-lg font-black text-gray-900 group-hover:text-[#843D9B] transition-colors">{stats?.pendingOrders || 0}</span>
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1 text-orange-400">Live</span>
                    </div>
                    <div className="bg-white py-3 px-1 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#843D9B]/20 transition-all">
                        <span className="block text-lg font-black text-gray-900 group-hover:text-green-600 transition-colors">₹{stats?.savedAmount || 0}</span>
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1 text-green-500">Saved</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
