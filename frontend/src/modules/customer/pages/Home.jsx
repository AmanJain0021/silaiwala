import React, { useEffect } from 'react';
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
    const { orders, fetchOrders } = useOrderStore();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Find the latest active order (not delivered or cancelled)
    const activeOrder = orders.find(o =>
        !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-24 md:pb-8 font-sans selection:bg-[#843D9B] selection:text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10" />

            {/* 1. Header & Location */}
            <HomeHeader user={user || { name: 'Guest' }} />

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
    );
};

export default Home;
