import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, ShoppingBag, ClipboardList, User } from 'lucide-react';
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
            className="flex flex-col items-center gap-0.5 relative min-w-[56px] py-0.5"
        >
            {isActive && (
                <motion.span 
                    layoutId="customerBottomNavActive"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#843D9B] rounded-full" 
                />
            )}
            <div className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center relative ${
                isActive
                    ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/25 scale-105'
                    : 'text-gray-400 active:scale-90'
            }`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive ? 'text-[#843D9B]' : 'text-gray-400'
            }`}>
                {label}
            </span>
        </Link>
    );
};

const BottomNav = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-2xl pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] px-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
                <NavItem to="/user" icon={Shirt} label="Services" />
                <NavItem to="/user/store" icon={ShoppingBag} label="Store" />
                <NavItem to="/user/orders" icon={ClipboardList} label="Orders" />
                <NavItem to="/user/profile" icon={User} label="Profile" />
            </div>
        </nav>
    );
};

export default BottomNav;
