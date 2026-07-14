import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    
    let isActive = false;
    if (to === '/user') {
        isActive = location.pathname === '/user' || location.pathname.startsWith('/user/services') || location.pathname.startsWith('/user/embellishments');
    } else {
        isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    }

    return (
        <Link
            to={to}
            className="flex flex-col items-center gap-1 relative min-w-[64px] py-1"
        >
            {isActive && (
                <motion.span 
                    layoutId="customerBottomNavActive"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#843D9B] rounded-full" 
                />
            )}
            <div className={`p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                isActive
                    ? 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/30 scale-110'
                    : 'text-gray-400 active:scale-90'
            }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive ? 'text-[#843D9B]' : 'text-gray-400'
            }`}>
                {label}
            </span>
        </Link>
    );
};

const BottomNav = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between w-full max-w-md mx-auto relative">
                <NavItem to="/user" icon={Shirt} label="Services" />
                <NavItem to="/user/store" icon={ShoppingBag} label="Store" />
                <NavItem to="/user/orders" icon={ClipboardList} label="Orders" />
                <NavItem to="/user/profile" icon={User} label="Profile" />
            </div>
        </nav>
    );
};

export default BottomNav;
