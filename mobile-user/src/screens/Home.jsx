// Port of modules/customer/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { ChevronRight, Wand2 } from 'lucide-react-native';
import { useNavigate } from '../lib/nav';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useOrderStore from '../store/orderStore';
import Screen from '../components/common/Screen';
import HomeHeader from '../components/customer/HomeHeader';
import PromoBanner from '../components/customer/PromoBanner';
import AIMeasurementCard from '../components/customer/AIMeasurementCard';
import QuickActions from '../components/customer/QuickActions';
import ServiceGrid from '../components/customer/ServiceGrid';
import TrendingCategories from '../components/customer/TrendingCategories';
import ActiveOrderBanner from '../components/customer/ActiveOrderBanner';
import PopularTailors from '../components/customer/PopularTailors';
import TrustSection from '../components/customer/TrustSection';
import WhyChooseUs from '../components/customer/WhyChooseUs';
import ReferEarnBanner from '../components/customer/ReferEarnBanner';
import BottomNav from '../components/customer/BottomNav';
import { Box, Txt, Btn, I, Scroll } from '../components/ui/primitives';

const Home = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { orders, fetchOrders } = useOrderStore();
  const [activeCustomDesign, setActiveCustomDesign] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    (async () => {
      try {
        const res = await api.get('/custom-designs');
        if (res.data.success) {
          const active = (res.data.data || []).find((d) => !['completed', 'cancelled', 'rejected'].includes((d.status || '').toLowerCase()));
          if (active) setActiveCustomDesign(active);
        }
      } catch (_) { /* optional section */ }
    })();
  }, [fetchOrders, isAuthenticated]);

  const activeOrder = (orders || []).find((o) => !['delivered', 'cancelled'].includes(o.status?.toLowerCase()));

  return (
    <Screen className="bg-[#843D9B]" bottom={false} statusBar="light">
      <Scroll className="flex-1 bg-white" contentClassName="bg-[#F7F8FC] pb-24 font-sans">
        <HomeHeader />
        <Box className="bg-white rounded-t-[2rem] relative z-30 -mt-4 pt-2 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.08)]">
          <PromoBanner />
          <AIMeasurementCard />
          <QuickActions />
          <ServiceGrid />
          <TrendingCategories />
          {activeCustomDesign && (
            <Btn onPress={() => navigate('/user/orders')} className="mx-4 mb-6 bg-gradient-to-r from-[#843D9B] to-[#6b2f7d] rounded-2xl p-4 shadow-lg shadow-[#843D9B]/30 flex items-center justify-between text-left">
              <Box className="flex items-center gap-3 flex-1">
                <Box className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <I icon={Wand2} size={20} color="#fff" />
                </Box>
                <Box className="flex-1">
                  <Txt className="font-bold text-sm leading-tight text-white">
                    Custom Order {activeCustomDesign.status === 'quote_received' ? 'Quote Received!' : 'Update'}
                  </Txt>
                  <Txt className="text-xs text-white/90 mt-0.5 leading-tight">
                    {activeCustomDesign.status === 'quote_received'
                      ? `Tailor has sent a quote of ₹${activeCustomDesign.quote?.price || 0}. Tap to pay.`
                      : `Your custom design is currently ${(activeCustomDesign.status || 'pending').replace('_', ' ')}.`}
                  </Txt>
                </Box>
              </Box>
              <I icon={ChevronRight} size={20} color="rgba(255,255,255,0.8)" />
            </Btn>
          )}
          <PopularTailors />
          <TrustSection />
          <WhyChooseUs />
          <ReferEarnBanner />
        </Box>
      </Scroll>
      {activeOrder && <ActiveOrderBanner order={activeOrder} />}
      <BottomNav />
    </Screen>
  );
};

export default Home;
