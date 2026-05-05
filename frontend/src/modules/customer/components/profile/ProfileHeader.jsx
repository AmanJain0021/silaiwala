import React from 'react';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileHeader = ({ user, stats }) => {
    return (
        <div className="relative mb-6">
            {/* Background Pattern */}
            <div className="absolute inset-x-0 top-0 h-32 bg-[#2D2F6E] rounded-b-[2.5rem] overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>

            <div className="relative pt-16 px-6 flex flex-col items-center">
                {/* Avatar with Edit Badge */}
                <div className="relative mb-4 group scale-110">
                    <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden bg-gray-50 flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
                        {user?.profileImage && user.profileImage !== 'default_profile.png' ? (
                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-black text-[#2D2F6E] italic">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <Link to="/profile/edit" className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-2 rounded-xl shadow-lg hover:bg-[#2D2F6E] transition-all transform hover:scale-110">
                        <Camera size={14} />
                    </Link>
                </div>

                {/* Name & Role */}
                <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight italic">{user?.name || 'Guest User'}</h2>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-green-100 italic">
                        Verified Account
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-[#2D2F6E] text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 italic">
                        Elite Member
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-8 pb-4">
                    <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#2D2F6E]/20 transition-all">
                        <span className="block text-xl font-black text-gray-900 group-hover:text-[#2D2F6E] transition-colors">{stats?.totalOrders || 0}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1">Orders</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#2D2F6E]/20 transition-all">
                        <span className="block text-xl font-black text-gray-900 group-hover:text-[#2D2F6E] transition-colors">{stats?.pendingOrders || 0}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1 text-orange-400">Live</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center group hover:border-[#2D2F6E]/20 transition-all">
                        <span className="block text-xl font-black text-gray-900 group-hover:text-green-600 transition-colors">₹{stats?.savedAmount || 0}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mt-1 text-green-500">Saved</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
