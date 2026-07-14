import React, { useState } from 'react';
import { Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationSettings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        orderUpdates: true,
        promotions: false,
        reminders: true,
        systemAlerts: true
    });

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:p-6 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">Notifications</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-0">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                            <Bell size={24} className="text-pink-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Notification Preferences</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">Manage what you want to be notified about</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Order Updates</h3>
                                <p className="text-xs text-gray-500 mt-1">Notifications about your order status, delivery, and tailors.</p>
                            </div>
                            <button 
                                onClick={() => toggleSetting('orderUpdates')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.orderUpdates ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.orderUpdates ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Promotions & Offers</h3>
                                <p className="text-xs text-gray-500 mt-1">Receive updates about sales, new coupons, and discounts.</p>
                            </div>
                            <button 
                                onClick={() => toggleSetting('promotions')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.promotions ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.promotions ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Reminders</h3>
                                <p className="text-xs text-gray-500 mt-1">Reminders for pending cart items, measurement profiles, etc.</p>
                            </div>
                            <button 
                                onClick={() => toggleSetting('reminders')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.reminders ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.reminders ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
