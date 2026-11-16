// Port of modules/customer/components/orders/OrderHelpModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from "react";
import { useNavigate } from '../../../lib/nav';
import { X, Headphones, Mail, Phone, MessageSquare, MessageCircle, Copy, Check, Clock, PhoneCall, AlertCircle, ChevronRight } from "lucide-react-native";
import { openAdminWhatsApp } from "../../../utils/whatsapp";
import { Box, Btn, I, Txt, Scroll } from '../../ui/primitives';
const OrderHelpModal = ({
  isOpen,
  onClose,
  order,
  settings
}) => {
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);
    const supportEmail = settings?.general?.supportEmail || 'support@silaiwala.com';
  const supportPhone = settings?.general?.supportPhone || '+91 9429692921';
  const emergencyPhone = settings?.general?.emergencyPhone;
  const orderIdDisplay = order?.orderId || order?._id || 'Order';
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };
  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Help Needed: Order #${orderIdDisplay}`);
    const bodyLines = [`Hello Support Team,`, ``, `I need assistance with my order:`, `- Order ID: ${orderIdDisplay}`, `- Order Status: ${order?.status || 'In Progress'}`, order?.customer?.name ? `- Customer Name: ${order.customer.name}` : '', order?.customer?.phoneNumber ? `- Contact Number: ${order.customer.phoneNumber}` : '', ``, `Issue details:`, `[Please describe your issue here]`, ``, `Thank you!`].filter(Boolean).join('\n');
    Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`);
  };
  const handleCallClick = phoneNumber => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };
  const handleWhatsAppClick = () => {
    const bodyLines = [`Hi SewZella Admin, I need help with my order.`, `Order ID: ${orderIdDisplay}`, `Order Status: ${order?.status || 'In Progress'}`].join('\n');
    openAdminWhatsApp(bodyLines);
  };
  return <Sheet visible={!!(isOpen)} onClose={onClose} className={`bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl   sm:  flex flex-col max-h-[90vh]`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                
                {/* Header with Gradient */}
                <Box className="p-6 bg-gradient-to-br from-[#843D9B] via-[#702d84] to-[#591d6c] text-white relative shrink-0">
                    <Btn onPress={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all text-white">
                        <I icon={X} size={20} />
                    </Btn>

                    <Box className="flex items-center gap-3">
                        <Box className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                            <I icon={Headphones} size={24} className="text-white" />
                        </Box>
                        <Box>
                            <Box className="flex items-center gap-2">
                                <Txt className="text-lg sm:text-xl font-black tracking-tight text-white">Need Help?</Txt>
                                <Txt className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-purple-100 border border-white/10">
                                    Support
                                </Txt>
                            </Box>
                            <Txt className="text-xs text-purple-100/90 font-medium mt-0.5">
                                Order #{orderIdDisplay}
                            </Txt>
                        </Box>
                    </Box>
                </Box>

                {/* Content Body - Scrollable */}
                <Scroll contentClassName="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans" nestedScrollEnabled>
                    
                    <Txt className="text-xs text-gray-600 font-medium leading-relaxed">
                        Facing any issue with measurement, delivery, tailor stitching, or cancellation? Reach out to our dedicated support team directly.
                    </Txt>

                    {/* Support Channels */}
                    <Box className="space-y-3">
                        
                        {/* 1. Phone Support Card */}
                        <Box className="bg-purple-50/50 border border-purple-100/80 rounded-2xl p-4 transition-all hover:bg-purple-50 hover:shadow-sm">
                            <Box className="flex items-start justify-between gap-3">
                                <Box className="flex items-center gap-3">
                                    <Box className="w-10 h-10 rounded-xl bg-[#843D9B] text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <I icon={Phone} size={18} />
                                    </Box>
                                    <Box>
                                        <Box className="flex items-center gap-2">
                                            <Txt className="text-xs font-black uppercase tracking-wider text-gray-900">
                                                Support Helpline
                                            </Txt>
                                            <Txt className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                                <Txt className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </Txt>
                                        </Box>
                                        <Txt className="text-sm font-bold text-gray-800 mt-0.5 font-mono">
                                            {supportPhone}
                                        </Txt>
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2">
                                <Btn onPress={handleWhatsAppClick} className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
                                    <I icon={MessageCircle} size={14} />
                                    <Txt>WhatsApp Admin</Txt>
                                </Btn>
                                <Btn onPress={() => handleCallClick(supportPhone)} className="py-2.5 px-3.5 bg-white border border-purple-200 hover:bg-purple-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0">
                                    <I icon={PhoneCall} size={14} className="text-gray-500" />
                                    <Txt>Call</Txt>
                                </Btn>
                                <Btn onPress={() => handleCopy(supportPhone, 'phone')} className="py-2.5 px-3.5 bg-white border border-purple-200 hover:bg-purple-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0">
                                    {copiedField === 'phone' ? <>
                                            <I icon={Check} size={14} className="text-emerald-600" />
                                            <Txt className="text-emerald-600">Copied</Txt>
                                        </> : <>
                                            <I icon={Copy} size={14} className="text-gray-500" />
                                            <Txt>Copy</Txt>
                                        </>}
                                </Btn>
                            </Box>
                        </Box>

                        {/* 2. Email Support Card */}
                        <Box className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 transition-all hover:bg-indigo-50/70 hover:shadow-sm">
                            <Box className="flex items-start justify-between gap-3">
                                <Box className="flex items-center gap-3">
                                    <Box className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <I icon={Mail} size={18} />
                                    </Box>
                                    <Box className="min-w-0 flex-1">
                                        <Txt className="text-xs font-black uppercase tracking-wider text-gray-900">
                                            Email Support
                                        </Txt>
                                        <Txt className="text-sm font-bold text-gray-800 mt-0.5 truncate">
                                            {supportEmail}
                                        </Txt>
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-2">
                                <Btn onPress={handleEmailClick} className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
                                    <I icon={Mail} size={14} />
                                    <Txt>Send Email</Txt>
                                </Btn>
                                <Btn onPress={() => handleCopy(supportEmail, 'email')} className="py-2.5 px-3.5 bg-white border border-indigo-200 hover:bg-indigo-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0">
                                    {copiedField === 'email' ? <>
                                            <I icon={Check} size={14} className="text-emerald-600" />
                                            <Txt className="text-emerald-600">Copied</Txt>
                                        </> : <>
                                            <I icon={Copy} size={14} className="text-gray-500" />
                                            <Txt>Copy</Txt>
                                        </>}
                                </Btn>
                            </Box>
                        </Box>

                        {/* 3. In-App Order Chat Option */}
                        {order?._id && <Btn onPress={() => {
            onClose();
            navigate(`/user/orders/${order._id}/chat`);
          }} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.99]">
                                <Box className="flex items-center gap-3">
                                    <Box className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                        <I icon={MessageSquare} size={17} />
                                    </Box>
                                    <Box className="text-left">
                                        <Txt className="text-xs font-bold text-gray-900 leading-tight">
                                            Chat about this Order
                                        </Txt>
                                        <Txt className="text-[11px] text-gray-500 font-medium mt-0.5">
                                            Direct message with tailor & delivery team
                                        </Txt>
                                    </Box>
                                </Box>
                                <I icon={ChevronRight} size={18} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </Btn>}

                        {/* Emergency SOS option if configured */}
                        {emergencyPhone && emergencyPhone !== supportPhone && <Box className="flex items-center justify-between px-3 py-2 bg-red-50/60 border border-red-100 rounded-xl text-xs">
                                <Box className="flex items-center gap-2 text-red-800 font-bold">
                                    <I icon={AlertCircle} size={14} className="text-red-500 shrink-0" />
                                    <Txt>Emergency Helpline:</Txt>
                                </Box>
                                <Btn onPress={() => handleCallClick(emergencyPhone)} className="font-mono font-bold text-red-700 underline hover:text-red-900">
                                    {emergencyPhone}
                                </Btn>
                            </Box>}
                    </Box>

                    {/* Common Assistance Info Footer */}
                    <Box className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500">
                        <I icon={Clock} size={15} className="text-gray-400 shrink-0 mt-0.5" />
                        <Box>
                            <Txt className="font-bold text-gray-700">Response Hours: </Txt>
                            Our support staff typically responds to emails within 2-4 hours. Calls are answered during standard business hours.
                        </Box>
                    </Box>

                </Scroll>

                {/* Footer action */}
                <Box className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <Btn onPress={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors active:scale-95">
                        Close
                    </Btn>
                </Box>

            </Box>
</Sheet>;
};
export default OrderHelpModal;
