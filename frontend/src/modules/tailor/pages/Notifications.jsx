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
                return { icon: <Bell size={18} />, bg: 'bg-[#2D2F6E]/10', color: 'text-[#2D2F6E]' };
            case 'SYSTEM_NOTICE':
                return { icon: <AlertCircle size={18} />, bg: 'bg-amber-500/10', color: 'text-amber-400' };
            default:
                return { icon: <Bell size={18} />, bg: 'bg-white/5', color: 'text-white/25' };
        }
    };

    return (
        <div className="min-h-full bg-[#0A0A0A] flex flex-col animate-in fade-in duration-300">

            {/* Header */}
            <div className="bg-[#0A0A0A] border-b border-[#1C1C1C] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-[#161616] border border-[#2A2A2A] rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-[17px] font-black text-white tracking-tight">Notifications</h1>
                </div>
                {unreadCount > 0 ? (
                    <button
                        onClick={markAllRead}
                        className="text-[9px] font-black text-[#2D2F6E] uppercase tracking-widest bg-[#2D2F6E]/10 border border-[#2D2F6E]/20 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                    >
                        Mark All Read
                    </button>
                ) : (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={11} /> All Caught Up
                    </div>
                )}
            </div>

            <div className="flex-1 p-4 space-y-2.5">
                {loading && notifications.length === 0 ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-20 w-full bg-[#111111] rounded-3xl animate-pulse border border-[#1E1E1E]" />
                    ))
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-[#111111] border border-[#1E1E1E] rounded-full flex items-center justify-center mb-4">
                            <Bell size={32} className="text-white/10" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">No Notifications Yet</h3>
                        <p className="text-xs text-white/25 font-medium mt-2">Updates about your orders will appear here.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const { icon, bg, color } = getIcon(notif.type);
                        return (
                            <div
                                key={notif._id}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                className={`p-4 rounded-3xl border transition-all flex gap-4 cursor-pointer relative ${
                                    notif.isRead
                                        ? 'bg-[#111111] border-[#1C1C1C] opacity-50'
                                        : 'bg-[#111111] border-[#2D2F6E]/20 shadow-[0_0_20px_rgba(253,0,83,0.05)]'
                                }`}
                            >
                                {!notif.isRead && (
                                    <div className="absolute top-4 right-4 h-2 w-2 bg-[#2D2F6E] rounded-full animate-pulse" />
                                )}
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                                    {icon}
                                </div>
                                <div className="flex-1 pr-4">
                                    <h3 className="text-sm font-black text-white leading-tight mb-1">{notif.title}</h3>
                                    <p className="text-xs font-medium text-white/40 leading-snug line-clamp-2">{notif.message}</p>
                                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2">{getRelativeTime(notif.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Notifications;
