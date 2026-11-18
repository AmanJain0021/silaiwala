// Port of modules/customer/components/profile/MenuOption.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { ChevronRight } from "lucide-react-native";
import { Box, Txt, I, Btn, Scroll } from '../../ui/primitives';
import { useNavigate } from '../../../lib/nav';
const MenuOption = ({
  icon: Icon,
  label,
  subLabel,
  to,
  onPress,
  onClick,
  isDanger,
  color,
  extra,
  hideArrow,
  layout = 'horizontal'
}) => {
  const navigate = useNavigate();
  // web: <Link to> (block anchor) or <button>
  const Component = ({ to: href, onPress, className, children }) => (
    <Btn onPress={() => { if (href) navigate(href); else onPress?.(); }} className={`${href ? 'block ' : ''}${className}`}>{children}</Btn>
  );
  const getIconColor = () => {
    if (isDanger) return 'text-red-500';
    if (color) return color;
    return 'text-[#843D9B]';
  };
  if (layout === 'vertical') {
    return <Component to={to} onPress={onPress || onClick} className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group min-w-[90px] relative">
                <Box className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-[#843D9B]/5 transition-colors ${getIconColor()}`}>
                    <I icon={Icon} size={20} strokeWidth={2} />
                </Box>
                <Txt className="text-[10px] md:text-[11px] font-bold text-gray-900 tracking-tight leading-none text-center whitespace-nowrap">
                    {label}
                </Txt>
                {subLabel && <Txt className="text-[9px] text-gray-500 mt-1 whitespace-nowrap text-center">{subLabel}</Txt>}
                {extra && <Box className="mt-2">{extra}</Box>}
            </Component>;
  }

  // Default Horizontal Layout
  return <Component to={to} onPress={onPress || onClick} className={`w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200 transition-all group mb-2 relative ${isDanger ? 'hover:bg-red-50 hover:border-red-100' : ''}`}>
            <Box className="flex items-center gap-3">
                <Box className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 bg-gray-50 group-hover:bg-[#843D9B]/5 ${getIconColor()}`}>
                    <I icon={Icon} size={20} strokeWidth={2} />
                </Box>
                <Box className="text-left py-0.5">
                    <Txt className={`text-[13px] font-bold tracking-tight leading-none mb-1 ${isDanger ? 'text-red-600' : 'text-gray-900 group-hover:text-[#843D9B] transition-colors'}`}>{label}</Txt>
                    {subLabel && <Txt className="text-[10px] font-medium text-gray-500 leading-none">{subLabel}</Txt>}
                </Box>
            </Box>

            <Box className="flex items-center gap-3">
                {extra && <Box className="flex items-center justify-center">
                        {extra}
                    </Box>}
                {!hideArrow && <Box className="group-hover:-translate-x-1 transition-transform">
                        <I icon={ChevronRight} size={16} className={`transition-colors ${isDanger ? 'text-red-300 group-hover:text-red-500' : 'text-gray-300 group-hover:text-[#843D9B]'}`} />
                    </Box>}
            </Box>
        </Component>;
};
export default MenuOption;