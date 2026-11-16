// Port of modules/customer/pages/NotificationSettings.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState } from "react";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const NotificationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: false,
    reminders: true,
    systemAlerts: true
  });
  const toggleSetting = key => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  return <Screen className="bg-gray-50" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-gray-50 md:p-6 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">Notifications</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-4xl mx-auto px-4 md:px-0">
                <Box className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <Box className="flex items-center gap-4 mb-8">
                        <Box className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                            <I icon={Bell} size={24} className="text-pink-500" />
                        </Box>
                        <Box>
                            <Txt className="text-lg font-black text-gray-900">Notification Preferences</Txt>
                            <Txt className="text-xs text-gray-500 font-bold mt-1">Manage what you want to be notified about</Txt>
                        </Box>
                    </Box>

                    <Box className="space-y-4">
                        <Box className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Order Updates</Txt>
                                <Txt className="text-xs text-gray-500 mt-1">Notifications about your order status, delivery, and tailors.</Txt>
                            </Box>
                            <Btn onPress={() => toggleSetting('orderUpdates')} className={`w-12 h-6 rounded-full transition-colors relative ${settings.orderUpdates ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <Box className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.orderUpdates ? 'left-7' : 'left-1'}`} />
                            </Btn>
                        </Box>

                        <Box className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Promotions & Offers</Txt>
                                <Txt className="text-xs text-gray-500 mt-1">Receive updates about sales, new coupons, and discounts.</Txt>
                            </Box>
                            <Btn onPress={() => toggleSetting('promotions')} className={`w-12 h-6 rounded-full transition-colors relative ${settings.promotions ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <Box className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.promotions ? 'left-7' : 'left-1'}`} />
                            </Btn>
                        </Box>

                        <Box className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Reminders</Txt>
                                <Txt className="text-xs text-gray-500 mt-1">Reminders for pending cart items, measurement profiles, etc.</Txt>
                            </Box>
                            <Btn onPress={() => toggleSetting('reminders')} className={`w-12 h-6 rounded-full transition-colors relative ${settings.reminders ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <Box className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.reminders ? 'left-7' : 'left-1'}`} />
                            </Btn>
                        </Box>
                    </Box>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default NotificationSettings;