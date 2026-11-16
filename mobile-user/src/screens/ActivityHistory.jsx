// Port of modules/customer/pages/ActivityHistory.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Screen from '../components/common/Screen';
import React, { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCircle2, AlertCircle } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const ActivityHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // We use the existing notifications API which fetches activities/notifications for the current user
        const res = await api.get('/notifications');
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch activity history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);
  const markAsRead = async id => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setHistory(prev => prev.map(item => item._id === id ? {
        ...item,
        isRead: true
      } : item));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 pt-safe">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box>
                    <Txt className="text-lg font-black tracking-tight">Activity History</Txt>
                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All Notifications</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-3xl mx-auto p-4 space-y-3">
                {isLoading ? <Box className="flex justify-center py-20">
                        <Spin size={32} className="text-[#843D9B]" />
                    </Box> : history.length > 0 ? history.map(item => <Btn key={item._id} onPress={() => markAsRead(item._id)} className={`block ${`p-4 rounded-2xl border transition-all cursor-pointer ${!item.isRead ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}`}>
                            <Box className="flex gap-3">
                                <Box className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${!item.isRead ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <I icon={Bell} size={18} />
                                </Box>
                                <Box className="flex-1 min-w-0">
                                    <Box className="flex justify-between items-start mb-1">
                                        <Txt className={`text-sm font-black truncate ${!item.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {item.title}
                                        </Txt>
                                        <Txt className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Txt>
                                    </Box>
                                    <Txt className={`text-xs ${!item.isRead ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                                        {item.message}
                                    </Txt>
                                </Box>
                            </Box>
                        </Btn>) : <Box className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Box className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <I icon={Bell} size={28} />
                        </Box>
                        <Txt className="text-lg font-black text-gray-900">No Activity Yet</Txt>
                        <Txt className="text-xs text-gray-400 font-medium mt-1">You're all caught up!</Txt>
                    </Box>}
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default ActivityHistory;