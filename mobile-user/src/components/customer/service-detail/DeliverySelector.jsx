// Port of components/service-detail/DeliverySelector.jsx
import React from 'react';
import { Truck, Zap, Crown } from 'lucide-react-native';
import { Box, Txt, Btn, I } from '../../ui/primitives';

const options = [
  { id: 'standard', label: 'Standard', days: 15, price: 0, icon: Truck, bg: 'bg-indigo-50' },
  { id: 'express', label: 'Express', days: 10, price: 150, icon: Zap, bg: 'bg-green-50', badge: 'POPULAR' },
  { id: 'premium', label: 'Premium', days: 7, price: 350, icon: Crown, bg: 'bg-indigo-50' },
];

const getEstimatedDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const DeliverySelector = ({ selected, onSelect }) => (
  <Box className="bg-white rounded-2xl p-3.5 mb-3 shadow-sm border border-gray-100">
    <Txt className="text-sm font-bold text-gray-900 mb-3">Choose Delivery Speed</Txt>
    <Box className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <Btn key={opt.id} onPress={() => onSelect(opt.id)} className={`relative p-2.5 rounded-xl border text-center flex flex-col items-center justify-between min-h-[120px] ${isSelected ? 'border-primary bg-primary-soft shadow-md ring-1 ring-primary' : 'border-gray-100'}`}>
            {opt.badge && <Txt className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">{opt.badge}</Txt>}
            <Box className="items-center">
              <Box className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${opt.bg} ${isSelected ? 'scale-110' : ''}`}>
                <I icon={opt.icon} size={16} color="#843D9B" />
              </Box>
              <Txt className={`text-[11px] font-bold mb-0.5 text-center ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</Txt>
              <Txt className="text-[9px] text-gray-500 font-medium text-center">{opt.days} Days</Txt>
              <Txt className="text-[9px] text-primary font-black uppercase mt-1 text-center">by {getEstimatedDate(opt.days)}</Txt>
            </Box>
            <Txt className={`text-[10px] font-black mt-2 ${opt.price > 0 ? 'text-primary' : 'text-green-600'}`}>{opt.price > 0 ? `+₹${opt.price}` : 'FREE'}</Txt>
          </Btn>
        );
      })}
    </Box>
  </Box>
);

export default DeliverySelector;
