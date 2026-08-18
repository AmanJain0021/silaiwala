import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MenuOption = ({ icon: Icon, label, subLabel, to, onClick, isDanger, color, extra, hideArrow, layout = 'horizontal' }) => {
    const Component = to ? Link : 'button';

    const getIconColor = () => {
        if (isDanger) return 'text-red-500';
        if (color) return color;
        return 'text-[#843D9B]';
    };

    if (layout === 'vertical') {
        return (
            <Component
                to={to}
                onClick={onClick}
                className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group min-w-[90px] relative"
            >
                <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-[#843D9B]/5 transition-colors ${getIconColor()}`}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <h4 className="text-[10px] md:text-[11px] font-bold text-gray-900 tracking-tight leading-none text-center whitespace-nowrap">
                    {label}
                </h4>
                {subLabel && <p className="text-[9px] text-gray-500 mt-1 whitespace-nowrap text-center">{subLabel}</p>}
                {extra && <div className="mt-2">{extra}</div>}
            </Component>
        );
    }

    // Default Horizontal Layout
    return (
        <Component
            to={to}
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200 transition-all group mb-2 relative ${isDanger ? 'hover:bg-red-50 hover:border-red-100' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 bg-gray-50 group-hover:bg-[#843D9B]/5 ${getIconColor()}`}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <div className="text-left py-0.5">
                    <h4 className={`text-[13px] font-bold tracking-tight leading-none mb-1 ${isDanger ? 'text-red-600' : 'text-gray-900 group-hover:text-[#843D9B] transition-colors'}`}>{label}</h4>
                    {subLabel && <p className="text-[10px] font-medium text-gray-500 leading-none">{subLabel}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {extra && (
                    <div className="flex items-center justify-center">
                        {extra}
                    </div>
                )}
                {!hideArrow && (
                    <div className="group-hover:-translate-x-1 transition-transform">
                        <ChevronRight
                            size={16}
                            className={`transition-colors ${isDanger ? 'text-red-300 group-hover:text-red-500' : 'text-gray-300 group-hover:text-[#843D9B]'}`}
                        />
                    </div>
                )}
            </div>
        </Component>
    );
};

export default MenuOption;
