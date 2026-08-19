import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const WhatWeOffer = () => {
    const navigate = useNavigate();

    const services = [
        {
            label: 'Tailors',
            imgSrc: '/icons/service_icon_0.png',
            path: '/user/tailors',
            desc: 'Find expert tailors near you'
        },
        {
            label: 'My Orders',
            imgSrc: '/icons/offer_my_orders.png',
            path: '/user/orders',
            desc: 'Track and manage your orders'
        },
        {
            label: 'Stitching',
            imgSrc: '/icons/service_icon_1.png',
            path: '/user/services',
            desc: 'Custom stitching services'
        },
        {
            label: 'Style Add-ons',
            imgSrc: '/icons/service_icon_2.png',
            path: '/user/embellishments',
            desc: 'Enhance your outfits'
        },
        {
            label: 'Bridal',
            imgSrc: '/icons/service_icon_3.png',
            path: '/user/tailors?service=bridal',
            desc: 'Exclusive bridal collections'
        },
        {
            label: 'Bulk Order',
            imgSrc: '/icons/offer_bulk_order.png',
            path: '/user/bulk-order',
            desc: 'Corporate and group orders'
        },
        {
            label: 'Embroidery',
            imgSrc: '/icons/offer_embroidery.png',
            path: '/user/embroidery',
            desc: 'Custom embroidery designs'
        },
        {
            label: 'Alteration',
            imgSrc: '/icons/offer_alteration.png',
            path: '/user/alteration',
            desc: 'Perfect fit alterations'
        },
        {
            label: 'Custom Design',
            imgSrc: '/icons/offer_custom_design.png',
            path: '/user/custom-design',
            desc: 'Design your dream outfit'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm px-4 py-4 flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">What We Offer</h1>
            </div>

            {/* Grid Content */}
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {services.map((service, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(service.path)}
                            className="bg-white rounded-3xl p-4 sm:p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F3EAFF] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                <img src={service.imgSrc} alt={service.label} className="w-[85%] h-[85%] object-contain object-top mix-blend-multiply -mt-1" />
                            </div>
                            <h3 className="font-black text-gray-900 text-[11px] sm:text-sm uppercase tracking-wider mb-1 sm:mb-2 group-hover:text-[#843D9B] transition-colors">{service.label}</h3>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium leading-relaxed">{service.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default WhatWeOffer;
