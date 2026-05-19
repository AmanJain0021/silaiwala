import React from 'react';
import BottomNav from '../components/BottomNav';
import ServicesHeader from '../components/services/ServicesHeader';
import ServicesGrid from '../components/services/ServicesGrid';
import DeliveryComparison from '../components/services/DeliveryComparison';
import CustomRequestBanner from '../components/services/CustomRequestBanner';
import FAQSection from '../components/services/FAQSection';

const Services = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] pb-20 md:pb-8 font-sans">
            {/* Sticky Header */}
            <ServicesHeader />

            {/* Main Content */}
            <ServicesGrid />

            {/* Delivery Comparison */}
            <DeliveryComparison />

            {/* Popular Scroll (Reusing QuickActions logic but for services if needed, for now Grid suffices) */}

            {/* Custom Request Banner */}
            <CustomRequestBanner />

            {/* FAQ */}
            <FAQSection />

            {/* Sticky Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default Services;
