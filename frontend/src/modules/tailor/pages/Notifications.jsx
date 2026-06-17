import React from 'react';
import { ArrowLeft, Bell, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, markAsRead, loading } = useNotifications();

    const getRelativeTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_CREATED':
                return { icon: <ShoppingBag size={18} />, bg: 'bg-emerald-500/10', color: 'text-emerald-400' };
            case 'ORDER_STATUS_UPDATED':
                return { icon: <Bell size={18} />, bg: 'bg-[#843D9B]/10', color: 'text-[#843D9B]' };
            case 'SYSTEM_NOTICE':
                return { icon: <AlertCircle size={18} />, bg: 'bg-amber-500/10', color: 'text-amber-400' };
            default:
                return { icon: <Bell size={18} />, bg: 'bg-white/5', color: 'text-white/25' };
        }
    };

    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white">

            {/* ── MOBILE HEADER ── */}
            <div className="md:hidden bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1.5 -ml-2 text-gray-400 hover:text-[#843D9B] transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-[17px] font-black text-[#843D9B] tracking-tight uppercase">Alerts</h1>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                    >
                        Mark All Read
                    </button>
                )}
            </div>

            <div className="flex-1 p-2 md:p-0 max-w-4xl mx-auto w-full">
                
                {/* ── DESKTOP TITLE ── */}
                <div className="hidden md:flex py-8 items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">System Notifications</h2>
                        <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Stay updated with your latest shop activities</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="bg-white text-[#843D9B] border border-gray-100 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            Clear All Unread
                        </button>
                    )}
                </div>

                {/* ── NOTIFICATION LIST ── */}
                <div className="space-y-3 pb-20">
                    {loading && notifications.length === 0 ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 w-full bg-white rounded-[2rem] animate-pulse border border-gray-100 shadow-sm" />
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="h-24 w-24 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6 group hover:rotate-12 transition-transform duration-500">
                                <Bell size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Inbox Zero</h3>
                            <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-tight">No new alerts at the moment.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const { icon, bg, color } = getIcon(notif.type);
                            const isNew = !notif.isRead;
                            return (
                                <div
                                    key={notif._id}
                                    onClick={() => isNew && markAsRead(notif._id)}
                                    className={`group p-5 md:p-6 rounded-[2rem] border transition-all flex gap-5 cursor-pointer relative ${
                                        isNew
                                            ? 'bg-white border-[#843D9B]/10 shadow-[0_10px_30px_rgba(45,47,110,0.05)]'
                                            : 'bg-white/60 border-gray-100 opacity-60 grayscale-[0.5]'
                                    }`}
                                >
                                    {isNew && (
                                        <div className="absolute top-6 right-6 h-2 w-2 bg-[#843D9B] rounded-full ring-4 ring-indigo-50" />
                                    )}
                                    
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500 ${bg} ${color.replace('text-', 'text- opacity-80')}`}>
                                        {icon}
                                    </div>

                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`text-sm font-black tracking-tight ${isNew ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                                • {getRelativeTime(notif.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${isNew ? 'text-gray-600' : 'text-gray-400'} line-clamp-2`}>
                                            {notif.message}
                                        </p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${bg} ${color}`}>
                                                {notif.type?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
