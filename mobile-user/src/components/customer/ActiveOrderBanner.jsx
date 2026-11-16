// Port of modules/customer/components/ActiveOrderBanner.jsx (floating, bobbing track-order bubble)
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Package, X } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { formatOrderItemsTitle, getItemImage } from '../../utils/orderItems';
import { getImageUrl } from '../../utils/imageUrl';
import { Box, Txt, Btn, Img, I } from '../ui/primitives';

const ActiveOrderBanner = ({ order }) => {
  const navigate = useNavigate();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]));
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]));
    a.start(); p.start();
    return () => { a.stop(); p.stop(); };
  }, [bob, pulse]);

  if (!order) return null;
  const items = order.items || [];
  const serviceTitle = formatOrderItemsTitle(items, { fallback: 'Custom stitching' });
  const status = order.status?.replace(/-/g, ' ').toUpperCase() || 'PENDING';
  const serviceImage = getImageUrl(getItemImage(items[0])) || items[0]?.image;
  const expandedW = Math.min(Dimensions.get('window').width - 32, 384);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: insets.bottom + 100, zIndex: 50 }}>
      <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>
        <Btn
          onPress={() => (isExpanded ? navigate(`/user/orders/${order._id}/track`) : setIsExpanded(true))}
          className={`bg-primary shadow-xl shadow-primary/30 flex items-center border border-primary-dark overflow-hidden h-[64px] rounded-[1.25rem] ${isExpanded ? 'px-2.5 justify-between' : 'p-1.5 justify-center w-[64px]'}`}
          style={isExpanded ? { width: expandedW, elevation: 10 } : { elevation: 10 }}
        >
          {isExpanded ? (
            <Box className="flex items-center justify-between w-full h-full">
              <Box className="flex items-center gap-3 min-w-0 flex-1">
                {serviceImage ? (
                  <Box className="w-[44px] h-[44px] bg-white rounded-xl overflow-hidden shrink-0 border-2 border-white/20 flex items-center justify-center relative">
                    <Img src={serviceImage} className="w-full h-full object-cover" />
                    {items.length > 1 && <Txt className="absolute bottom-0 right-0 bg-primary text-white text-[8px] font-black px-1 rounded-tl">{items.length}</Txt>}
                  </Box>
                ) : (
                  <Box className="w-[44px] h-[44px] bg-white/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-white/20">
                    <I icon={Package} size={22} color="#fff" />
                  </Box>
                )}
                <Box className="flex flex-col min-w-0 flex-1 py-0.5">
                  <Txt className="font-black text-[13px] text-white tracking-wide leading-tight">Track Order</Txt>
                  <Txt className="text-[10px] font-bold text-white/80 truncate mt-0.5 uppercase tracking-wider">{serviceTitle} • {status}</Txt>
                </Box>
              </Box>
              <Box className="flex items-center shrink-0 pr-2 pl-2">
                <I icon={ChevronRight} size={20} color="#fff" />
                <Btn onPress={() => setIsExpanded(false)} className="ml-2 p-1.5 rounded-full" hitSlop={6}>
                  <I icon={X} size={16} color="rgba(255,255,255,0.8)" />
                </Btn>
              </Box>
            </Box>
          ) : (
            <Box className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-white/10">
              {serviceImage ? <Img src={serviceImage} className="w-full h-full object-cover" /> : <I icon={Package} size={24} color="#fff" />}
              <Animated.View style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#843D9B', opacity: pulse }} />
            </Box>
          )}
        </Btn>
      </Animated.View>
    </View>
  );
};

export default ActiveOrderBanner;
