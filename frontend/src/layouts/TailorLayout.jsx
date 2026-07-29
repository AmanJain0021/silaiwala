import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    ShoppingBag,
    Truck,
    FileCheck,
    CreditCard,
    UserCircle,
    Wallet,
    Ruler,
    Wand2,
    AlertTriangle,
    Bell,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
const silaiwalaLogo = '/sewzella_logo.jpeg';
import { useTailorAuth } from '../modules/tailor/context/AuthContext';
import { useNotifications } from '../modules/tailor/context/NotificationContext';
import api from '../modules/tailor/services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { getToken } from '../utils/auth';

const TailorLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, status } = useTailorAuth();
    const notificationContext = useNotifications();
    const unreadCount = notificationContext?.unreadCount || 0;
    const isOverview = location.pathname === '/partner' || location.pathname === '/partner/';
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

    // ── PULL-TO-REFRESH STATE FOR ALL TAILOR PAGES ──
    const mainRef = useRef(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartRef = useRef({ y: 0, active: false });

    // ── VIRTUAL KEYBOARD DETECTION FOR MOBILE FOOTER ──
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                const isShort = window.visualViewport.height < window.innerHeight - 140;
                setIsKeyboardOpen(isShort);
            }
        };

        const handleFocusIn = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
                setIsKeyboardOpen(true);
            }
        };

        const handleFocusOut = () => {
            setTimeout(() => {
                const activeTag = document.activeElement?.tagName?.toLowerCase();
                if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select' && !document.activeElement?.isContentEditable) {
                    setIsKeyboardOpen(false);
                }
            }, 100);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const handleTouchStart = (e) => {
        if (!mainRef.current) return;
        if (mainRef.current.scrollTop <= 2) {
            touchStartRef.current = {
                y: e.touches[0].clientY,
                active: true
            };
        } else {
            touchStartRef.current.active = false;
        }
    };

    const handleTouchMove = (e) => {
        if (!touchStartRef.current.active || !mainRef.current || isRefreshing) return;
        if (mainRef.current.scrollTop > 2) {
            touchStartRef.current.active = false;
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartRef.current.y;

        if (diff > 0) {
            const distance = Math.min(diff * 0.45, 90);
            setPullDistance(distance);
        } else {
            setPullDistance(0);
        }
    };

    const handleTouchEnd = () => {
        if (!touchStartRef.current.active) return;
        touchStartRef.current.active = false;

        if (pullDistance >= 60 && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(60);
            setTimeout(() => {
                // Hard reload at exact current URL location to stay on the same page
                window.location.reload();
            }, 300);
        } else {
            setPullDistance(0);
        }
    };

    useEffect(() => {
        const userId = user?._id || user?.id;
        if (!userId) return;
        
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/tailors/dashboard');
                if (response.data.success && response.data.data.summary) {
                    setPendingOrdersCount(response.data.data.summary.pendingOrders || 0);
                }
            } catch (error) {
                console.error("Failed to fetch pending orders count:", error);
            }
        };

        fetchDashboardData();

        const token = getToken();
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true
        });

        socket.on('connect', () => {
            socket.emit('join_user_room', String(userId));
        });

        const refreshPendingCount = () => {
            fetchDashboardData();
        };

        socket.on('new_order', refreshPendingCount);
        socket.on('receive_new_order', refreshPendingCount);
        // Accept/cancel must immediately update the New-order badge too.
        socket.on('order_status_updated', refreshPendingCount);

        return () => {
            socket.off('new_order', refreshPendingCount);
            socket.off('receive_new_order', refreshPendingCount);
            socket.off('order_status_updated', refreshPendingCount);
            socket.disconnect();
        };
    }, [user?._id, user?.id]);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Home', path: '/partner' },
        { icon: <ClipboardList size={20} />, label: 'Orders', path: '/partner/orders', badge: pendingOrdersCount },
        { icon: <Ruler size={20} />, label: 'Alterations', mobileLabel: 'Alt.', path: '/partner/alterations' },
        { icon: <Wand2 size={20} />, label: 'Custom Designs', mobileLabel: 'Custom', path: '/partner/custom-designs' },
        { icon: <AlertTriangle size={20} />, label: 'Issues', path: '/partner/issues' },
        { icon: <Wallet size={20} />, label: 'Wallet', path: '/partner/wallet' },
        { icon: <ShoppingBag size={20} />, label: 'Services', path: '/partner/products' },
        { icon: <UserCircle size={20} />, label: 'Profile', path: '/partner/settings' },
    ];

    return (
        <div className="h-screen w-full bg-[#F5F5F5] flex font-sans selection:bg-[#843D9B] selection:text-white overflow-hidden">
            {/* ── SIDEBAR (DESKTOP ONLY) ── */}
            <aside className="hidden md:flex flex-col w-72 bg-[#0A0A0A] border-r border-[#1C1C1C] h-screen shrink-0 z-50">
                <div className="p-8">
                    <Link to="/partner" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden border border-gray-800 rotate-3 group-hover:rotate-0 transition-transform">
                            <img src={silaiwalaLogo} alt="SewZella" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white leading-none tracking-tight">
                                SewZ<span className="text-[#843D9B]">ella</span>
                            </h1>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Partner Portal</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    isActive 
                                        ? 'bg-[#843D9B] text-white shadow-xl shadow-[#843D9B]/20' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                                <span className="flex-1">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="h-5 min-w-[20px] px-1.5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-rose-500/20">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <div className="bg-[#1C1C1C] rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#843D9B]/10 rounded-full blur-2xl group-hover:bg-[#843D9B]/20 transition-all"></div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-[#843D9B] flex items-center justify-center text-white font-black text-sm shadow-md">
                                {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate">{user?.name || 'Partner'}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#843D9B]' : 'bg-orange-400'} animate-pulse`}></span>
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
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* ── MOBILE TOP HEADER ── */}
                <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-sm">
                    <Link to="/partner" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#0A0A0A] rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 shrink-0">
                            <img src={silaiwalaLogo} alt="SewZella" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-gray-900 leading-none tracking-tight">
                                SewZ<span className="text-[#843D9B]">ella</span>
                            </h1>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Partner Portal</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        {status && (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                <span className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#843D9B]' : 'bg-orange-400'} animate-pulse`}></span>
                                <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{status}</span>
                            </div>
                        )}
                        <Link 
                            to="/partner/notifications" 
                            className="p-2 text-gray-600 hover:text-[#843D9B] hover:bg-gray-50 rounded-xl transition-all relative border border-gray-100 flex items-center justify-center"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black text-white shadow-sm z-10">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/partner/settings" className="w-8 h-8 rounded-xl bg-[#843D9B] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#843D9B]/20 border border-white shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </Link>
                    </div>
                </header>

                {/* Pull to Refresh Mobile Indicator Banner */}
                {(pullDistance > 0 || isRefreshing) && (
                    <div 
                        className="md:hidden fixed top-16 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform duration-75"
                        style={{ transform: `translateY(${Math.min(pullDistance * 0.7, 45)}px)` }}
                    >
                        <div className="bg-[#843D9B] text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 backdrop-blur-md animate-fadeIn">
                            <RefreshCw size={15} className={`${isRefreshing || pullDistance >= 60 ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                {isRefreshing ? 'Refreshing Page...' : pullDistance >= 60 ? 'Release to Refresh' : 'Pull Down to Refresh'}
                            </span>
                        </div>
                    </div>
                )}



                <main 
                    ref={mainRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 flex flex-col min-h-0 ${
                    (isOverview || location.pathname === '/partner/settings' || location.pathname === '/partner/wallet' || location.pathname === '/partner/earnings') 
                        ? 'p-0' 
                        : 'p-0 md:p-8 lg:p-10'
                }`}>
                    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative min-h-0">
                        {/* ── SUB-NAVIGATION FOR ORDERS SECTION ── */}
                        {['/partner/orders', '/partner/shop-orders', '/partner/alterations', '/partner/custom-designs', '/partner/issues'].includes(location.pathname) && (
                            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 pt-3 pb-3 flex gap-3 overflow-x-auto scrollbar-hide shrink-0 sticky top-0 z-30 shadow-sm">
                                {[
                                    { path: '/partner/orders', label: 'Stitching' },
                                    { path: '/partner/shop-orders', label: 'Shop' },
                                    { path: '/partner/alterations', label: 'Alterations' },
                                    { path: '/partner/custom-designs', label: 'Custom' },
                                    { path: '/partner/issues', label: 'Issues' },
                                ].map((tab) => (
                                    <Link 
                                        key={tab.path} 
                                        to={tab.path} 
                                        className={`whitespace-nowrap text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm ${
                                            location.pathname === tab.path 
                                                ? 'bg-[#843D9B] text-white shadow-[#843D9B]/20' 
                                                : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                        
                        <div className={`flex-1 pb-24 md:pb-12 ${['/partner/orders', '/partner/shop-orders', '/partner/alterations', '/partner/custom-designs', '/partner/issues'].includes(location.pathname) ? 'p-4' : ''}`}>
                            <Outlet />
                        </div>
                    </div>
                </main>

                {/* ── BOTTOM NAVIGATION (MOBILE ONLY) ── */}
                {!isKeyboardOpen && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] animate-fadeIn">
                        {menuItems.filter(item => !['/partner/alterations', '/partner/custom-designs', '/partner/issues'].includes(item.path)).map((item) => {
                            const isOrderSection = ['/partner/orders', '/partner/shop-orders', '/partner/alterations', '/partner/custom-designs', '/partner/issues'].includes(location.pathname);
                            const isActive = location.pathname === item.path || (item.path === '/partner/orders' && isOrderSection);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex flex-col items-center gap-1 relative min-w-[56px] py-1"
                                >
                                    {isActive && (
                                        <motion.span 
                                            layoutId="bottomNavActive"
                                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#843D9B] rounded-full" 
                                        />
                                    )}
                                    <div className={`p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                                        isActive
                                            ? 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/30 scale-110'
                                            : 'text-gray-400 active:scale-90'
                                    }`}>
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] px-1 bg-rose-500 rounded-full border-[1.5px] border-white flex items-center justify-center text-[7px] font-black text-white shadow-sm z-10">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                        {React.cloneElement(item.icon, {
                                            size: 20,
                                            strokeWidth: isActive ? 2.5 : 2
                                        })}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        isActive ? 'text-[#843D9B]' : 'text-gray-400'
                                    }`}>
                                        {item.mobileLabel || item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
};

export default TailorLayout;
