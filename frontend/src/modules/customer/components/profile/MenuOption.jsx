import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MenuOption = ({ icon: Icon, label, subLabel, to, onClick, isDanger, color, extra }) => {
    const Component = to ? Link : 'button';

    const getIconColor = () => {
        if (isDanger) return 'bg-indigo-50 text-error group-hover:bg-red-100';
        if (color) return `${color} text-white`;
        return 'bg-indigo-50 text-[#2D2F6E] group-hover:bg-[#2D2F6E] group-hover:text-white';
    };

    return (
        <Component
            to={to}
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2D2F6E]/20 hover:bg-[#2D2F6E]/[0.02] transition-all group mb-3 ${isDanger ? 'hover:bg-indigo-50 hover:border-indigo-100' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${getIconColor()}`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-left py-1">
                    <h4 className={`text-[15px] font-black tracking-tight ${isDanger ? 'text-red-600' : 'text-gray-900 group-hover:text-indigo-600 transition-colors'}`}>{label}</h4>
                    {subLabel && <p className="text-[11px] font-bold text-gray-400 leading-tight mt-0.5">{subLabel}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {extra && (
                    <div className="flex items-center justify-center">
                        {extra}
                    </div>
                )}
                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                    <ChevronRight
                        size={16}
                        className={`transition-colors ${isDanger ? 'text-red-300 group-hover:text-error' : 'text-gray-300 group-hover:text-[#2D2F6E]'}`}
                    />
                </div>
            </div>
        </Component>
    );
};

export default MenuOption;
