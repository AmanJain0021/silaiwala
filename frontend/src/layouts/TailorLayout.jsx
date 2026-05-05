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
const silaiwalaLogo = '/sewzella_logo.jpeg';
import AppContainer from '../components/Common/AppContainer';
import { useTailorAuth } from '../modules/tailor/context/AuthContext';

const TailorLayout = () => {
    const location = useLocation();
    const { user, status } = useTailorAuth();
    const isOverview = location.pathname === '/partner';

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Home', path: '/partner' },
        { icon: <ClipboardList size={20} />, label: 'Orders', path: '/partner/orders' },
        { icon: <Wallet size={20} />, label: 'Wallet', path: '/partner/wallet' },
        { icon: <ShoppingBag size={20} />, label: 'Products', path: '/partner/products' },
        { icon: <UserCircle size={20} />, label: 'Profile', path: '/partner/settings' },
    ];

    return (
        <AppContainer>
            {/* Top Header — light theme */}
            {(!isOverview && location.pathname !== '/partner/settings' && location.pathname !== '/partner/wallet' && location.pathname !== '/partner/earnings') && (
                <div className="sticky top-0 z-10 w-full">
                    <header className="bg-white border-b border-gray-100 pt-5 pb-4 px-5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                                <img src={silaiwalaLogo} alt="Silaiwala" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none">
                                    {menuItems.find(i => i.path === location.pathname)?.label || 'SewZella'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#2D2F6E]' : 'bg-orange-400'}`}></span>
                                    <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest leading-none">{status}</span>
                                </div>
                            </div>
                        </div>
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-2xl bg-[#2D2F6E] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#2D2F6E]/25">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                    </header>
                </div>
            )}

            {/* Main Content — light bg */}
            <main className={`flex-1 overflow-y-auto bg-[#F5F5F5] custom-scrollbar pb-24 ${(isOverview || location.pathname === '/partner/settings') ? '' : 'px-4 pt-4'}`}>
                <Outlet />
            </main>

            {/* ── BOTTOM NAVIGATION (UNCHANGED) ── */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-[#0A0A0A] border-t border-[#1C1C1C] px-2 py-2 flex items-center justify-around z-20 shadow-[0_-4px_30px_rgba(0,0,0,0.6)]">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center gap-1 relative min-w-[52px]"
                        >
                            {isActive && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#2D2F6E] rounded-full" />
                            )}
                            <div className={`p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                                isActive
                                    ? 'bg-[#2D2F6E] text-white shadow-lg shadow-[#2D2F6E]/30'
                                    : 'text-[#555555] hover:text-[#888888]'
                            }`}>
                                {React.cloneElement(item.icon, {
                                    size: 20,
                                    strokeWidth: isActive ? 2.5 : 1.8
                                })}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${
                                isActive ? 'text-[#2D2F6E]' : 'text-[#444444]'
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </AppContainer>
    );
};

export default TailorLayout;
