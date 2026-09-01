import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            title: "Upload Design",
            subtitle: "from Pinterest",
            icon: <ImageIcon size={18} className="text-[#E60023]" />,
            onClick: () => window.open('https://www.pinterest.com/', '_blank', 'noopener,noreferrer'),
            iconBg: "bg-red-50 text-[#E60023]"
        },
        {
            title: "Repeat",
            subtitle: "Last Order",
            icon: <RotateCcw size={18} className="text-blue-500" />,
            onClick: () => navigate('/user/orders'),
            iconBg: "bg-blue-50 text-blue-500"
        },
        {
            title: "Home",
            subtitle: "Dashboard",
            icon: <Home size={18} className="text-[#843D9B]" />,
            onClick: () => navigate('/user'),
            iconBg: "bg-purple-50 text-[#843D9B]"
        }
    ];

    return (
        <div className="px-4 md:px-6 lg:px-8 mt-2 mb-5">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {actions.map((action, idx) => (
                    <motion.div 
                        key={idx}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        onClick={action.onClick}
                        className="bg-white border border-gray-100 shadow-sm rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-2.5 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
                    >
                        <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                            {action.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-xs font-black text-gray-900 leading-tight truncate">{action.title}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-0.5 leading-tight truncate">{action.subtitle}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
