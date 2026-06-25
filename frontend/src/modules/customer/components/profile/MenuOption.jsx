import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MenuOption = ({ icon: Icon, label, subLabel, to, onClick, isDanger, color, extra, hideArrow }) => {
    const Component = to ? Link : 'button';

    const getIconColor = () => {
        if (isDanger) return 'bg-red-50 text-red-600 group-hover:bg-red-100';
        if (color) return `${color} text-white`;
        return 'bg-gray-50 text-[#843D9B] group-hover:bg-[#843D9B] group-hover:text-white';
    };

    return (
        <Component
            to={to}
            onClick={onClick}
            className={`w-full flex items-center justify-between p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#843D9B]/20 hover:bg-[#843D9B]/[0.02] transition-all group mb-1 ${isDanger ? 'hover:bg-indigo-50 hover:border-indigo-100' : ''}`}
        >
            <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-active:scale-95 ${getIconColor()}`}>
                    <Icon size={17} strokeWidth={2.5} />
                </div>
                <div className="text-left py-0.5">
                    <h4 className={`text-[13px] font-black tracking-tight leading-none ${isDanger ? 'text-red-600' : 'text-gray-900 group-hover:text-[#843D9B] transition-colors'}`}>{label}</h4>
                    {subLabel && <p className="text-[10px] font-bold text-gray-400 leading-none mt-1">{subLabel}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {extra && (
                    <div className="flex items-center justify-center">
                        {extra}
                    </div>
                )}
                {!hideArrow && (
                    <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                        <ChevronRight
                            size={16}
                            className={`transition-colors ${isDanger ? 'text-red-300 group-hover:text-error' : 'text-gray-300 group-hover:text-[#843D9B]'}`}
                        />
                    </div>
                )}
            </div>
        </Component>
    );
};

export default MenuOption;
