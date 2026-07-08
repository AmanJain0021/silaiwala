import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

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

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setHistory(prev => prev.map(item => item._id === id ? { ...item, isRead: true } : item));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 pt-safe">
                <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight">Activity History</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All Notifications</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : history.length > 0 ? (
                    history.map((item) => (
                        <div 
                            key={item._id} 
                            onClick={() => markAsRead(item._id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${!item.isRead ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                        >
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${!item.isRead ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-sm font-black truncate ${!item.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {item.title}
                                        </h3>
                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${!item.isRead ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                                        {item.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Bell size={28} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">No Activity Yet</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityHistory;
