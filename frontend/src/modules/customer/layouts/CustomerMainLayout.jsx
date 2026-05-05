import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shirt, ShoppingBag, ClipboardList, User, Search, Bell } from 'lucide-react';
import silaiwalaLogo from '/sewzella_logo.jpeg';
import useCartStore from '../../../store/cartStore';
import useAuthStore from '../../../store/authStore';

const CustomerMainLayout = () => {
    const location = useLocation();
    const cartCount = useCartStore(state => state.getTotalItems());
    const user = useAuthStore(state => state.user);

    const navItems = [
        { to: '/', icon: Shirt, label: 'Services' },
        { to: '/store', icon: ShoppingBag, label: 'Store' },
        { to: '/orders', icon: ClipboardList, label: 'Orders' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans">
            {/* Desktop Navbar - Only visible on md and up */}
            <header className="hidden md:block sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-gray-50 rotate-3 group-hover:rotate-0 transition-transform">
                            <img src={silaiwalaLogo} alt="SewZella" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black text-gray-900 leading-none tracking-tight">
                                SewZ<span className="text-[#2D2F6E]">ella</span>
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Modern Stitching</p>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest transition-all ${
                                        isActive 
                                            ? 'bg-[#2D2F6E] text-white shadow-lg shadow-[#2D2F6E]/20' 
                                            : 'text-gray-500 hover:text-[#2D2F6E] hover:bg-indigo-50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all relative">
                            <Search size={20} />
                        </button>
                        <Link to="/cart" className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all relative">
                            <ShoppingBag size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#2D2F6E] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-md">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/profile" className="flex items-center gap-3 pl-2 border-l border-gray-100 ml-2">
                            <div className="w-10 h-10 rounded-xl border-2 border-[#2D2F6E]/10 p-0.5 overflow-hidden shadow-sm hover:border-[#2D2F6E]/30 transition-all">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                                    className="w-full h-full object-cover bg-gray-100 rounded-lg"
                                    alt="User"
                                />
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-xs font-black text-gray-900 leading-none">{user?.name || 'Guest'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Account</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default CustomerMainLayout;
