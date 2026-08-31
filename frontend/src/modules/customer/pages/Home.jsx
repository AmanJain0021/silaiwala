import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Wand2 } from 'lucide-react';
import api from '../../../utils/api';
// Components
import HomeHeader from '../components/HomeHeader';
import PromoBanner from '../components/PromoBanner';
import AIMeasurementCard from '../components/AIMeasurementCard';
import QuickActions from '../components/QuickActions';
import ServiceGrid from '../components/ServiceGrid';
import TrendingCategories from '../components/TrendingCategories';
import ActiveOrderBanner from '../components/ActiveOrderBanner';
import PopularTailors from '../components/PopularTailors';
import TrustSection from '../components/TrustSection';
import WhyChooseUs from '../components/WhyChooseUs';
import ReferEarnBanner from '../components/ReferEarnBanner';
import BottomNav from '../components/BottomNav';

import useAuthStore from '../../../store/authStore';
import useOrderStore from '../../../store/orderStore';

const Home = () => {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { orders, fetchOrders } = useOrderStore();
    const [activeCustomDesign, setActiveCustomDesign] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
            fetchCustomDesigns();
        }
    }, [fetchOrders, isAuthenticated]);

    const fetchCustomDesigns = async () => {
        try {
            const res = await api.get('/custom-designs');
            if (res.data.success) {
                const designs = res.data.data || [];
                const active = designs.find(d => !['completed', 'cancelled', 'rejected'].includes((d.status || '').toLowerCase()));
                if (active) {
                    setActiveCustomDesign(active);
                }
            }
        } catch (error) {
            console.error('Failed to fetch custom designs', error);
        }
    };

    // Find the latest active order (not delivered or cancelled)
    const activeOrder = (orders || []).find(o =>
        !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-24 md:pb-8 font-sans selection:bg-[#843D9B] selection:text-white">
            <div className="fixed inset-0 bg-white -z-10" />

            {/* 1. Header & Location */}
            <HomeHeader user={user || { name: 'Guest' }} />

            {/* White Overlapping Container — sits cleanly below header */}
            <div className="bg-white rounded-t-[2rem] relative z-30 -mt-4 pt-2 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.08)]">
                {/* 2. Hero Banner */}
                <PromoBanner />

            {/* 3. AI Measurement */}
            <AIMeasurementCard />

            {/* 4. Quick Actions */}
            <QuickActions />

            {/* 5. What We Offer */}
            <ServiceGrid />

            {/* 6. Trending Categories */}
            <TrendingCategories />

            {/* 7. Active Order (Untouched) */}
            {activeOrder && <ActiveOrderBanner order={activeOrder} />}

            {/* 7.5 Active Custom Design Notification */}
            {activeCustomDesign && (
                <div 
                    onClick={() => navigate('/user/orders')}
                    className="mx-4 md:mx-6 lg:mx-8 mb-6 bg-gradient-to-r from-[#843D9B] to-[#6b2f7d] rounded-2xl p-4 text-white shadow-lg shadow-[#843D9B]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Wand2 size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm leading-tight">
                                Custom Order {activeCustomDesign.status === 'quote_received' ? 'Quote Received!' : 'Update'}
                            </h4>
                            <p className="text-xs text-white/90 mt-0.5 leading-tight">
                                {activeCustomDesign.status === 'quote_received' 
                                    ? `Tailor has sent a quote of ₹${activeCustomDesign.quote?.price || 0}. Tap to pay.`
                                    : `Your custom design is currently ${(activeCustomDesign.status || 'pending').replace('_', ' ')}.`}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-white/80 shrink-0" />
                </div>
            )}

            {/* 8. Expert Tailors Near You */}
            <PopularTailors />

            {/* 9. Trust Section */}
            <TrustSection />

            {/* 10. Why Choose Sewzella? */}
            <WhyChooseUs />

            {/* 11. Refer & Earn */}
            <ReferEarnBanner />

            {/* 12. Bottom Navigation */}
            <BottomNav />
            </div>
        </div>
    );
};

export default Home;
