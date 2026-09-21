import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, MoreVertical, PhoneCall, HelpCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useBrandingStore from '../../../../store/brandingStore';

const Header = ({ customerPhone, onCancelTask }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const { logos, appName, fetchBranding } = useBrandingStore();

    useEffect(() => {
        fetchBranding();
    }, [fetchBranding]);

    const execLogo = logos?.measurementExecutive || '/assets/images/admin_executive_logo.png';

    return (
        <header className="relative w-full bg-white border-b border-gray-100/80 px-4 py-2.5 flex items-center justify-between z-30 select-none">
            {/* Left: Back button */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Go back"
            >
                <ArrowLeft size={22} strokeWidth={2.2} />
            </button>

            {/* Center: Admin Configured Measurement Executive Logo */}
            <div className="flex flex-col items-center justify-center">
                <img 
                    src={execLogo} 
                    alt={appName || "SewZella"} 
                    className="h-10 w-auto object-contain max-w-[170px]" 
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/images/admin_executive_logo.png';
                    }}
                />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 relative">
                {customerPhone ? (
                    <a
                        href={`tel:${customerPhone}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-[#5B21B6] active:scale-95 transition-all"
                        title="Contact Customer"
                    >
                        <MessageSquare size={19} strokeWidth={2} />
                    </a>
                ) : (
                    <button
                        type="button"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-[#5B21B6] active:scale-95 transition-all cursor-pointer"
                        title="Chat"
                    >
                        <MessageSquare size={19} strokeWidth={2} />
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                    aria-label="Options"
                >
                    <MoreVertical size={20} strokeWidth={2} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setMenuOpen(false)} 
                        />
                        <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                            {customerPhone && (
                                <a
                                    href={`tel:${customerPhone}`}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5B21B6] transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <PhoneCall size={14} /> Call Customer
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    window.open('https://wa.me/919999999999', '_blank');
                                }}
                                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5B21B6] transition-colors cursor-pointer"
                            >
                                <HelpCircle size={14} /> Help & Support
                            </button>
                            {onCancelTask && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onCancelTask();
                                    }}
                                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100 cursor-pointer"
                                >
                                    <AlertTriangle size={14} /> Cancel Request
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
