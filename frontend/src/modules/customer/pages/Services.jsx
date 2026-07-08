import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ServicesHeader from '../components/services/ServicesHeader';
import ServicesGrid from '../components/services/ServicesGrid';
import DeliveryComparison from '../components/services/DeliveryComparison';
import CustomRequestBanner from '../components/services/CustomRequestBanner';
import FAQSection from '../components/services/FAQSection';

const Services = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const initialFilter = location.state?.filter || 'All';

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilter, setActiveFilter] = useState(initialFilter);

    // Update filter if navigated again with a different state
    useEffect(() => {
        if (location.state?.filter) {
            setActiveFilter(location.state.filter);
        }
        const currentSearch = new URLSearchParams(location.search).get('search');
        if (currentSearch !== null) {
            setSearchQuery(currentSearch);
        }
    }, [location.state, location.search]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] pb-20 md:pb-8 font-sans">
            {/* Sticky Header */}
            <ServicesHeader 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
            />

            {/* Main Content */}
            <ServicesGrid 
                searchQuery={searchQuery}
                activeFilter={activeFilter}
            />

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
