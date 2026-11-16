// Port of modules/customer/components/TrendingCategories.jsx
import React from 'react';
import { ArrowRight } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { Box, Txt, Btn, Img, I } from '../ui/primitives';

const categories = [
  { id: 1, name: 'Men', image: '/assets/images/men_category.png' },
  { id: 2, name: 'Women', image: '/assets/images/women_category.png' },
  { id: 3, name: 'Bridal', image: '/assets/images/bridal_wear.png' },
  { id: 4, name: 'Popular', image: '/assets/images/popular_category.png' },
  { id: 5, name: 'Under ₹500', image: '/assets/images/under_500_category.png' },
  { id: 6, name: 'Express Delivery', image: '/assets/images/express_category.png' },
];

const TrendingCategories = () => {
  const navigate = useNavigate();
  return (
    <Box className="py-3 px-4">
      <Box className="flex justify-between items-center mb-3.5">
        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest">TRENDING CATEGORIES</Txt>
        <Btn onPress={() => navigate('/user/services')} className="text-[10px] font-black text-[#843D9B] flex items-center gap-0.5 uppercase tracking-wider">
          <Txt>See All</Txt>
          <I icon={ArrowRight} size={12} />
        </Btn>
      </Box>
      <Box className="grid grid-cols-3 gap-3">
        {categories.map((item) => (
          <Btn key={item.id} onPress={() => navigate('/user/services', { state: { filter: item.name } })} className="aspect-[3/4] rounded-2xl overflow-hidden relative shadow-sm border border-gray-100">
            <Img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <Box className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-center pb-2.5 px-1">
              <Txt className="text-white text-[11px] font-black tracking-wider text-center">{item.name}</Txt>
            </Box>
          </Btn>
        ))}
      </Box>
    </Box>
  );
};

export default TrendingCategories;
