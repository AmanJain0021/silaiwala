import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Scissors,
    Truck,
    Settings,
    LogOut,
    Bell,
    BarChart3,
    Layers,
    Store,
    Wallet,
    Megaphone,
    Menu,
    X,
    Sparkles,
    Package
} from 'lucide-react';
const silaiwalaLogo = '/sewzella_logo.jpeg';


import useAuthStore from '../store/authStore';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { toast } from 'react-hot-toast';
const AdminLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);

    React.useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('new_order', (data) => {
            setHasUnread(true);
            toast.success(`New Order Received: ${data.orderId || 'Check dashboard'}`, {
                icon: '🛍️',
                position: 'top-right'
            });
        });

        socket.on('order_status_updated', (data) => {
            setHasUnread(true);
            toast(`Order ${data.orderId} updated to ${data.status}`, {
                icon: '🔄',
                position: 'top-right'
            });
        });

        return () => socket.disconnect();
    }, []);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
        { icon: <ShoppingBag size={20} />, label: 'Orders', path: '/admin/orders' },
        { icon: <Package size={20} />, label: 'Bulk Orders', path: '/admin/bulk-orders' },
        { icon: <Scissors size={20} />, label: 'Tailors', path: '/admin/tailors' },
        { icon: <Truck size={20} />, label: 'Delivery', path: '/admin/delivery' },
        { icon: <Users size={20} />, label: 'Customers', path: '/admin/customers' },
        { icon: <Layers size={20} />, label: 'Services', path: '/admin/services' },
        { icon: <Store size={20} />, label: 'Store', path: '/admin/store' },
        { icon: <Wallet size={20} />, label: 'Finance', path: '/admin/finance' },
        { icon: <Megaphone size={20} />, label: 'CMS', path: '/admin/cms' },
        { icon: <BarChart3 size={20} />, label: 'Reports', path: '/admin/reports' },
        { icon: <Sparkles size={20} />, label: 'Style Addons', path: '/admin/style-addons' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
    ];

    const currentPath = location.pathname;
    // Helper to check if a menu item is active (handling exact for dashboard, and prefix for others)
    const isActive = (path) => {
        if (path === '/admin') return currentPath === '/admin';
        return currentPath.startsWith(path);
    };

    return (
        <div className="flex h-screen bg-gray-50 uppercase-none relative overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h1 className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-xl border border-white/10 overflow-hidden shrink-0 transform -rotate-3">
                            <img src={silaiwalaLogo} alt="Silaiwala" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-white leading-none">SewZ<span className="text-white/60">ella</span></span>
                            <span className="tracking-[0.2em] opacity-50 uppercase text-[8px] font-black mt-1">Admin Panel</span>
                        </div>
                    </h1>
                    <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive(item.path)
                                ? 'bg-white text-primary shadow-[0_10px_20px_rgba(0,0,0,0.1)] translate-x-1'
                                : 'text-white/80 hover:text-white hover:bg-black/80'
                                }`}
                        >
                            <span className={`${isActive(item.path) ? 'text-primary' : 'text-white/60 group-hover:text-white'} transition-colors`}>
                                {item.icon}
                            </span>
                            <span className={`font-black tracking-tight text-xs uppercase ${isActive(item.path) ? 'text-primary' : 'group-hover:text-white'}`}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 bg-black">
                    <button
                        onClick={() => {
                            useAuthStore.getState().logout();
                            window.location.href = '/admin/login';
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/5">
                        <LogOut size={20} />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen w-full">
                {/* Header */}
                <header className="h-20 bg-white border-b flex items-center justify-between px-4 lg:px-10 shadow-sm relative z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight hidden sm:block">
                                {menuItems.find(i => isActive(i.path))?.label || 'Admin Control'}
                            </h2>
                            <p className="text-[10px] lg:text-xs text-gray-400 font-medium hidden sm:block">Manage your marketplace operations</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">System Live</span>
                        </div>
                        <button
                            onClick={() => setHasUnread(false)}
                            className="relative p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-all"
                        >
                            <Bell size={20} />
                            {hasUnread && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                            )}
                        </button>
                        <div className="flex items-center gap-3 lg:gap-4 pl-3 lg:pl-6 border-l border-gray-100">
                            <div className="text-right hidden lg:block">
                                <p className="text-xs font-black text-gray-900 leading-none uppercase tracking-tighter">Super Admin</p>
                                <p className="text-[9px] text-[#2D2F6E] font-black uppercase mt-1 tracking-[0.1em]">Full Platform Access</p>
                            </div>
                            <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-2xl bg-[#2D2F6E] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-900/20 shrink-0 border-2 border-white">
                                SA
                            </div>
                            <button
                                onClick={() => {
                                    useAuthStore.getState().logout();
                                    window.location.href = '/admin/login';
                                }}
                                title="Sign Out"
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-1"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
                    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
