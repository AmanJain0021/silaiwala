// Port of modules/customer/components/QuickActions.jsx
import React from 'react';
import { Linking } from 'react-native';
import { RotateCcw, Home, Image as ImageIcon } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { Box, Txt, Btn, I } from '../ui/primitives';

const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { title: 'Upload Design', subtitle: 'from Pinterest', icon: ImageIcon, color: '#E60023', onClick: () => Linking.openURL('https://www.pinterest.com/'), iconBg: 'bg-red-50' },
    { title: 'Repeat', subtitle: 'Last Order', icon: RotateCcw, color: '#3b82f6', onClick: () => navigate('/user/orders'), iconBg: 'bg-blue-50' },
    { title: 'Home', subtitle: 'Dashboard', icon: Home, color: '#843D9B', onClick: () => navigate('/user'), iconBg: 'bg-purple-50' },
  ];
  return (
    <Box className="px-4 mt-2 mb-5">
      <Box className="grid grid-cols-3 gap-2.5">
        {actions.map((a, idx) => (
          <Btn key={idx} onPress={a.onClick} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-2.5 flex flex-col items-center text-center gap-2">
            <Box className={`w-9 h-9 rounded-xl ${a.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
              <I icon={a.icon} size={18} color={a.color} />
            </Box>
            <Box className="flex flex-col items-center min-w-0">
              <Txt className="text-xs font-black text-gray-900 leading-tight truncate">{a.title}</Txt>
              <Txt className="text-[9px] font-bold text-gray-400 mt-0.5 leading-tight truncate">{a.subtitle}</Txt>
            </Box>
          </Btn>
        ))}
      </Box>
    </Box>
  );
};

export default QuickActions;
