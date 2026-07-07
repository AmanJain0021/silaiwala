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
            onClick: () => console.log('Pinterest upload clicked'),
            iconBg: "bg-red-50"
        },
        {
            title: "Repeat",
            subtitle: "Last Order",
            icon: <RotateCcw size={18} className="text-blue-500" />,
            onClick: () => navigate('/user/orders'),
            iconBg: "bg-blue-50"
        },
        {
            title: "Book",
            subtitle: "Home Measurement",
            icon: <Home size={18} className="text-[#843D9B]" />,
            onClick: () => navigate('/user/services'),
            iconBg: "bg-purple-50"
        }
    ];

    return (
        <div className="px-4 md:px-6 lg:px-8 mt-2 mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {actions.map((action, idx) => (
                    <motion.div 
                        key={idx}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.onClick}
                        className="flex items-center gap-2.5 bg-white border border-gray-100 shadow-sm rounded-2xl p-2.5 min-w-[140px] flex-1 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className={`w-8 h-8 rounded-full ${action.iconBg} flex items-center justify-center shrink-0`}>
                            {action.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-900 leading-tight">{action.title}</span>
                            <span className="text-[9px] font-bold text-gray-500 leading-tight">{action.subtitle}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
