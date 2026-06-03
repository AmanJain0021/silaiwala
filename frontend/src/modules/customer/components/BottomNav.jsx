import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { cn } from '../../../utils/cn';

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
            className={cn(
                "flex flex-col items-center justify-center p-2 w-full transition-colors relative",
                isActive ? "text-[#2D2F6E]" : "text-gray-400 hover:text-gray-600"
            )}
        >
            <Icon className={cn("h-6 w-6 mb-1 transition-all duration-300", isActive && "fill-current scale-110")} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn("text-[10px] font-medium transition-all", isActive ? "font-bold" : "")}>{label}</span>
            {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-[#2D2F6E] rounded-full animate-bounce" />
            )}
        </Link>
    );
};

const BottomNav = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pb-safe pt-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
            <div className="flex justify-between max-w-md mx-auto relative">
                <NavItem to="/user" icon={Shirt} label="Services" />
                <NavItem to="/user/store" icon={ShoppingBag} label="Store" />
                <NavItem to="/user/orders" icon={ClipboardList} label="Orders" />
                <NavItem to="/user/profile" icon={User} label="Profile" />
            </div>
        </div>
    );
};

export default BottomNav;
