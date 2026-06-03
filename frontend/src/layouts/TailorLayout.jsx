import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    ShoppingBag,
    Truck,
    FileCheck,
    CreditCard,
    UserCircle,
    Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
const silaiwalaLogo = '/sewzella_logo.jpeg';
import { useTailorAuth } from '../modules/tailor/context/AuthContext';

const TailorLayout = () => {
    const location = useLocation();
    const { user, status } = useTailorAuth();
    const isOverview = location.pathname === '/partner';

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Home', path: '/partner' },
        { icon: <ClipboardList size={20} />, label: 'Orders', path: '/partner/orders' },
        { icon: <Wallet size={20} />, label: 'Wallet', path: '/partner/wallet' },
        { icon: <ShoppingBag size={20} />, label: 'Services', path: '/partner/products' },
        { icon: <UserCircle size={20} />, label: 'Profile', path: '/partner/settings' },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex font-sans selection:bg-[#2D2F6E] selection:text-white">
            {/* ── SIDEBAR (DESKTOP ONLY) ── */}
            <aside className="hidden md:flex flex-col w-72 bg-[#0A0A0A] border-r border-[#1C1C1C] sticky top-0 h-screen z-50">
                <div className="p-8">
                    <Link to="/partner" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden border border-gray-800 rotate-3 group-hover:rotate-0 transition-transform">
                            <img src={silaiwalaLogo} alt="SewZella" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white leading-none tracking-tight">
                                SewZ<span className="text-[#2D2F6E]">ella</span>
                            </h1>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Partner Portal</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    isActive 
                                        ? 'bg-[#2D2F6E] text-white shadow-xl shadow-[#2D2F6E]/20' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <div className="bg-[#1C1C1C] rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#2D2F6E]/10 rounded-full blur-2xl group-hover:bg-[#2D2F6E]/20 transition-all"></div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-[#2D2F6E] flex items-center justify-center text-white font-black text-sm shadow-md">
                                {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate">{user?.name || 'Partner'}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#2D2F6E]' : 'bg-orange-400'} animate-pulse`}></span>
                                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest leading-none">{status}</span>
                                </div>
                            </div>
                        </div>
                        <Link to="/partner/settings" className="block w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-center text-gray-400 uppercase tracking-widest border border-white/5 transition-all">
                            Manage Shop
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile Header */}
                {(!isOverview && location.pathname !== '/partner/settings' && location.pathname !== '/partner/wallet' && location.pathname !== '/partner/earnings') && (
                    <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 pt-5 pb-4 px-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                <img src={silaiwalaLogo} alt="SewZella" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none capitalize">
                                    {menuItems.find(i => i.path === location.pathname)?.label || 'SewZella'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#2D2F6E]' : 'bg-orange-400'}`}></span>
                                    <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest leading-none">{status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-9 w-9 rounded-2xl bg-[#2D2F6E] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-[#2D2F6E]/20">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                    </header>
                )}

                <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 ${
                    (isOverview || location.pathname === '/partner/settings' || location.pathname === '/partner/wallet' || location.pathname === '/partner/earnings') 
                        ? 'p-0' 
                        : 'p-4 md:p-8 lg:p-10'
                }`}>
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>

                {/* ── BOTTOM NAVIGATION (MOBILE ONLY) ── */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1C1C1C] px-2 py-2 flex items-center justify-around z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex flex-col items-center gap-1 relative min-w-[56px] py-1"
                            >
                                {isActive && (
                                    <motion.span 
                                        layoutId="bottomNavActive"
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2D2F6E] rounded-full" 
                                    />
                                )}
                                <div className={`p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                                    isActive
                                        ? 'bg-[#2D2F6E] text-white shadow-lg shadow-[#2D2F6E]/30 scale-110'
                                        : 'text-[#555555] active:scale-90'
                                }`}>
                                    {React.cloneElement(item.icon, {
                                        size: 20,
                                        strokeWidth: isActive ? 2.5 : 2
                                    })}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
                                    isActive ? 'text-[#2D2F6E]' : 'text-[#444444]'
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default TailorLayout;
