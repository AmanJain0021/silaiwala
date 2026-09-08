import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, 
    Headphones, 
    Mail, 
    Phone, 
    MessageSquare, 
    Copy, 
    Check, 
    Clock, 
    PhoneCall,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

const OrderHelpModal = ({ isOpen, onClose, order, settings }) => {
    const navigate = useNavigate();
    const [copiedField, setCopiedField] = useState(null);

    if (!isOpen) return null;

    const supportEmail = settings?.general?.supportEmail || 'support@silaiwala.com';
    const supportPhone = settings?.general?.supportPhone || '+91 1800 123 4567';
    const emergencyPhone = settings?.general?.emergencyPhone;
    const orderIdDisplay = order?.orderId || order?._id || 'Order';

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => {
            setCopiedField(null);
        }, 2000);
    };

    const handleEmailClick = () => {
        const subject = encodeURIComponent(`Help Needed: Order #${orderIdDisplay}`);
        const bodyLines = [
            `Hello Support Team,`,
            ``,
            `I need assistance with my order:`,
            `- Order ID: ${orderIdDisplay}`,
            `- Order Status: ${order?.status || 'In Progress'}`,
            order?.customer?.name ? `- Customer Name: ${order.customer.name}` : '',
            order?.customer?.phoneNumber ? `- Contact Number: ${order.customer.phoneNumber}` : '',
            ``,
            `Issue details:`,
            `[Please describe your issue here]`,
            ``,
            `Thank you!`
        ].filter(Boolean).join('\n');

        window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
    };

    const handleCallClick = (phoneNumber) => {
        if (!phoneNumber) return;
        const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
        window.location.href = `tel:${cleanNumber}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header with Gradient */}
                <div className="p-6 bg-gradient-to-br from-[#843D9B] via-[#702d84] to-[#591d6c] text-white relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all text-white"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                            <Headphones size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Need Help?</h2>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-purple-100 border border-white/10">
                                    Support
                                </span>
                            </div>
                            <p className="text-xs text-purple-100/90 font-medium mt-0.5">
                                Order #{orderIdDisplay}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Body - Scrollable */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans">
                    
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Facing any issue with measurement, delivery, tailor stitching, or cancellation? Reach out to our dedicated support team directly.
                    </p>

                    {/* Support Channels */}
                    <div className="space-y-3">
                        
                        {/* 1. Phone Support Card */}
                        <div className="bg-purple-50/50 border border-purple-100/80 rounded-2xl p-4 transition-all hover:bg-purple-50 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#843D9B] text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                                Support Helpline
                                            </h3>
                                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">
                                            {supportPhone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2">
                                <button
                                    onClick={() => handleCallClick(supportPhone)}
                                    className="flex-1 py-2.5 px-4 bg-[#843D9B] hover:bg-[#722f87] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    <PhoneCall size={14} />
                                    <span>Call Support</span>
                                </button>
                                <button
                                    onClick={() => handleCopy(supportPhone, 'phone')}
                                    className="py-2.5 px-3.5 bg-white border border-purple-200 hover:bg-purple-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                                    title="Copy Phone Number"
                                >
                                    {copiedField === 'phone' ? (
                                        <>
                                            <Check size={14} className="text-emerald-600" />
                                            <span className="text-emerald-600">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} className="text-gray-500" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 2. Email Support Card */}
                        <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 transition-all hover:bg-indigo-50/70 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                            Email Support
                                        </h3>
                                        <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">
                                            {supportEmail}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-2">
                                <button
                                    onClick={handleEmailClick}
                                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    <Mail size={14} />
                                    <span>Send Email</span>
                                </button>
                                <button
                                    onClick={() => handleCopy(supportEmail, 'email')}
                                    className="py-2.5 px-3.5 bg-white border border-indigo-200 hover:bg-indigo-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                                    title="Copy Support Email"
                                >
                                    {copiedField === 'email' ? (
                                        <>
                                            <Check size={14} className="text-emerald-600" />
                                            <span className="text-emerald-600">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} className="text-gray-500" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 3. In-App Order Chat Option */}
                        {order?._id && (
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate(`/user/orders/${order._id}/chat`);
                                }}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                        <MessageSquare size={17} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900 leading-tight">
                                            Chat about this Order
                                        </p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                            Direct message with tailor & delivery team
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </button>
                        )}

                        {/* Emergency SOS option if configured */}
                        {emergencyPhone && emergencyPhone !== supportPhone && (
                            <div className="flex items-center justify-between px-3 py-2 bg-red-50/60 border border-red-100 rounded-xl text-xs">
                                <div className="flex items-center gap-2 text-red-800 font-bold">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <span>Emergency Helpline:</span>
                                </div>
                                <button
                                    onClick={() => handleCallClick(emergencyPhone)}
                                    className="font-mono font-bold text-red-700 underline hover:text-red-900"
                                >
                                    {emergencyPhone}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Common Assistance Info Footer */}
                    <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500">
                        <Clock size={15} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-gray-700">Response Hours: </span>
                            Our support staff typically responds to emails within 2-4 hours. Calls are answered during standard business hours.
                        </div>
                    </div>

                </div>

                {/* Footer action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors active:scale-95"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OrderHelpModal;
