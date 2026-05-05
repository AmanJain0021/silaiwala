import React, { useEffect } from 'react';
// Components
import HomeHeader from '../components/HomeHeader';
import LocationBar from '../components/LocationBar';
import QuickActions from '../components/QuickActions';
import PopularTailors from '../components/PopularTailors';
import ServiceGrid from '../components/ServiceGrid';
import BottomNav from '../components/BottomNav';
import PromoBanner from '../components/PromoBanner';
import ActiveOrderBanner from '../components/ActiveOrderBanner';

import WhyChooseUs from '../components/WhyChooseUs';

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
        <div className="min-h-screen bg-[#F7F8FC] pb-24 font-sans selection:bg-[#2D2F6E] selection:text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10" />

            {/* 1. Header & Location */}
            <HomeHeader user={user || { name: 'Guest' }} />
            <LocationBar />

            <PromoBanner />
            <QuickActions />

            {activeOrder && <ActiveOrderBanner order={activeOrder} />}

            <PopularTailors />

            <ServiceGrid />
            <WhyChooseUs />

            {/* 8. Bottom Navigation */}
            <BottomNav />
        </div>
    );
};

export default Home;
