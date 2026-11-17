// Port of modules/tailor/pages/Notifications.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React from "react";
import { ArrowLeft, Bell, AlertCircle, CheckCircle2, ShoppingBag } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import { useNotifications } from "../context/tailor/NotificationContext";
import { I, Box, Btn, Txt, Scroll } from '../components/ui/primitives';
const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    loading
  } = useNotifications();
  const getRelativeTime = date => {
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
  const getIcon = type => {
    switch (type) {
      case 'ORDER_CREATED':
        return {
          icon: <I icon={ShoppingBag} size={18} />,
          bg: 'bg-emerald-500/10',
          color: 'text-emerald-400'
        };
      case 'ORDER_STATUS_UPDATED':
        return {
          icon: <I icon={Bell} size={18} />,
          bg: 'bg-[#843D9B]/10',
          color: 'text-[#843D9B]'
        };
      case 'SYSTEM_NOTICE':
        return {
          icon: <I icon={AlertCircle} size={18} />,
          bg: 'bg-amber-500/10',
          color: 'text-amber-400'
        };
      default:
        return {
          icon: <I icon={Bell} size={18} />,
          bg: 'bg-white/5',
          color: 'text-white/25'
        };
    }
  };
  return <Screen className="bg-[#F5F5F5]"><Box className="flex-1 bg-[#F5F5F5] flex flex-col font-sans">

            {/* ── MOBILE HEADER ── */}
            <Box className="md:hidden bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <Box className="flex items-center gap-3">
                    <Btn onPress={() => navigate(-1)} className="p-1.5 -ml-2 text-gray-400 hover:text-[#843D9B] transition-colors">
                        <I icon={ArrowLeft} size={20} />
                    </Btn>
                    <Txt className="text-[17px] font-black text-[#843D9B] tracking-tight uppercase">Alerts</Txt>
                </Box>
                {unreadCount > 0 && <Btn onPress={markAllRead} className="text-[9px] font-black text-[#843D9B] uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl active:scale-95 transition-all">
                        Mark All Read
                    </Btn>}
            </Box>
            <Scroll className="flex-1" contentClassName="pb-6">

            <Box className="flex-1 p-2 md:p-0 max-w-4xl mx-auto w-full">
                
                {/* ── DESKTOP TITLE ── */}
                <Box className="hidden md:flex py-8 items-center justify-between">
                    <Box>
                        <Txt className="text-2xl font-black text-gray-900 tracking-tight">System Notifications</Txt>
                        <Txt className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Stay updated with your latest shop activities</Txt>
                    </Box>
                    {unreadCount > 0 && <Btn onPress={markAllRead} className="bg-white text-[#843D9B] border border-gray-100 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95">
                            Clear All Unread
                        </Btn>}
                </Box>

                {/* ── NOTIFICATION LIST ── */}
                <Box className="space-y-3 pb-20">
                    {loading && notifications.length === 0 ? [1, 2, 3, 4].map(i => <Box key={i} className="h-24 w-full bg-white rounded-[2rem] animate-pulse border border-gray-100 shadow-sm" />) : notifications.length === 0 ? <Box className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                            <Box className="h-24 w-24 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6 group hover:rotate-12 transition-transform duration-500">
                                <I icon={Bell} size={40} className="text-gray-200" />
                            </Box>
                            <Txt className="text-lg font-black text-gray-900 uppercase tracking-widest">Inbox Zero</Txt>
                            <Txt className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-tight">No new alerts at the moment.</Txt>
                        </Box> : notifications.map(notif => {
          const {
            icon,
            bg,
            color
          } = getIcon(notif.type);
          const isNew = !notif.isRead;
          return <Btn key={notif._id} onPress={() => {
            if (isNew) markAsRead(notif._id);
            if (notif.data?.targetUrl) {
              let url = notif.data.targetUrl;
              if (url.includes('/orders')) {
                navigate('/partner/orders', {
                  state: {
                    highlightOrderId: notif.data.orderId
                  }
                });
              } else if (url.includes('finance') || url.includes('wallet') || url.includes('withdraw')) {
                navigate('/partner/wallet');
              } else {
                navigate(url);
              }
            } else if (notif.type === 'ORDER_CREATED' || notif.type === 'ORDER_STATUS_UPDATED') {
              navigate('/partner/orders', {
                state: {
                  highlightOrderId: notif.data?.orderId
                }
              });
            } else if (notif.type.includes('WITHDRAWAL')) {
              navigate('/partner/wallet');
            }
          }} className={`block ${`group p-5 md:p-6 rounded-[2rem] border transition-all flex gap-5 cursor-pointer relative ${isNew ? 'bg-white border-[#843D9B]/10 shadow-[0_10px_30px_rgba(45,47,110,0.05)]' : 'bg-white/60 border-gray-100 opacity-60 grayscale-[0.5]'}`}`}>
                                    {isNew && <Box className="absolute top-6 right-6 h-2 w-2 bg-[#843D9B] rounded-full ring-4 ring-indigo-50" />}
                                    
                                    <Box className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500 ${bg} ${color.replace('text-', 'text- opacity-80')}`}>
                                        {icon}
                                    </Box>

                                    <Box className="flex-1 pr-8">
                                        <Box className="flex items-center gap-2 mb-1">
                                            <Txt className={`text-sm font-black tracking-tight ${isNew ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {notif.title}
                                            </Txt>
                                            <Txt className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                                • {getRelativeTime(notif.createdAt)}
                                            </Txt>
                                        </Box>
                                        <Txt className={`text-xs leading-relaxed ${isNew ? 'text-gray-600' : 'text-gray-400'} line-clamp-2`}>
                                            {notif.message}
                                        </Txt>
                                        <Box className="mt-3 flex items-center gap-3">
                                            <Txt className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${bg} ${color}`}>
                                                {notif.type?.replace(/_/g, ' ')}
                                            </Txt>
                                        </Box>
                                    </Box>
                                </Btn>;
        })}
                </Box>
            </Box>
                    </Scroll>
        </Box></Screen>;
};
export default Notifications;